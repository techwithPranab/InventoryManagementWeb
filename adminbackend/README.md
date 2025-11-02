# Admin Backend API

A comprehensive backend API for the Inventory Management Admin System built with Node.js, Express.js, and MongoDB.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Admin, Manager, Staff, and Client user management
- **Inventory Setup Management**: Manage client inventory setups and configurations
- **Subscription Plans**: Handle different subscription tiers and billing
- **Support Tickets**: Complete support ticket management system
- **Contact Management**: Handle customer inquiries and communications
- **Dashboard Analytics**: Comprehensive dashboard with statistics and insights
- **Security**: Rate limiting, data sanitization, XSS protection, and more

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting, Data Sanitization
- **Validation**: Express Validator
- **Password Hashing**: bcryptjs

## Installation

1. **Clone the repository**
   ```bash
   cd adminbackend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure secret key for JWT tokens
   - `DEFAULT_ADMIN_EMAIL` & `DEFAULT_ADMIN_PASSWORD`: Default admin credentials

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the application**
   
   **Development mode:**
   ```bash
   npm run dev
   ```
   
   **Production mode:**
   ```bash
   npm start
   ```

## Database Seeding

### Seed All Data (Recommended for development)
```bash
npm run seed
```

### Seed Individual Data Types
```bash
# Seed admin users only
npm run seed:admin

# Seed subscription plans only
npm run seed:plans
```

### Clear All Data
```bash
npm run seed -- -d
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /me` - Get current user profile
- `PUT /profile` - Update user profile
- `PUT /change-password` - Change password
- `POST /logout` - Logout user

### Users (`/api/users`)
- `GET /` - Get all users (Admin only)
- `GET /:id` - Get user by ID (Admin only)
- `PUT /:id/approve` - Approve user (Admin only)
- `PUT /:id/reject` - Reject user (Admin only)
- `PUT /:id/role` - Update user role (Admin only)
- `PUT /:id/status` - Activate/deactivate user (Admin only)
- `DELETE /:id` - Delete user (Admin only)
- `GET /stats/overview` - Get user statistics (Admin only)

### Inventory Setup (`/api/inventory-setup`)
- `GET /` - Get all inventory setups
- `GET /:id` - Get setup by ID
- `GET /client/:clientCode` - Get setup by client code
- `GET /email/:email` - Get setups by email
- `POST /` - Create new inventory setup (Admin only)
- `PUT /:id` - Update inventory setup
- `PUT /:id/progress` - Update setup progress
- `PUT /:id/complete` - Complete setup
- `DELETE /:id` - Delete setup (Admin only)
- `GET /stats/overview` - Get setup statistics

### Subscription Plans (`/api/subscription-plans`)
- `GET /` - Get all subscription plans
- `GET /active` - Get active plans only
- `GET /:id` - Get plan by ID
- `GET /name/:name` - Get plan by name
- `POST /` - Create subscription plan (Admin only)
- `PUT /:id` - Update subscription plan (Admin only)
- `PUT /:id/status` - Activate/deactivate plan (Admin only)
- `DELETE /:id` - Delete plan (Admin only)

### Support Tickets (`/api/support-tickets`)
- `GET /` - Get all support tickets
- `GET /:id` - Get ticket by ID
- `POST /` - Create support ticket (Public)
- `PUT /:id` - Update support ticket
- `PUT /:id/assign` - Assign ticket to user
- `POST /:id/responses` - Add response to ticket
- `PUT /:id/resolve` - Resolve ticket
- `DELETE /:id` - Delete ticket (Admin only)
- `GET /stats/overview` - Get ticket statistics

### Contacts (`/api/contacts`)
- `GET /` - Get all contacts
- `GET /:id` - Get contact by ID
- `POST /` - Create contact (Public)
- `PUT /:id` - Update contact
- `PUT /:id/assign` - Assign contact to user
- `POST /:id/notes` - Add note to contact
- `PUT /:id/read` - Mark contact as read/unread
- `DELETE /:id` - Delete contact (Admin only)
- `GET /stats/overview` - Get contact statistics

### Dashboard (`/api/dashboard`)
- `GET /overview` - Get dashboard overview statistics
- `GET /users/stats` - Get detailed user statistics
- `GET /setups/stats` - Get detailed setup statistics
- `GET /tickets/stats` - Get detailed ticket statistics
- `GET /activities` - Get recent activities

## User Roles & Permissions

### Admin
- Full access to all endpoints
- Can manage users, setups, plans, tickets, and contacts
- Can delete any data
- Can view all statistics and analytics

### Manager
- Can view and manage inventory setups
- Can manage support tickets and contacts
- Can view dashboard statistics
- Cannot delete critical data or manage subscription plans

### Staff
- Can view and respond to support tickets
- Can view and manage contacts
- Limited access to user management
- Cannot delete data or access financial information

### Client
- Can view their own profile and update it
- Can create support tickets
- Can view their own inventory setup status
- Cannot access admin functions

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5001` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/inventory_management_admin` |
| `JWT_SECRET` | JWT secret key | Required |
| `JWT_EXPIRE` | JWT expiration time | `30d` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000,http://localhost:4001` |
| `DEFAULT_ADMIN_EMAIL` | Default admin email | `admin@inventorymanagement.com` |
| `DEFAULT_ADMIN_PASSWORD` | Default admin password | `Admin123!` |

## Security Features

- **Rate Limiting**: API rate limiting to prevent abuse
- **Data Sanitization**: Protection against NoSQL injection attacks
- **XSS Protection**: Cross-site scripting protection
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for Express
- **Password Hashing**: bcrypt for secure password storage
- **JWT Authentication**: Secure token-based authentication

## Error Handling

The API includes comprehensive error handling with:
- Validation errors
- Authentication errors
- Authorization errors
- Database errors
- Custom error responses
- Development vs production error details

## Testing

Run tests (when available):
```bash
npm test
```

## Project Structure

```
adminbackend/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── errorHandler.js      # Error handling middleware
│   └── rateLimiter.js       # Rate limiting middleware
├── models/
│   ├── User.js              # User model
│   ├── InventorySetup.js    # Inventory setup model
│   ├── SubscriptionPlan.js  # Subscription plan model
│   ├── SupportTicket.js     # Support ticket model
│   └── Contact.js           # Contact model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management routes
│   ├── inventory-setup.js   # Inventory setup routes
│   ├── subscription-plans.js # Subscription plan routes
│   ├── support-tickets.js   # Support ticket routes
│   ├── contacts.js          # Contact routes
│   └── dashboard.js         # Dashboard routes
├── utils/                   # Utility functions
├── seed-admin.js           # Admin user seeding
├── seed-subscription-plans.js # Subscription plan seeding
├── seed.js                 # Complete data seeding
├── server.js               # Main server file
├── package.json            # Dependencies and scripts
├── .env.example            # Environment variables template
└── README.md               # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@inventorymanagement.com or create an issue in the repository.
