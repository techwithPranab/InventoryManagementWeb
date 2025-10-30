<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Inventory Management System

This is a full-stack inventory management system built with:

## Backend (Node.js/Express/MongoDB)
- RESTful API with authentication and authorization
- MongoDB with Mongoose ODM
- JWT-based authentication
- Role-based access control (Admin, Manager, Staff)
- Comprehensive error handling and validation

## Frontend (React/TypeScript)
- Material-UI components
- React Query for data fetching
- React Hook Form for form management
- Context API for state management
- TypeScript for type safety

## Key Features
- Product and Category management
- Warehouse management with inventory tracking
- Purchase order management with receiving workflow
- Sales order management with shipping workflow
- Real-time dashboard with analytics
- Low stock alerts and inventory reports
- Role-based permissions

## Development Guidelines
- Use TypeScript for all new files
- Follow Material-UI design patterns
- Implement proper error handling
- Use React Query for API calls
- Maintain consistent code formatting
- Add proper JSDoc comments for complex functions
- Use meaningful component and variable names

## API Structure
- `/api/auth` - Authentication endpoints
- `/api/categories` - Category management
- `/api/products` - Product management
- `/api/warehouses` - Warehouse and inventory management
- `/api/purchases` - Purchase order management
- `/api/sales` - Sales order management
- `/api/dashboard` - Dashboard and analytics

## Database Models
- User: Authentication and user management
- Category: Product categorization
- Product: Product information and pricing
- Warehouse: Storage locations
- Inventory: Product quantities per warehouse
- PurchaseOrder: Purchase transactions
- SalesOrder: Sales transactions
