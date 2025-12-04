# Chest System & SuperAdmin Fixes

## SuperAdmin Access
- **User:** `marc.pozanco@gmail.com`
- **Action:** Promoted to `SuperAdmin` role in the database.
- **Impact:** This user now has full access permissions defined in the RBAC system.

## Battle Deck & Chest System
- **Issue:** The Battle Deck was empty, and chests were not visible/functional.
- **Fixes:**
    1.  **UI Implementation:** Added a "Chest Slots" section to the `Battle Deck` page (`app/cards/page.tsx`).
    2.  **Store Logic:** Implemented `openChest`, `startUnlockChest`, and `addChest` actions in `usePlayerStore`.
    3.  **Rewards:** Opening a chest now grants Gold, Gems, and Cards.

## SuperAdmin Features (Testing)
- **Infinite Chests:** When a SuperAdmin opens a chest, a new one immediately appears in the slot, allowing for continuous testing of the opening mechanic.
- **Debug Spawn:** SuperAdmins can click on an **EMPTY** chest slot to instantly spawn a new Locked Chest.
- **Instant Open:** SuperAdmins can open chests immediately (skipping the timer) if the chest is in `UNLOCKING` state (logic added to UI handler).

## Technical Details
- **Role Fetching:** Updated `loadProfile` to fetch the user's role name from the `app_roles` table.
- **Type Definition:** Updated `PlayerProfile` interface to include the `role` field.
