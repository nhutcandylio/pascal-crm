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
- **Database**: PostgreSQL with Neon Database integration
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Validation**: Zod schemas for runtime type validation

## Key Components

### Database Schema
- **Customers Table**: Stores company information, contact details, and industry data
- **Deals Table**: Manages sales opportunities with stages, values, and close dates
- **Activities Table**: Tracks customer interactions (calls, emails, meetings, notes)

### Frontend Pages
- **Dashboard**: Overview with metrics, recent deals, and activities
- **Customers**: Customer management with search functionality
- **Deals**: Deal pipeline management with stage tracking
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