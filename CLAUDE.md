# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Run Commands
- Backend: `npm run dev` or `npm run start`
- Frontend: `cd frontend && npm run dev`
- Full stack: `npm run dev:all` (runs both backend and frontend)
- Build: `npm run build` (backend) or `cd frontend && npm run build` (frontend)
- Lint: `cd frontend && npm run lint`

## Code Style Guidelines
- **TypeScript**: Use strict types, interfaces over types when applicable
- **Naming**: PascalCase for components/interfaces, camelCase for variables/functions
- **Imports**: React first, types second, contexts/hooks third, external libraries last
- **Components**: Context-based state management with small, focused components
- **Error Handling**: Try/catch blocks with useError hook for component-wide errors
- **State Management**: React Context API for global state with optimistic updates
- **Styling**: Tailwind CSS with className patterns
- **Formatting**: Follow ESLint rules (noUnusedLocals, noUnusedParameters enabled)
- **Forms**: Use react-hook-form for form handling
- **Database**: SQLite with migrations (run in sequence)