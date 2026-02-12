# Profile Page Enhancements

## Features Implemented
- **Access:** The profile page is accessible via the user banner in the header (clicking the avatar/name area).
- **Edit Profile:** Added an "Edit" button (pencil icon) next to the username.
    - Users can now change their username directly from the profile page.
    - Changes are saved to the database and updated in the local store.
- **Sign Out:** The "Tancar Sessió" (Sign Out) button is prominently displayed in the top right corner.
- **Settings Section:** Added a new "Configuració" section.
    - **Language Selector:** Added a dropdown for language selection (currently defaults to Català, with placeholders for Spanish and English).
    - **Notifications:** Added a placeholder toggle for notifications.
- **UI Improvements:**
    - Redesigned the layout to be more responsive (grid system).
    - Enhanced the visual appeal of the user card and stats.
    - Added a "Panel Admin" button visible only to SuperAdmins.

## Technical Details
- **File:** `app/profile/page.tsx`
- **State Management:** Used local state for editing mode and `usePlayerStore` for profile data.
- **Feedback:** Integrated `sonner` for toast notifications on success/error.
