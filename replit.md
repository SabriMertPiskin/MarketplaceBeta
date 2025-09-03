# 3D Printing Marketplace

## Overview

This is a full-stack 3D printing marketplace application that connects customers who need 3D printed objects with producers who can manufacture them. The platform handles the entire workflow from file upload and analysis to order management, pricing, and real-time communication between parties.

The application is built with a modern React frontend using TypeScript and a Node.js/Express backend, with PostgreSQL for data persistence. It includes features like STL file analysis, automated pricing calculations, real-time chat, order tracking, and comprehensive admin controls.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: Wouter for client-side routing
- **3D Visualization**: Three.js with React Three Fiber for STL file viewing
- **File Handling**: React Dropzone for drag-and-drop file uploads

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with proxy pattern to Flask backend
- **Real-time Communication**: Socket.IO for live messaging and notifications
- **File Processing**: Multer for file upload handling with STL/OBJ filtering

### Database Design
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM with schema-first approach
- **Schema**: Normalized relational design with tables for users, products, orders, messages, notifications, and materials
- **User Roles**: Role-based access control (customer, producer, admin)
- **Order Workflow**: Status-driven order lifecycle management

### Authentication & Authorization
- **Authentication**: Firebase Auth integration with custom token verification
- **Authorization**: Role-based middleware with JWT token validation
- **Session Management**: Stateless JWT tokens with refresh capability
- **Data Privacy**: KVKK compliance with explicit consent tracking

### File Storage & Processing
- **File Upload**: Multi-part form handling with size and type validation
- **STL Analysis**: Automated geometric analysis including dimensions, volume, surface area
- **File Storage**: Integration with cloud storage services
- **3D Preview**: Real-time STL rendering in browser with camera controls

### Real-time Features
- **WebSocket Communication**: Socket.IO for real-time messaging
- **Live Notifications**: Event-driven notification system
- **Order Updates**: Real-time status changes across all connected clients
- **Chat System**: Direct messaging between customers and producers

### Pricing Engine
- **Dynamic Calculation**: Material cost, time estimation, and complexity analysis
- **Multi-factor Pricing**: Support for different materials, infill densities, and support structures
- **Commission Structure**: Platform fees and payment processing costs
- **Transparent Breakdown**: Detailed cost itemization for all parties

### Admin Dashboard
- **User Management**: Comprehensive user administration and role assignment
- **Order Oversight**: System-wide order monitoring and intervention capabilities
- **Analytics**: Business metrics and performance tracking
- **Content Moderation**: Product approval workflow and quality control

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Firebase**: Authentication services and user management
- **Vite**: Development server and build tooling with HMR
- **Replit**: Development environment integration with runtime error handling

### Frontend Libraries
- **Radix UI**: Unstyled, accessible component primitives
- **TanStack Query**: Server state synchronization and caching
- **React Hook Form**: Form validation with Zod schema integration
- **Lucide Icons**: Consistent iconography throughout the application
- **Date-fns**: Date formatting and manipulation with Turkish locale

### Development Tools
- **TypeScript**: Static type checking across frontend and backend
- **ESLint/Prettier**: Code formatting and quality enforcement
- **Drizzle Kit**: Database migration and schema management
- **PostCSS**: CSS processing with Tailwind CSS integration

### External Services Integration
- **Flask Backend**: Existing Python service for specialized processing
- **Payment Processing**: Integration ready for payment gateway services
- **Cloud Storage**: File storage service integration for STL files
- **Email Services**: Notification and communication services