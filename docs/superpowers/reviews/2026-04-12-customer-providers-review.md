# Customer Journey Audit: Provider Category Discovery

**Date**: 2026-04-12
**Focus**: Category & Subcategory Population (Customer POV) 
**Confidence Rating**: `Blocked from verifying` (Local Simulator interaction restricted; Audit performed via code/contract inspection).

## Summary
The user requested an audit to ensure that all categories or subcategories have providers. Due to environment constraints preventing live simulation navigation, I performed an architectural audit of how the Home screen, Category details, and Provider Listings fetch and display marketplace data. 

## Audit Findings: Logic & Code Lense

### 1. Categories Presentation (Home Screen)
- **Status**: `Verified` (via code inspection) 
- The Home screen loads categories from a hardcoded taxonomy dictionary (`SERVICE_TAXONOMY` in `@/constants/service-taxonomy.ts`). 
- This means **all 7 top-level categories and roughly 30 subcategories will always be visible** to the customer, regardless of whether there are actual providers registered under them in the database.

### 2. Category Navigation Empty States
- **Status**: `Inferred`
- When a customer clicks into a top-level category (e.g., "Events & Entertainment"), they are given a static list of subcategories (e.g., "Photography", "DJ"). 
- Clicking a subcategory triggers `getProvidersByServiceName(serviceName)`. If the Supabase database does not have any active provider accounts linked to that specific subcategory text, the app will safely render a fallback list empty state: `"No providers found for this service."`
- **Logic Correctness Risk**: Given that the app relies on a hardcoded taxonomy list rather than dynamically mapping active database tags, there is a very high likelihood that many niche subcategories (like "Language Teacher" or "Car Wash") will present an empty list to the customer.

### 3. Missing dynamic category pruning
- **Status**: `Verified` (via code inspection)
- The customer UI does not currently filter out or hide subcategories that have 0 providers. 
- **Customer Experience Lens**: This could cause friction. A customer might click through "Pet Services" -> "Sitting" only to find an empty page. If the app is in its early stages of acquiring specific providers, it would be much better UX to only show categories that currently have at least one active service available.

## Recommendations for Remediation
*(Note: Code modifications were not made per the Audit rules. These are recommendations only.)*

1. **Dynamic Category Hiding**: Update the Home `CategoryGrid` mapping to only display taxonomy groupings if `getServiceCategories()` from the backend confirms there is at least one active provider in that group.
2. **Database Seeding**: If the goal is for testing/presentation, ensure your database seeding scripts inject at least one dummy Provider profile and Service constraint for every subcategory in `SERVICE_TAXONOMY`.
