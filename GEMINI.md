# TripPlanner - Project Context

## Project Overview
TripPlanner is a collaborative travel itinerary planning web application built with a modern React stack. It allows users to plan trips, manage itineraries with drag-and-drop functionality, collaborate with friends in real-time, track expenses, and export plans. The application features a clean, Japanese-inspired minimalist UI.

### Key Technologies
*   **Frontend:** React 18, Vite, TypeScript
*   **Styling:** Tailwind CSS, shadcn/ui, Lucide React (icons)
*   **State Management:** Zustand
*   **Routing:** React Router v6 (Client-side routing)
*   **Backend / Infrastructure:** Firebase (Authentication, Firestore, Storage, Hosting)
*   **Maps & Location:** Google Maps JavaScript API, Places API, Directions API
*   **Other Key Libraries:** `@dnd-kit` (Drag & Drop), `react-hook-form` + `zod` (Forms), `date-fns` (Dates), `jspdf` (PDF Export)

## Architecture
The project follows a modular architecture based on features and technical roles:

*   **`src/components/`**: UI components. Divided into `ui` (shadcn/ui base components), `layout` (structure), and feature folders like `trip`, `calendar`, `expense`.
*   **`src/pages/`**: Top-level page components mapped to routes. Uses lazy loading via `React.lazy` and `Suspense`.
*   **`src/stores/`**: Global state management using Zustand (e.g., `tripStore.ts`, `authStore.ts`). Stores handle data fetching and business logic.
*   **`src/services/`**: API integration layers. Handles direct communication with Firebase and other APIs.
*   **`src/hooks/`**: Custom React hooks for shared logic.
*   **`src/types/`**: TypeScript definitions ensuring type safety across the app.
*   **`src/lib/`**: Utility functions and third-party integrations.

## Building and Running

### Prerequisites
*   Node.js 18+
*   Firebase Project
*   Google Cloud Platform Project (for Maps API)
*   Environment variables configured in `.env` (see `.env.example`)

### Key Commands
*   **Start Development Server:** `npm run dev` (Starts at `http://localhost:3000`)
*   **Build for Production:** `npm run build` (Outputs to `dist/`)
*   **Preview Production Build:** `npm run preview`
*   **Lint Code:** `npm run lint`

## Development Conventions

### Routing & Auth
*   **Lazy Loading:** All major pages are lazy-loaded in `App.tsx`.
*   **Protection:** Routes are protected using `ProtectedRoute` (requires login) and `PublicRoute` (redirects if logged in).
*   **Authentication:** Handled via `useAuthStore` and Firebase Auth (Google Provider).

### Data Management
*   **Store Pattern:** Logic for fetching, updating, and subscribing to data resides in Zustand stores (e.g., `useTripStore`). Components should interact with stores rather than calling services directly when possible.
*   **Real-time Updates:** The app heavily utilizes Firebase's real-time capabilities (listeners) to keep data synced across collaborators.

### Styling
*   **Tailwind:** Use utility classes for styling.
*   **UI Kit:** Stick to the existing `shadcn/ui` component patterns for consistency.
*   **Responsiveness:** Ensure designs work on mobile and desktop.

### Types
*   **Strict Typing:** Maintain strict TypeScript types. Define interfaces in `src/types/` (e.g., `Trip`, `Day`, `TripMember` in `trip.ts`).

## Key File Paths
*   `src/App.tsx`: Main application router and entry point for providers.
*   `src/stores/tripStore.ts`: Core logic for trip management (CRUD, subscriptions).
*   `src/services/firebase.ts`: Firebase configuration and initialization.
*   `src/types/trip.ts`: Core data models for the application.
*   `vite.config.ts`: Vite build configuration, including chunk splitting strategies.
