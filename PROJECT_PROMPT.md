# Definitive Prompt for Chess Super App

**Role:** Expert UI/UX Designer & Full-Stack Developer
**Project:** Chess Super App
**Goal:** Create a premium, all-in-one chess platform that combines competitive play, education, community management, and e-commerce.
**Target Audience:** Chess enthusiasts, club owners, and students.

## 1. Design Philosophy & Aesthetics
- **Theme:** "Premium Dark Mode". Use deep slate/black backgrounds (`#0f172a`, `#020617`) with subtle gradients.
- **Visual Style:** Glassmorphism (translucent panels with blur), neon accents (gold/amber for "premium" feel, blue/purple for "tech" feel).
- **Typography:** Modern sans-serif (Inter, Geist, or similar). Clean, readable, with strong hierarchy.
- **Interactivity:** Smooth transitions, hover effects, micro-animations (e.g., pieces gliding, buttons glowing on hover).
- **Responsiveness:** Mobile-first, fully responsive layouts that adapt from phone to large desktop screens.

## 2. Tech Stack
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS, Lucide React (icons).
- **Backend:** Supabase (PostgreSQL, Auth, Realtime), Stripe (Payments).
- **State Management:** React Context / Zustand (if needed).

## 3. Core Modules & UI Requirements

### A. Global Layout
- **Sidebar/Navigation:** Collapsible sidebar on desktop, bottom tab bar on mobile.
- **Links:** Play, Puzzles, Academy, Clubs, Shop, Adventure, Profile, Settings.
- **Header:** User avatar, notifications, quick actions (e.g., "New Game").

### B. Play (The Arena)
- **Centerpiece:** A high-quality, responsive Chessboard (using `react-chessboard` style).
- **Player Cards:** Display Avatar, Username, Flag, ELO Rating, and Timer (large, readable digits).
- **Controls:** Resign, Draw, Analyze buttons.
- **Chat:** Collapsible chat window.
- **Game Modes:** Quick select for Bullet (1+0), Blitz (3+0, 3+2), Rapid (10+0), and "Play vs Bot" (with different personalities/difficulties).

### C. Academy (Learn)
- **Dashboard:** Progress bars for different courses (Openings, Endgames, Strategy).
- **Lesson View:** Split screen: Video/Text content on one side, interactive board on the other.
- **Puzzles:** "Daily Puzzle" card, "Puzzle Rush" mode, and a history of solved puzzles.

### D. Clubs (ERP System)
- **Club Dashboard:** Overview of members, upcoming tournaments, and recent activity.
- **Management Tools:**
  - **Members Table:** Sortable list with status (Active, Pending), ELO, and roles.
  - **Events/Calendar:** Schedule for meetups and tournaments.
  - **Finances:** Simple chart showing club dues collected vs. expenses.
- **Visuals:** Club banner, logo, and "Join" button for non-members.

### E. Shop (E-commerce)
- **Product Grid:** High-quality images of chess sets, clocks, and merchandise.
- **Product Card:** Title, Price, "Add to Cart" button, Rating stars.
- **Cart/Checkout:** Slide-over cart drawer, clean checkout form (Stripe integration).

### F. Profile & Social
- **Header:** Large avatar, banner, bio, total games played.
- **Stats:** ELO graph (line chart) showing progress over time.
- **Match History:** List of recent games with Win/Loss/Draw indicators and "Analyze" link.
- **Leagues:** Badge showing current league (Wood, Bronze, Silver, etc.) and progress to next tier.

### G. Adventure (Gamified)
- **Map View:** A path of levels/nodes to unlock.
- **Story Mode:** Visual novel style dialogue overlays before chess challenges.

## 4. Technical Constraints & Prompts for Generation
- **Component Library:** Use `shadcn/ui` components (Cards, Dialogs, Buttons, Inputs) as a base but customized for the "Premium Dark" theme.
- **Data Fetching:** Assume Supabase client is available for fetching user data and game states.
- **Performance:** Prioritize LCP (Largest Contentful Paint) by optimizing images and using server components where possible.

## 5. Example Prompt for a Specific Page (e.g., Play Page)
*"Design a 'Play' page for the Chess Super App. It should feature a central chessboard that takes up the majority of the screen height. On the left (desktop), show a list of game modes (Bullet, Blitz, Rapid) as selectable cards. On the right, show the move history and chat. Use a dark background with a subtle chess-piece pattern overlay. Ensure the board is responsive and maintains aspect ratio."*
