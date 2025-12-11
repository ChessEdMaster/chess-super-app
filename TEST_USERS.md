# Test Users for Chess Super App

This file contains the test users required for verifying different roles and functionalities within the application. All users use the `@chessclans.com` domain.

## Global Roles

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@chessclans.com` | `password123` | Has full access to the system, including the business dashboard, user management, and all club types. Can manage Super Clans. |
| **New User** | `newuser@chessclans.com` | `password123` | A newly registered user with no club affiliations or specific permissions. Useful for testing onboarding and "NewUser" role restrictions. |

## Club Management Roles (Owners)

These users own different types of clubs to test specific dashboards and features.

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **School Owner** | `school_owner@chessclans.com` | `password123` | Owns a club of type `school`. Access to School Dashboard, student management (shadow users), and curriculum tools. |
| **Physical Club Owner** | `club_owner@chessclans.com` | `password123` | Owns a club of type `physical_club`. Access to Club Dashboard, managing physical location logic, and members. |
| **Online Community Owner** | `online_owner@chessclans.com` | `password123` | Owns a club of type `online`. Access to Online Dashboard, focused on digital events and online community features. |

## Member Roles

Users who join clubs or schools as members/students.

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Student** | `student@chessclans.com` | `password123` | A registered user who is a member of a School. Used to test the student view of the Academy and progress tracking. |
| **Club Member** | `member@chessclans.com` | `password123` | A registered user who is a member of a Physical or Online Club. Used to test member-specific features like chats, events, and club restricted content. |

## Notes

- **Password**: `password123` (Default for testing environments).
- **Setup**: Ensure these users are created in the Supabase `auth.users` table and have the corresponding entries in the public `users`, `profiles`, or `clubs` tables as needed to reflect their roles (e.g., `owner_id` in `clubs` table).
