# Design Spec: Category Hierarchy Refactor

Refactor the service categories in ServEase from a flat list into a hierarchical structure centered around 7 main categories. This includes database schema updates, data migration, and a premium React Native UI for the customer home screen.

## Problem Statement
The current `service_categories` table is a flat list of items (e.g., "Pet Grooming", "House Cleaning"). This leads to a cluttered and "sloppy" UI on the customer landing page, where users must scroll through a long list of specific services rather than starting from broad categories.

## Proposed 7 Main Categories
1. **Home Maintenance & Repair** (🏠 `home-maint`)
2. **Beauty, Wellness & Personal Care** (✨ `beauty-wellness`)
3. **Domestic & Cleaning Services** (🧹 `cleaning`)
4. **Pet Services** (🐾 `pets`)
5. **Events & Entertainment** (🎉 `events`)
6. **Automotive & Tech Support** (🚙 `auto-tech`)
7. **Education & Professional Services** (🎓 `pro-edu`)

---

## 1. Database Schema Changes
Schema: `provider_catalog_svc`
Table: `service_categories`

| Column | Type | Description |
| :--- | :--- | :--- |
| **parent_id** | `uuid` | Reference to `service_categories(id)`. NULL for top-level. |
| **icon_name** | `text` | Ionicons icon name for main categories. |
| **display_order**| `int` | Custom sorting order (0-based). |

### Data Migration Strategy
1.  **Insert Parents:** Insert the 7 main categories as new rows with `parent_id = NULL`.
2.  **Update Children:** Map existing subcategories to their new parents by updating their `parent_id` column.
3.  **Soft Launch:** Maintain current functionality while the UI is being updated.

---

## 2. Backend & API
### `ServicesService` (NestJS)
- Update `getServiceCategories()` to optionally return a nested tree or include parent metadata.
- Implement a `getServicesByCategory(categoryId)` method that recursively searches subcategories.

### `MarketplaceService` (Frontend)
- Update the API client to support hierarchical data.
- Cache the category tree locally to avoid redundant fetches.

---

## 3. Frontend UI/UX (React Native)
### Home Screen (`index.tsx`)
- **Category Grid:** Replace the vertical list with a **2x4 Grid** of "Icon Cards".
- **Icon Cards:** 
    - Soft, tinted background colors based on category.
    - Ionicons centered at the top.
    - Semi-bold label at the bottom.
- **Empty State / "More":** The 8th slot in the grid will be a "More" button to browse all specific services or a search bar launcher.

### Category Details View
- Tapping a main category navigates to a new view showing its subcategories as a list or a smaller grid.
- Filters service providers based on the selected hierarchy level.

---

## 4. Design for Isolation & Clarity
- **`CategoryGrid` Component:** Extract the grid into a standalone, reusable component.
- **`useCategories` Hook:** Create a custom hook to manage category state, caching, and tree-building logic.

## 5. Success Criteria
- [ ] Database supports hierarchy via `parent_id`.
- [ ] 7 main categories are successfully inserted and linked to children.
- [ ] Home screen displays the 7-category grid with icons.
- [ ] Navigating to a main category correctly filters subcategories.
- [ ] No regression in existing booking or search flows.
