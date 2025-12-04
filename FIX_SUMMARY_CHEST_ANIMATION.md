# Chest Opening & Profile Visibility Updates

## Features Implemented
1.  **Chest Opening Animation:**
    - Created a new `ChestOpeningModal` component.
    - **Countdown:** When a chest is opened, a 3-second countdown (3... 2... 1... OPEN!) appears.
    - **Animation:** A gift box shakes and glows before revealing rewards.
    - **Rewards Display:** A modal shows the specific rewards obtained:
        - Gold amount
        - Gems amount
        - **Card Drop:** Shows the specific card found and the amount of copies.
    - **Logic:** The `openChest` store action now returns the rewards object, which is passed to the modal.

2.  **Profile Visibility:**
    - Added a dedicated **"Perfil"** link to the main navigation bar in the header.
    - This ensures users can easily find their profile page without relying solely on clicking their avatar.

## Technical Details
- **Components:** `ChestOpeningModal`, `CardsPage`, `SiteHeader`.
- **Store:** Updated `usePlayerStore`'s `openChest` to return reward data.
- **Libraries:** Used `framer-motion` for smooth animations in the modal.

## User Experience
- Opening a chest is now a more exciting, gamified event.
- Users clearly see what they earned before it's added to their totals.
- Navigation to the profile is more intuitive.
