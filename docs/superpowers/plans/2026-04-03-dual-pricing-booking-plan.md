# Dual Pricing Booking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add support for hourly and flat pricing on a single provider service, with customers choosing a pricing mode during booking and the backend validating and snapshotting the chosen price.

**Architecture:** Extend `provider_services` with explicit dual-pricing fields and extend `bookings` with pricing snapshot fields. Update the provider pricing screen to manage both pricing modes, then update the booking form and booking API to become pricing-mode aware without changing unrelated service, payment, or chat flows.

**Tech Stack:** Expo Router, React Native, TypeScript, Supabase, NestJS, class-validator

---

## File Structure

### Database and schema

- Modify: `frontend/supabase/provider_profile_schema.sql`
  Purpose: add dual-pricing columns to `provider_services` for local schema maintenance.
- Create: `frontend/supabase/dual_pricing_booking_schema.sql`
  Purpose: additive migration for `provider_services` and `bookings` pricing fields and constraints.

### Frontend provider pricing

- Modify: `frontend/app/(provider-tabs)/pricing.tsx`
  Purpose: let providers enable hourly and flat pricing per service and set both values safely.

### Frontend booking

- Modify: `frontend/app/customer-booking-form.tsx`
  Purpose: show pricing-mode selection, hourly hours picker, and mode-aware totals.
- Modify: `frontend/services/bookingService.ts`
  Purpose: send pricing-mode aware booking payloads.

### Backend booking

- Modify: `backend/src/modules/booking/dto/create-booking.dto.ts`
  Purpose: accept pricing mode and mode-specific fields.
- Modify: `backend/src/modules/booking/booking.service.ts`
  Purpose: validate supported pricing mode and snapshot the correct total.

### Backend service reads

- Modify: `backend/src/modules/services/services.service.ts`
  Purpose: expose new pricing fields to customer-facing service fetches.
- Modify: `backend/src/modules/provider/provider.service.ts`
  Purpose: include new pricing fields in provider booking/detail reads where needed.

### Verification

- Test manually against:
  - `frontend/app/(provider-tabs)/pricing.tsx`
  - `frontend/app/customer-booking-form.tsx`
  - `backend/src/modules/booking/booking.service.ts`

---

### Task 1: Add Explicit Dual-Pricing Fields To The Data Model

**Files:**
- Create: `frontend/supabase/dual_pricing_booking_schema.sql`
- Modify: `frontend/supabase/provider_profile_schema.sql`
- Test: run SQL in Supabase SQL editor or local SQL workflow

- [ ] **Step 1: Write the failing schema check**

Use this verification query before the migration:

```sql
select
  column_name
from information_schema.columns
where table_schema in ('public', 'provider_catalog_svc', 'booking_svc')
  and table_name in ('provider_services', 'bookings')
  and column_name in (
    'supports_hourly',
    'hourly_rate',
    'supports_flat',
    'flat_rate',
    'default_pricing_mode',
    'pricing_mode'
  )
order by table_name, column_name;
```

Expected before migration: missing some or all of the requested columns.

- [ ] **Step 2: Run the schema check and confirm it fails the desired state**

Run the query above.
Expected: the new pricing columns are not all present yet.

- [ ] **Step 3: Add the additive SQL migration**

Create `frontend/supabase/dual_pricing_booking_schema.sql` with:

```sql
alter table public.provider_services
  add column if not exists supports_hourly boolean not null default true,
  add column if not exists hourly_rate numeric(10,2),
  add column if not exists supports_flat boolean not null default false,
  add column if not exists flat_rate numeric(10,2),
  add column if not exists default_pricing_mode text;

update public.provider_services
set hourly_rate = coalesce(hourly_rate, price)
where hourly_rate is null;

update public.provider_services
set default_pricing_mode = coalesce(default_pricing_mode, 'hourly')
where default_pricing_mode is null;

alter table public.provider_services
  add constraint provider_services_default_pricing_mode_check
  check (
    default_pricing_mode is null
    or default_pricing_mode in ('hourly', 'flat')
  );

alter table public.provider_services
  add constraint provider_services_supported_pricing_check
  check (supports_hourly or supports_flat);

alter table public.provider_services
  add constraint provider_services_hourly_rate_check
  check (
    (not supports_hourly)
    or (hourly_rate is not null and hourly_rate > 0)
  );

alter table public.provider_services
  add constraint provider_services_flat_rate_check
  check (
    (not supports_flat)
    or (flat_rate is not null and flat_rate > 0)
  );

alter table public.bookings
  add column if not exists pricing_mode text,
  add column if not exists flat_rate numeric(10,2);

update public.bookings
set pricing_mode = coalesce(pricing_mode, 'hourly')
where pricing_mode is null;

alter table public.bookings
  alter column pricing_mode set not null;

alter table public.bookings
  add constraint bookings_pricing_mode_check
  check (pricing_mode in ('hourly', 'flat'));
```

- [ ] **Step 4: Mirror the schema notes in the existing profile schema file**

Append this block to `frontend/supabase/provider_profile_schema.sql`:

```sql
alter table public.provider_services add column if not exists supports_hourly boolean not null default true;
alter table public.provider_services add column if not exists hourly_rate numeric(10,2);
alter table public.provider_services add column if not exists supports_flat boolean not null default false;
alter table public.provider_services add column if not exists flat_rate numeric(10,2);
alter table public.provider_services add column if not exists default_pricing_mode text;
alter table public.bookings add column if not exists pricing_mode text;
alter table public.bookings add column if not exists flat_rate numeric(10,2);
```

- [ ] **Step 5: Run the schema check again**

Run the query from Step 1.
Expected: all requested columns now exist.

- [ ] **Step 6: Commit**

```bash
git add frontend/supabase/dual_pricing_booking_schema.sql frontend/supabase/provider_profile_schema.sql
git commit -m "feat: add dual pricing schema fields"
```

---

### Task 2: Make Provider Pricing Configuration Support Hourly And Flat Rates

**Files:**
- Modify: `frontend/app/(provider-tabs)/pricing.tsx`
- Test: `frontend/app/(provider-tabs)/pricing.tsx`

- [ ] **Step 1: Write the failing UI checklist**

Document the desired failing cases before editing:

```text
1. Service form only supports a single generic price field.
2. Provider cannot enable both hourly and flat pricing.
3. Provider cannot set a default pricing mode.
4. Service fetch/save types do not expose dual-pricing fields.
```

Expected before change: all four statements are true.

- [ ] **Step 2: Extend the local service types**

Update the `ServiceRow` type in `frontend/app/(provider-tabs)/pricing.tsx` to:

```ts
type PricingMode = 'hourly' | 'flat';

type ServiceRow = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category_id: string;
  supports_hourly: boolean;
  hourly_rate: number | null;
  supports_flat: boolean;
  flat_rate: number | null;
  default_pricing_mode: PricingMode | null;
};
```

- [ ] **Step 3: Replace the single-price form state with pricing-mode form state**

Replace the relevant local state with:

```ts
const [supportsHourly, setSupportsHourly] = useState(true);
const [hourlyRateText, setHourlyRateText] = useState('');
const [supportsFlat, setSupportsFlat] = useState(false);
const [flatRateText, setFlatRateText] = useState('');
const [defaultPricingMode, setDefaultPricingMode] = useState<PricingMode>('hourly');
```

Update `canSubmit` to:

```ts
const canSubmit = useMemo(() => {
  const hasHourly = supportsHourly && Number(hourlyRateText) > 0;
  const hasFlat = supportsFlat && Number(flatRateText) > 0;
  return !!title.trim() && categoryIds.length > 0 && (hasHourly || hasFlat) && !isSaving;
}, [title, categoryIds, supportsHourly, hourlyRateText, supportsFlat, flatRateText, isSaving]);
```

- [ ] **Step 4: Update load and edit flows to hydrate both pricing modes**

When selecting from `provider_services`, request:

```ts
.select('id,title,description,price,category_id,supports_hourly,hourly_rate,supports_flat,flat_rate,default_pricing_mode')
```

When editing an existing row, hydrate with:

```ts
setSupportsHourly(Boolean(service.supports_hourly));
setHourlyRateText(service.hourly_rate ? String(service.hourly_rate) : '');
setSupportsFlat(Boolean(service.supports_flat));
setFlatRateText(service.flat_rate ? String(service.flat_rate) : '');
setDefaultPricingMode((service.default_pricing_mode as PricingMode | null) || 'hourly');
```

- [ ] **Step 5: Replace the single-price payload with mode-aware payloads**

Use this payload shape when saving:

```ts
const payloads = resolvedCategoryIds.map((categoryId) => ({
  provider_id: user.id,
  title: title.trim(),
  description: description.trim() || null,
  category_id: categoryId,
  price: supportsHourly ? Number(hourlyRateText) : Number(flatRateText),
  supports_hourly: supportsHourly,
  hourly_rate: supportsHourly ? Number(hourlyRateText) : null,
  supports_flat: supportsFlat,
  flat_rate: supportsFlat ? Number(flatRateText) : null,
  default_pricing_mode: supportsHourly && supportsFlat
    ? defaultPricingMode
    : supportsHourly
      ? 'hourly'
      : 'flat',
}));
```

- [ ] **Step 6: Add the pricing-mode controls to the form**

Add a focused form section like:

```tsx
<View style={styles.pricingSection}>
  <Text style={styles.sectionTitle}>Pricing Options</Text>

  <Pressable onPress={() => setSupportsHourly((value) => !value)}>
    <Text>{supportsHourly ? 'Hourly enabled' : 'Enable hourly pricing'}</Text>
  </Pressable>
  {supportsHourly ? (
    <TextInput
      value={hourlyRateText}
      onChangeText={setHourlyRateText}
      placeholder="Hourly rate"
      keyboardType="decimal-pad"
    />
  ) : null}

  <Pressable onPress={() => setSupportsFlat((value) => !value)}>
    <Text>{supportsFlat ? 'Flat rate enabled' : 'Enable flat pricing'}</Text>
  </Pressable>
  {supportsFlat ? (
    <TextInput
      value={flatRateText}
      onChangeText={setFlatRateText}
      placeholder="Flat rate"
      keyboardType="decimal-pad"
    />
  ) : null}

  {supportsHourly && supportsFlat ? (
    <View>
      <Text>Default pricing mode</Text>
      <Pressable onPress={() => setDefaultPricingMode('hourly')}>
        <Text>Hourly</Text>
      </Pressable>
      <Pressable onPress={() => setDefaultPricingMode('flat')}>
        <Text>Flat</Text>
      </Pressable>
    </View>
  ) : null}
</View>
```

- [ ] **Step 7: Verify the provider pricing screen behavior manually**

Run the app and confirm:

```text
1. Provider can enable hourly only.
2. Provider can enable flat only.
3. Provider can enable both.
4. Provider cannot save with both disabled.
5. Saved services reload with the same pricing settings.
```

- [ ] **Step 8: Commit**

```bash
git add 'frontend/app/(provider-tabs)/pricing.tsx'
git commit -m "feat: support dual pricing in provider services"
```

---

### Task 3: Make The Customer Booking Flow Pricing-Mode Aware

**Files:**
- Modify: `frontend/app/customer-booking-form.tsx`
- Modify: `frontend/services/bookingService.ts`
- Test: `frontend/app/customer-booking-form.tsx`

- [ ] **Step 1: Write the failing booking-form checklist**

Capture the broken assumptions before editing:

```text
1. Booking form reads only a single service price.
2. Booking form never asks customer to choose pricing mode.
3. Hour count is not explicitly tied to hourly pricing mode.
4. Booking request always derives hourly_rate from total/hrs.
```

Expected before change: all four statements are true.

- [ ] **Step 2: Extend service option types and queries**

Update `ServiceOption` in `frontend/app/customer-booking-form.tsx` to:

```ts
type PricingMode = 'hourly' | 'flat';

type ServiceOption = {
  id: string;
  title: string;
  price: number;
  supports_hourly: boolean;
  hourly_rate: number | null;
  supports_flat: boolean;
  flat_rate: number | null;
  default_pricing_mode: PricingMode | null;
};
```

Update the query to:

```ts
providerCatalogDb
  .from('provider_services')
  .select('id,title,price,supports_hourly,hourly_rate,supports_flat,flat_rate,default_pricing_mode')
```

- [ ] **Step 3: Add booking form state for pricing mode**

Add:

```ts
const [pricingMode, setPricingMode] = useState<PricingMode | null>(null);
const [hoursRequired, setHoursRequired] = useState('1');
```

When a service is chosen:

```ts
const selected = rows.find((row) => row.id === picked.id) || picked;
const nextMode =
  selected.supports_hourly && selected.supports_flat
    ? (selected.default_pricing_mode || null)
    : selected.supports_hourly
      ? 'hourly'
      : selected.supports_flat
        ? 'flat'
        : null;

setPricingMode(nextMode);
```

- [ ] **Step 4: Add computed pricing helpers**

Add:

```ts
const selectedService = serviceOptions.find((option) => option.id === serviceId) || null;
const hourlyRate = Number(selectedService?.hourly_rate || 0);
const flatRate = Number(selectedService?.flat_rate || 0);
const parsedHoursRequired = Math.max(1, Number(hoursRequired || 1));
const totalAmount =
  pricingMode === 'hourly'
    ? hourlyRate * parsedHoursRequired
    : pricingMode === 'flat'
      ? flatRate
      : 0;
```

- [ ] **Step 5: Render explicit pricing selection UI**

Add a booking section like:

```tsx
{selectedService ? (
  <View>
    <Text>Select pricing</Text>
    {selectedService.supports_hourly ? (
      <TouchableOpacity onPress={() => setPricingMode('hourly')}>
        <Text>Hourly - P{hourlyRate.toFixed(2)}/hr</Text>
      </TouchableOpacity>
    ) : null}
    {selectedService.supports_flat ? (
      <TouchableOpacity onPress={() => setPricingMode('flat')}>
        <Text>Flat Rate - P{flatRate.toFixed(2)}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
) : null}

{pricingMode === 'hourly' ? (
  <View>
    <Text>Number of hours</Text>
    <TextInput
      value={hoursRequired}
      onChangeText={(value) => setHoursRequired(value.replace(/[^0-9]/g, '') || '1')}
      keyboardType="number-pad"
    />
  </View>
) : null}
```

- [ ] **Step 6: Make the booking request payload mode-aware**

Update `frontend/services/bookingService.ts` request logic to:

```ts
const pricingMode = bookingData.pricing_mode as 'hourly' | 'flat';
const hourlyRate = Number(serviceRow.hourly_rate || 0);
const flatRate = Number(serviceRow.flat_rate || 0);
const hoursRequired = Math.max(1, Number(bookingData.hours_required || 1));

if (pricingMode === 'hourly' && !serviceRow.supports_hourly) {
  throw new Error('This service does not support hourly pricing.');
}

if (pricingMode === 'flat' && !serviceRow.supports_flat) {
  throw new Error('This service does not support flat pricing.');
}

const inserted = await api.post<any>('/booking/create', {
  provider_id: providerId,
  service_id: serviceRow.id,
  service_address: bookingData.service_address || bookingData.address || '',
  scheduled_at: scheduledAt.toISOString(),
  pricing_mode: pricingMode,
  hourly_rate: pricingMode === 'hourly' ? hourlyRate : undefined,
  flat_rate: pricingMode === 'flat' ? flatRate : undefined,
  hours_required: pricingMode === 'hourly' ? hoursRequired : undefined,
});
```

- [ ] **Step 7: Verify the booking UI manually**

Run the app and confirm:

```text
1. Dual-pricing service shows both pricing options.
2. Flat-rate booking does not ask for hours.
3. Hourly booking requires hours.
4. Displayed total changes with pricing mode and selected hours.
```

- [ ] **Step 8: Commit**

```bash
git add frontend/app/customer-booking-form.tsx frontend/services/bookingService.ts
git commit -m "feat: add dual pricing to booking flow"
```

---

### Task 4: Update Backend Booking Validation And Price Snapshotting

**Files:**
- Modify: `backend/src/modules/booking/dto/create-booking.dto.ts`
- Modify: `backend/src/modules/booking/booking.service.ts`
- Modify: `backend/src/modules/services/services.service.ts`
- Modify: `backend/src/modules/provider/provider.service.ts`
- Test: backend booking creation flow

- [ ] **Step 1: Write the failing backend checklist**

Capture the old behavior:

```text
1. Booking DTO requires hourly_rate and hours_required for every booking.
2. Backend computes total only as hourly_rate * hours_required.
3. Backend does not validate supported pricing modes from provider_services.
4. Service fetches do not expose dual-pricing fields to the frontend.
```

Expected before change: all four statements are true.

- [ ] **Step 2: Update the booking DTO**

Replace `backend/src/modules/booking/dto/create-booking.dto.ts` with:

```ts
import { IsString, IsNotEmpty, IsNumber, IsDateString, IsIn, IsOptional, Min } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  provider_id: string;

  @IsString()
  @IsNotEmpty()
  service_id: string;

  @IsString()
  @IsNotEmpty()
  service_address: string;

  @IsDateString()
  @IsNotEmpty()
  scheduled_at: string;

  @IsString()
  @IsIn(['hourly', 'flat'])
  pricing_mode: 'hourly' | 'flat';

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourly_rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  flat_rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  hours_required?: number;
}
```

- [ ] **Step 3: Update booking creation to validate pricing mode against the service row**

In `backend/src/modules/booking/booking.service.ts`, fetch:

```ts
const { data: serviceRecord, error: serviceError } = await this.catalogDb
  .from('provider_services')
  .select('id,provider_id,supports_hourly,hourly_rate,supports_flat,flat_rate')
  .eq('id', dto.service_id)
  .single();
```

Then validate and compute:

```ts
if (serviceError || !serviceRecord) {
  throw new NotFoundException('Service not found.');
}

if (serviceRecord.provider_id !== dto.provider_id) {
  throw new BadRequestException('Service does not belong to the selected provider.');
}

let totalAmount = 0;
let hourlyRate: number | null = null;
let flatRate: number | null = null;
let hoursRequired: number | null = null;

if (dto.pricing_mode === 'hourly') {
  if (!serviceRecord.supports_hourly || !serviceRecord.hourly_rate) {
    throw new BadRequestException('This service does not support hourly pricing.');
  }
  hourlyRate = Number(serviceRecord.hourly_rate);
  hoursRequired = Math.max(1, Number(dto.hours_required || 1));
  totalAmount = hourlyRate * hoursRequired;
} else {
  if (!serviceRecord.supports_flat || !serviceRecord.flat_rate) {
    throw new BadRequestException('This service does not support flat pricing.');
  }
  flatRate = Number(serviceRecord.flat_rate);
  totalAmount = flatRate;
}
```

- [ ] **Step 4: Snapshot pricing fields into the booking row**

Update the insert payload to:

```ts
.insert([{
  booking_reference: bookingRef,
  customer_id: customerId,
  provider_id: dto.provider_id,
  service_id: dto.service_id,
  service_address: dto.service_address,
  scheduled_at: dto.scheduled_at,
  pricing_mode: dto.pricing_mode,
  hourly_rate: hourlyRate,
  flat_rate: flatRate,
  hours_required: hoursRequired,
  total_amount: totalAmount,
  status: 'pending',
}])
```

- [ ] **Step 5: Expose new service pricing fields to frontend readers**

In backend service fetches, add:

```ts
select('id,title,price,description,supports_hourly,hourly_rate,supports_flat,flat_rate,default_pricing_mode')
```

Apply this to the relevant service lookups in:

- `backend/src/modules/services/services.service.ts`
- `backend/src/modules/provider/provider.service.ts`

- [ ] **Step 6: Verify the backend behavior**

Run the backend and confirm:

```text
1. Hourly booking succeeds for hourly-supported service.
2. Flat booking succeeds for flat-supported service.
3. Unsupported pricing mode is rejected.
4. Stored booking keeps pricing_mode and total_amount snapshot fields.
```

- [ ] **Step 7: Commit**

```bash
git add backend/src/modules/booking/dto/create-booking.dto.ts backend/src/modules/booking/booking.service.ts backend/src/modules/services/services.service.ts backend/src/modules/provider/provider.service.ts
git commit -m "feat: validate and snapshot dual pricing bookings"
```

---

### Task 5: Regression Pass And Final Verification

**Files:**
- Modify: any small follow-up fixes from verification only
- Test: frontend and backend verification commands

- [ ] **Step 1: Run frontend lint and record unrelated failures**

Run:

```bash
cd frontend && npm run lint
```

Expected: current repo may still contain pre-existing lint failures outside this feature. Record which ones are unrelated before making follow-up edits.

- [ ] **Step 2: Run backend tests or at minimum build validation**

Run:

```bash
cd backend && npm run build
```

Expected: backend compiles with the new DTO and booking logic.

- [ ] **Step 3: Run an end-to-end manual scenario checklist**

Verify:

```text
1. Provider creates a service with hourly only.
2. Provider creates a service with flat only.
3. Provider creates a service with both modes.
4. Customer sees both modes on dual-priced services.
5. Customer books flat without entering hours.
6. Customer books hourly with chosen hours.
7. Booking total and stored snapshot match the chosen mode.
```

- [ ] **Step 4: Apply only the minimal verification fixes**

Use this rule:

```text
Fix only issues discovered by the dual-pricing flow.
Do not refactor unrelated screens or lint warnings during this step.
```

- [ ] **Step 5: Commit**

```bash
git add frontend backend
git commit -m "test: verify dual pricing booking flow"
```

---

## Self-Review

### Spec Coverage

- Dual-pricing service definition: covered in Tasks 1 and 2.
- Customer must choose pricing mode when both exist: covered in Task 3.
- Flat bookings use time slot only: covered in Tasks 3 and 4.
- Hourly bookings require customer-selected hours: covered in Task 3.
- Backend validates chosen mode and snapshots price: covered in Task 4.
- Migration and verification strategy: covered in Tasks 1 and 5.

### Placeholder Scan

- No `TODO` or `TBD` markers remain.
- Every task names exact files.
- Every code-edit step includes concrete snippets.
- Every verification step includes exact commands or checklists.

### Type Consistency

- Shared pricing mode uses `'hourly' | 'flat'` across provider UI, booking form, DTO, and backend logic.
- Service pricing fields are consistently named `supports_hourly`, `hourly_rate`, `supports_flat`, `flat_rate`, and `default_pricing_mode`.
- Booking snapshot fields are consistently named `pricing_mode`, `hourly_rate`, `flat_rate`, `hours_required`, and `total_amount`.
