# Dual Pricing Booking Design

## Goal

Refactor the booking flow so a provider service can support both hourly and flat pricing, with the customer explicitly choosing the pricing mode during booking.

This design replaces the current assumption that every booking is hourly. The system should support:

- `hourly` pricing where the customer chooses the number of hours up front
- `flat` pricing where the customer books a time slot only
- stable booking price snapshots so historical bookings are not changed by later service price edits

## Current State

The current flow is centered around a single `price` field on `provider_services`.

- Provider pricing UI stores one `price` per service.
- Customer booking selects a service and uses that price to build a booking.
- Booking creation sends `hourly_rate` and `hours_required`.
- Backend computes `total_amount = hourly_rate * hours_required`.

This creates an implicit rule that every service is hourly, even when a service would be better represented as a flat-rate job.

## Chosen Approach

Use dual-price fields on each `provider_service`.

Each provider service will be able to declare whether it supports hourly pricing, flat pricing, or both. The customer must choose one supported pricing mode during booking.

This approach is preferred over a separate pricing-options table because it fits the current codebase shape:

- the pricing UI already edits service-level pricing
- the booking form already resolves a single `provider_services` row
- the backend already creates bookings from a single `service_id`

## Data Model Design

### Provider Services

Extend `provider_services` so pricing is explicit rather than inferred.

Suggested fields:

- `supports_hourly boolean not null default false`
- `hourly_rate numeric null`
- `supports_flat boolean not null default false`
- `flat_rate numeric null`
- `default_pricing_mode text null`

Constraints:

- at least one of `supports_hourly` or `supports_flat` must be true
- `hourly_rate` is required when `supports_hourly = true`
- `flat_rate` is required when `supports_flat = true`
- `default_pricing_mode` must be one of `hourly` or `flat` when both modes are supported

The old `price` field should not remain the source of truth for booking logic. It may be temporarily preserved during migration, but the refactor should move application reads and writes to explicit pricing-mode fields.

### Bookings

Extend `bookings` so each booking records how it was priced.

Suggested fields:

- `pricing_mode text not null`
- `hourly_rate numeric null`
- `flat_rate numeric null`
- `hours_required integer null`
- `total_amount numeric not null`

Booking rules:

- hourly bookings store `pricing_mode = 'hourly'`, `hourly_rate`, `hours_required`, and computed `total_amount`
- flat bookings store `pricing_mode = 'flat'`, `flat_rate`, and computed `total_amount`
- flat bookings should not require `hours_required`

These booking fields are snapshots, not live references to provider pricing. If the provider changes a service rate later, existing bookings must remain unchanged.

## Provider Pricing UX

The provider pricing page should move from “one price per service” to “pricing capabilities per service.”

Each service should support configuration of:

- service title
- service description
- category
- hourly pricing enabled/disabled
- hourly rate
- flat pricing enabled/disabled
- flat rate
- default pricing mode when both are enabled

Validation:

- at least one pricing mode must be enabled
- every enabled pricing mode must have a valid positive amount
- if both are enabled, the provider should choose which mode is the default option shown to customers

UX expectations:

- use two explicit pricing controls for `Hourly` and `Flat Rate`
- show only the inputs relevant to enabled modes
- keep the form understandable for providers who offer only one pricing model

## Customer Booking UX

The booking form should always present pricing mode as an explicit choice whenever a service supports both models.

Booking flow:

1. Customer selects a service.
2. The UI loads the service’s supported pricing modes.
3. If only one mode is supported, it is preselected and locked.
4. If both modes are supported, both options are shown side by side and the customer must choose one.
5. The rest of the form adapts to the chosen pricing mode.

### Flat-Rate Flow

Flat-rate bookings require:

- date
- time slot
- address
- notes
- attachments if relevant

Flat-rate bookings do not ask for hours. The total shown to the customer is the service’s flat rate.

### Hourly Flow

Hourly bookings require:

- date
- time slot
- number of hours
- address
- notes
- attachments if relevant

The total shown to the customer is:

`hourly_rate * hours_required`

The customer chooses hours up front before submitting the booking.

## Backend Contract

The booking API should become pricing-mode aware instead of assuming hourly bookings only.

Suggested request contract:

- `provider_id`
- `service_id`
- `service_address`
- `scheduled_at`
- `pricing_mode`
- `hourly_rate?`
- `flat_rate?`
- `hours_required?`

Backend validation rules:

- if `pricing_mode = 'hourly'`, require `hourly_rate` and `hours_required`
- if `pricing_mode = 'flat'`, require `flat_rate`
- if `pricing_mode = 'flat'`, ignore or reject `hours_required`
- verify the selected service actually supports the chosen pricing mode
- compute `total_amount` on the backend instead of trusting client-computed totals

The backend must use the provider service row as the source of truth for whether hourly and/or flat pricing is supported.

## Refactor Boundaries

This refactor should be kept focused on pricing and booking.

In scope:

- service pricing data model
- provider pricing management
- booking form pricing selection
- booking DTO and booking creation logic
- booking detail rendering where pricing labels or totals are shown

Out of scope for this refactor:

- promotional pricing
- pricing tiers beyond hourly and flat
- surge pricing
- discounts and coupons
- post-booking repricing rules

## Migration Strategy

The safest migration is incremental.

1. Add new pricing fields to `provider_services`.
2. Backfill existing services so today’s `price` becomes either:
   - `hourly_rate` with `supports_hourly = true`, or
   - another explicit temporary default chosen by the migration strategy.
3. Add new pricing fields to `bookings`.
4. Update backend booking creation to support both models.
5. Update provider pricing UI.
6. Update customer booking UI.
7. Move read paths to the new fields.
8. Retire or ignore the old generic `price` field once no longer needed.

Because current booking logic is hourly-based, the cleanest default migration is to interpret legacy `price` as `hourly_rate` for existing services unless business rules say otherwise.

## Error Handling

Expected validation failures:

- service supports only flat pricing but customer submits hourly
- service supports only hourly pricing but customer submits flat
- hourly selected without hours
- enabled provider pricing mode missing a rate
- provider service has invalid pricing configuration

Customer-facing messages should explain the problem in terms of the chosen pricing mode, not generic booking failure language.

## Testing Strategy

Minimum required coverage:

- provider can save a service with hourly only
- provider can save a service with flat only
- provider can save a service with both modes
- customer can book a flat-rate service using a time slot only
- customer can book an hourly service using selected hours
- customer can book a dual-pricing service in either mode
- backend rejects unsupported pricing-mode submissions
- backend computes total correctly for hourly bookings
- backend computes total correctly for flat bookings
- existing bookings remain unchanged after provider pricing edits

## Architecture Notes

This refactor should remove pricing assumptions from shared booking code.

Preferred separation:

- service pricing definition lives on `provider_services`
- customer booking state stores the user’s chosen pricing mode and mode-specific inputs
- backend booking creation validates and snapshots price data

Avoid keeping logic that derives hourly semantics from a generic `price` field. That pattern is the main source of ambiguity in the current design.

## Success Criteria

The refactor is successful when:

- a single service can support both hourly and flat pricing
- customers must choose a pricing mode when both are available
- flat-rate bookings require only a time slot, not a duration
- hourly bookings require customer-selected hours
- backend validation enforces the chosen pricing mode correctly
- booking totals are stored as historical snapshots
