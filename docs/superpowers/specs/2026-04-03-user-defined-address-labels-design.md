# Design Spec: User-Defined Address Labels

## Goal
Replace the hardcoded "Saved Address" display in the mobile application with user-defined labels (e.g., Home, Work, Mom's House, My Condo) to improve address management and selection speed.

## User Review Required
> [!IMPORTANT]
> The `user_addresses` table already contains a `label` column. This design leverages that column without requiring a database migration, but it will change how addresses are displayed across the entire app.

## Proposed Changes

### 1. Frontend: Address Management Flow

#### [MODIFY] [add-address.tsx](file:///Users/mac/Downloads/ServEase-mobile-test-feat-api-integration-althea/frontend/app/add-address.tsx)
- **New State:** Add `label` state (String), defaulting to "Home".
- **UI Update:** Add an `AppTextInput` for "Location Label" at the top of the form.
- **Functionality:** 
    - Include common quick-select chips (Home, Work, Other).
    - If "Other" is selected, focus a text input for a custom label.
    - Pass the `label` to the `addAddress` service call.
    - Include the `label` in the `newAddress` parameter when returning to the booking form.

#### [MODIFY] [edit-address.tsx](file:///Users/mac/Downloads/ServEase-mobile-test-feat-api-integration-althea/frontend/app/edit-address.tsx)
- **UI Update:** Add the same "Location Label" field as in the add-address screen.
- **Functionality:** Pre-populate with the existing label from the database.

#### [MODIFY] [manage-addresses.tsx](file:///Users/mac/Downloads/ServEase-mobile-test-feat-api-integration-althea/frontend/app/manage-addresses.tsx)
- **UI Update:** Replace the hardcoded "Saved Address" text with `address.label`.
- **Icon Logic:** Implement a helper function `getAddressIcon(label)` that returns:
    - `home-outline` if label contains "home" (case-insensitive).
    - `business-outline` if label contains "work" or "office".
    - `location-outline` for all other labels.

### 2. Frontend: Booking Flow

#### [MODIFY] [customer-booking-form.tsx](file:///Users/mac/Downloads/ServEase-mobile-test-feat-api-integration-althea/frontend/app/customer-booking-form.tsx)
- **LoadAddresses:** Update the mapping in `loadAddresses` to use `item.label` instead of the hardcoded `'Home'`.
- **UI Update:** In the address selection modal, display the `label` prominently and the street address as secondary text.
- **Parameter Handling:** Update the `useEffect` that handles `params.newAddress` to extract and use the `label` passed back from the add-address screen.

## Verification Plan

### Automated Tests
- N/A (Unit tests not currently implemented in this project skeleton).

### Manual Verification
1. **Add Address:** Create a new address with a custom label (e.g., "Gym"). Verify it appears as "Gym" in the list.
2. **Edit Address:** Change "Gym" to "Fitness Center". Verify the change persists.
3. **Booking Flow:** 
    - Start a booking.
    - Select a custom-labeled address. Verify the label appears in the "Location" section of the booking form.
    - Add a new address during the booking flow. Verify that the custom label is immediately visible upon return to the form.
4. **Icons:** Verify that addresses labeled "Home" show a house icon and "Office" show a building icon.
