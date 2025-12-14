# Task: Beta Launch Navigation Restructure

## Objective
Restructure the application navigation and feature visibility for the Beta launch, focusing on a core set of features and hiding others for SuperAdmin access only.

## Changes Implemented

### 1. Navigation Restructure (`components/layout/mobile-layout.tsx`)
- Updated the bottom navigation bar to show only Beta features:
  - **Battle** (`/`)
  - **Analysis** (`/analysis`)
  - **Cards** (`/cards`)
  - **Academy** (`/academy`)
  - **Profile** (`/profile`)
- Removed links to non-Beta features (Kingdom, Social, Improve, Shop, Studio, Minigames).
- Added a "Beta Features" link in the Profile dropdown, visible only to SuperAdmins, linking to `/features`.

### 2. SuperAdmin Features Page (`app/features/page.tsx`)
- Created a new landing page for SuperAdmins to access hidden features.
- Includes links to:
  - Kingdom (Clans)
  - Social (Events, Friends)
  - Improve (Study)
  - Shop
  - Studio
  - Minigames
  - Admin Panel

### 3. Profile Page (`app/profile/page.tsx`)
- Modified to directly render the `UserProfile` component.
- Removed the previous redirection logic to the Social page.

### 4. Battle & Lobby (`app/page.tsx`, `app/lobby/page.tsx`)
- Cleaned up the Home page (`/`) to remove direct buttons to "Mina de Puzzles" and "Minigames".
- Updated `app/lobby/page.tsx` to handle "Play vs Bot" (Gatekeeper) from the sidebar.
- Updated `CreateChallengeModal` in the Lobby to allow creating "Vs Bot" games directly.
- Both flows redirect to `/play/online/bot-[id]` to utilize the unified game interface.

### 5. Feature Verification
- **Analysis**: Verified existence of Analysis Board, Database Manager, and Stockfish integration (`app/analysis/page.tsx`).
- **Cards**: Verified Concept Cards and Mining functionality (`app/cards/page.tsx`).
- **Academy**: Verified Course listing and tracking (`app/academy/page.tsx`).

## Status
- **Complete**: All requested restructuring and feature visibility changes have been implemented.
- **Build**: Verified via `npm run build`.
