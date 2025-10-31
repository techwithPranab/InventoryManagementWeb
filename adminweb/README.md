# Next.js Inventory Management System

A modern inventory management system built with Next.js 14, MongoDB, and TypeScript.

## 🚀 Features

- **Authentication System**: JWT-based authentication with role-based access control
- **Admin Dashboard**: Complete admin panel for user management and system oversight
- **Inventory Setup**: Automated inventory initialization for new users
- **Modern UI**: Built with Tailwind CSS and responsive design
- **TypeScript**: Full type safety throughout the application
- **MongoDB Integration**: Database operations with Mongoose ODM
- **App Router**: Leveraging Next.js 14 App Router for better performance
- **Role Management**: Admin, Manager, and Staff roles with different permissions

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Authentication**: JWT, bcryptjs
- **Development**: ESLint, TypeScript

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd adminweb
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

   Update the `.env.local` file with your MongoDB connection string and JWT secret.

4. **Seed admin users** (important for admin access):
   ```bash
   npm run seed:admin
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
MONGODB_URI=mongodb://localhost:27017/inventory-management-admin
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000
```

## 👑 Admin Setup

This project includes a comprehensive admin system. After installation:

1. **Run the admin seed script**:
   ```bash
   npm run seed:admin
   ```

2. **Access admin features**:
   - **Admin Login**: Visit `http://localhost:3000/admin/login`
   - **Admin Dashboard**: `http://localhost:3000/admin` (after login)
   - **Default Admin Credentials**:
     - Email: `admin@adminweb.com`
     - Password: `admin123!@#`

3. **Admin Capabilities**:
   - User management and approval
   - Role assignment (Admin/Manager/Staff)
   - Inventory setup for new users
   - System statistics and analytics

For detailed admin documentation, see [README-ADMIN.md](./README-ADMIN.md).

## 📚 API Routes

### Authentication
- `POST /api/auth/signup` - Create a new user account
- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/me` - Get current user profile (requires authentication)

### Admin APIs
- `GET /api/admin/users` - List users with filtering/pagination
- `PATCH /api/admin/users/[id]` - Approve/reject users
- `GET /api/admin/inventory-setup/[userId]` - Get inventory setup status

## 🏗️ Project Structure

```
src/
├── app/
│   ├── admin/                    # Admin pages and routes
│   │   ├── login/               # Admin login portal
│   │   ├── inventory-setup/     # Inventory setup wizard
│   │   └── page.tsx            # Admin dashboard
│   ├── api/
│   │   ├── admin/              # Admin API routes
│   │   └── auth/               # Authentication APIs
│   ├── dashboard/              # User dashboard
│   ├── login/                  # Regular user login
│   ├── signup/                 # User registration
│   └── page.tsx               # Home page
├── components/                 # Reusable components
├── lib/                       # Utilities and helpers
├── middleware/                # Next.js middleware
└── models/                    # Database models
```

## 👥 User Roles

- **Admin**: Full system access, user management, inventory setup
- **Manager**: Warehouse and inventory management, staff supervision
- **Staff**: Basic inventory operations, order processing

## 🔐 Authentication

The system uses JWT tokens for authentication. Tokens are stored in localStorage and sent with API requests via Authorization headers.

## 🚧 Development Status

This project includes:
- ✅ Complete authentication system
- ✅ Role-based access control
- ✅ Admin dashboard with user management
- ✅ Inventory setup wizard
- ✅ Professional UI/UX
- ✅ TypeScript implementation
- ✅ MongoDB integration

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
