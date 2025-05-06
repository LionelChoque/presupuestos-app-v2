# Architecture Overview

## Overview

This application is a budget tracking and management system designed to help users manage, track, and analyze budgets. It features a full-stack JavaScript/TypeScript architecture with a clear separation between client and server components.

The system allows users to:
- Import and manage budget data from CSV files
- Track the status of different budgets
- Visualize budget data through charts and reports
- Manage tasks related to budget follow-ups
- Store contact information for each budget

## System Architecture

The application follows a modern web application architecture with the following key components:

1. **Frontend**: React-based single-page application (SPA) with client-side rendering
2. **Backend**: Express.js server providing RESTful API endpoints
3. **Database**: PostgreSQL database accessed through Drizzle ORM
4. **State Management**: React Query for server state management combined with React hooks for local state
5. **UI Components**: ShadCN UI component library with Tailwind CSS for styling

### Architecture Diagram

```
┌─────────────────┐         ┌────────────────┐         ┌─────────────────┐
│                 │         │                │         │                 │
│  React Frontend │ ◄─────► │  Express API   │ ◄─────► │  PostgreSQL DB  │
│  (Client-side)  │   HTTP  │  (Server-side) │  Drizzle │                 │
│                 │         │                │   ORM    │                 │
└─────────────────┘         └────────────────┘         └─────────────────┘
```

## Key Components

### Frontend

The frontend is structured as a React SPA with TypeScript. Key architectural decisions include:

1. **Component Organization**:
   - `client/src/components/`: Reusable UI components
   - `client/src/pages/`: Page-level components for different routes
   - `client/src/lib/`: Utility functions and type definitions
   - `client/src/hooks/`: Custom React hooks for shared logic

2. **State Management**:
   - React Query for server state (data fetching, caching, synchronization)
   - Local component state for UI-specific state
   - Custom hooks (e.g., `useBudgets`) to encapsulate complex state logic

3. **Routing**:
   - Uses Wouter for lightweight client-side routing
   - Main routes: Dashboard, Budget List, Task List, Reports

4. **UI Framework**:
   - ShadCN UI components 
   - Tailwind CSS for styling with a custom theme
   - Responsive design supporting both desktop and mobile layouts

### Backend

The backend is an Express.js server written in TypeScript. Key architectural decisions include:

1. **API Structure**:
   - RESTful API design with structured routes
   - Central error handling middleware
   - Support for JSON request/response with increased payload limits for CSV imports

2. **Server Organization**:
   - `server/index.ts`: Main server entry point
   - `server/routes.ts`: API route definitions
   - `server/db.ts`: Database connection and configuration
   - `server/storage.ts`: Data access layer using the repository pattern

3. **Middleware**:
   - Request logging middleware for API calls
   - Static file serving for the frontend build
   - JSON parsing with increased limits for CSV uploads

### Database Layer

The application uses PostgreSQL with Drizzle ORM for database access. Key architectural decisions include:

1. **Schema Design**:
   - Defined in `shared/schema.ts` using Drizzle's schema definition syntax
   - Core tables: `budgets`, `budget_items`, `users`, `contact_info`
   - Zod integration for runtime type validation

2. **Data Access**:
   - Repository pattern implemented in `server/storage.ts`
   - Abstracted database operations behind interfaces for better testability
   - Strongly typed queries and results using TypeScript

3. **Connection Management**:
   - NeonDB serverless PostgreSQL client
   - Connection pooling for efficient database access

## Data Flow

### Budget Management Flow

1. User uploads a CSV file containing budget data
2. Frontend sends the CSV data to the server
3. Server parses and validates the CSV data
4. Server compares with existing data (if option selected)
5. Database is updated with new/modified budgets
6. Server returns import results to the frontend
7. Frontend refreshes the budget list to show updated data

### Budget Tracking Flow

1. User views budgets in the Budget List or Dashboard
2. Frontend fetches budget data from the server
3. User can update budget status, add notes, or mark actions as completed
4. Updates are sent to the server via API calls
5. Server updates the database and returns the updated record
6. Frontend refreshes the affected components

## External Dependencies

### Frontend Dependencies

1. **UI Components**:
   - Radix UI primitive components
   - ShadCN UI component library
   - Tailwind CSS for styling
   - Lucide React for icons

2. **Data Management**:
   - TanStack React Query for data fetching and caching
   - Zod for data validation
   - date-fns for date formatting and manipulation
   - Chart.js for data visualization

3. **Routing and State**:
   - Wouter for lightweight routing
   - React Hook Form for form management

### Backend Dependencies

1. **Server Framework**:
   - Express.js for HTTP server
   - Vite for development server and frontend bundling

2. **Database**:
   - Drizzle ORM for database access
   - NeonDB serverless PostgreSQL client
   - ws for WebSocket support (used by NeonDB)

3. **Utilities**:
   - PapaParse for CSV parsing
   - Zod for schema validation

## Deployment Strategy

The application is configured for deployment on Replit with the following strategy:

1. **Development Environment**:
   - Uses Vite development server with hot module replacement
   - Node.js backend runs in development mode with debugger support
   - PostgreSQL database accessed via connection string

2. **Production Build**:
   - Frontend bundled with Vite build
   - Backend bundled with esbuild
   - Static assets served by Express

3. **Deployment Configuration**:
   - Configured for Replit deployment
   - Automatic scaling with Replit's autoscale feature
   - Environment variables for configuration (e.g., `DATABASE_URL`)

4. **Database Provisioning**:
   - Uses Replit's PostgreSQL database module
   - Database schema migrations managed via Drizzle Kit

This architecture provides a scalable, maintainable foundation for the budget tracking application with a clean separation of concerns and modern development practices.