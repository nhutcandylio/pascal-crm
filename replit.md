# replit.md

## Overview

This is a Customer Relationship Management (CRM) application built with a modern full-stack architecture. The application provides comprehensive functionality for managing customers, deals, activities, and dashboard analytics. It features a clean, responsive interface built with React and shadcn/ui components, backed by a Node.js/Express API with PostgreSQL database storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui components built on top of Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured route handling
- **Development**: Hot reload with Vite middleware integration
- **Error Handling**: Centralized error handling middleware

### Database Architecture
- **Database**: PostgreSQL with Neon Database integration (currently using in-memory storage for development)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Validation**: Zod schemas for runtime type validation
- **Relationships**: Many-to-many relationship between Accounts and Contacts via junction table

## Key Components

### Database Schema
- **Accounts Table**: Stores company information, contact details, and industry data
- **Contacts Table**: Individual contact information (shared across multiple accounts)
- **AccountContacts Table**: Junction table for many-to-many Account-Contact relationships
- **Leads Table**: Potential customers not yet converted to accounts
- **Opportunities Table**: Sales opportunities with stages, values, and close dates
- **Activities Table**: Tracks customer interactions (calls, emails, meetings, notes)

### Frontend Pages
- **Dashboard**: Overview with metrics, recent deals, and activities
- **Accounts**: Account management with many-to-many contact relationships
- **Contacts**: Contact management showing all associated accounts
- **Leads**: Lead management and conversion to accounts
- **Opportunities**: Deal pipeline management with stage tracking
- **Activities**: Activity logging and history tracking

### UI Components
- **Layout**: Sidebar navigation with responsive design
- **Modals**: Form dialogs for creating customers, deals, and activities
- **Data Display**: Cards, tables, and badges for data presentation
- **Forms**: Controlled forms with validation

### Storage Layer
- **Interface**: IStorage interface defining data operations
- **Implementation**: MemStorage class for in-memory data handling (development)
- **Operations**: CRUD operations for customers, deals, and activities
- **Metrics**: Dashboard analytics calculations

## Data Flow

1. **Client Requests**: Frontend makes API calls using TanStack Query
2. **API Routes**: Express routes handle HTTP requests and validate data
3. **Storage Layer**: Storage interface abstracts data operations
4. **Database**: Drizzle ORM executes type-safe database queries
5. **Response**: JSON data returned to client with error handling

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL driver
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **wouter**: Lightweight router for React

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety and development experience
- **Tailwind CSS**: Utility-first CSS framework
- **Drizzle Kit**: Database schema management

### Authentication & Session Management
- **connect-pg-simple**: PostgreSQL session store (prepared for future auth)

## Deployment Strategy

### Development Environment
- **Database**: Environment variable `DATABASE_URL` for Neon connection
- **Hot Reload**: Vite middleware integrated with Express server
- **Error Overlay**: Replit-specific error handling in development

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: esbuild bundles server code for Node.js
- **Database**: Drizzle migrations ensure schema consistency
- **Environment**: Production mode with optimized performance

### Configuration
- **Path Aliases**: Simplified imports with `@/` and `@shared/` prefixes
- **TypeScript**: Strict type checking with comprehensive type coverage
- **Build Scripts**: Separate development and production workflows

The application follows modern web development practices with strong typing, component reusability, and scalable architecture patterns. The current implementation uses in-memory storage for development but is designed to easily integrate with the PostgreSQL database through the defined storage interface.

## Recent Changes

### July 2025 - User Management & Owner Assignment
- **Implemented**: Complete User CRUD functionality with create, edit, delete operations
- **Added**: Phone field to user schema and API routes for user management (GET, POST, PATCH, DELETE)
- **Enhanced**: Lead and Opportunity modals with owner assignment dropdowns
- **Fixed**: Stage Changes History display now properly visible with professional styling
- **Completed**: Storage layer with comprehensive user operations and owner relationship support
- **Navigation**: Added Users page to sidebar with full team member management capabilities

### January 2025 - Many-to-Many Account-Contact Relationships
- **Implemented**: Junction table (AccountContacts) for shared contact relationships
- **Updated**: Storage layer with new relationship management methods
- **Added**: API endpoints for adding/removing contact-account associations
- **Enhanced**: Frontend to display multiple accounts per contact as badges
- **Benefit**: Contacts can now be shared between multiple accounts, supporting real-world business scenarios