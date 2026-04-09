# VitalSync - Medical Emergency Triage System

## Overview

VitalSync is a medical emergency triage and patient management system designed for hospitals and emergency services. The application enables real-time patient tracking, AI-powered disease prediction, automated doctor assignment, and multi-role dashboards for administrators, ambulance crews, and doctors.

The system addresses the critical need for efficient patient intake during emergencies by automating triage decisions using AI analysis of symptoms and vitals, then routing patients to appropriate departments and available doctors.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, local state for UI
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **Animations**: Framer Motion for transitions and micro-interactions
- **Charts**: Recharts for disease distribution visualizations
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Framework**: Express 5 on Node.js with TypeScript
- **API Design**: REST endpoints defined in `shared/routes.ts` with Zod validation schemas
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **AI Integration**: OpenAI API (via Replit AI Integrations) for disease prediction and triage

### Data Storage
- **Primary Database**: PostgreSQL (connection via `DATABASE_URL` environment variable)
- **Schema Design**: Relational model with users, patients, doctors, departments, and predictions tables
- **Session Storage**: connect-pg-simple for PostgreSQL-backed sessions

### Key Design Patterns
- **Shared Types**: The `shared/` directory contains schemas and route definitions used by both frontend and backend, ensuring type safety across the stack
- **Route-based API Contract**: All API endpoints are defined with Zod schemas for input validation and response typing in `shared/routes.ts`
- **Storage Interface**: `server/storage.ts` implements an `IStorage` interface, allowing for potential database swapping
- **Role-based Access**: Three distinct user roles (admin, doctor, ambulance) with corresponding dashboards

### Role Dashboards
- **Admin**: Overview statistics, disease distribution charts, patient tables
- **Ambulance**: Patient intake forms with AI-powered symptom analysis and urgency prediction
- **Doctor**: Assigned patient cards with vitals and treatment information

## External Dependencies

### AI Services
- **OpenAI API**: Accessed via Replit AI Integrations (`AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`)
- Used for disease prediction from symptoms and automated doctor/department assignment

### Database
- **PostgreSQL**: Required for all data persistence
- Connection string provided via `DATABASE_URL` environment variable
- Migrations managed via Drizzle Kit (`npm run db:push`)

### Key NPM Packages
- `drizzle-orm` / `drizzle-zod`: Database ORM with Zod schema generation
- `@tanstack/react-query`: Server state management
- `zod`: Runtime type validation
- `recharts`: Data visualization
- `framer-motion`: Animation library
- `date-fns`: Date formatting utilities

### Replit Integrations
The `server/replit_integrations/` and `client/replit_integrations/` directories contain pre-built utilities for:
- **Audio**: Voice chat, speech-to-text, text-to-speech capabilities
- **Chat**: Conversation persistence and streaming responses
- **Image**: Image generation via AI
- **Batch**: Rate-limited batch processing utilities