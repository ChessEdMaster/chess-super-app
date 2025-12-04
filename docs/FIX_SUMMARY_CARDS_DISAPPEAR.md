# Fix Summary: Cards & Chests Disappearing

## Issue
- **Symptom:** When loading the Battle Deck page, cards and chests would appear for a split second (from default state) and then disappear.
- **Cause:** The `loadProfile` function in `player-store.ts` was overwriting the default state with data from the database. Since the database contained empty arrays (`[]`) for `cards` and `chests` (for new or reset users), the store was being updated to have no cards and no chest slots.

## Fix
- **Logic Update:** Modified `loadProfile` in `lib/store/player-store.ts`.
    - **Cards:** If the DB returns an empty array (or null), we now explicitly fallback to `DEFAULT_CARDS`. This ensures users always start with the base set of cards.
    - **Chests:** If the DB returns an empty array (or null), we fallback to `[null, null, null, null]` (4 empty slots). We also ensure the array always has length 4 by padding it if necessary.

## Result
- Users will now correctly see their starter cards and 4 empty chest slots instead of a blank screen.
- This persists even if the DB has "empty" data, effectively treating "empty" as "default starter state".
