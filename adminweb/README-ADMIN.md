# AdminWeb Admin Setup

This document explains how to set up and use the admin functionality in the AdminWeb project.

## 🚀 Admin System Overview

The AdminWeb project includes a comprehensive admin system with:

- **Dedicated Admin Authentication**: Separate login portal for administrators
- **User Management Dashboard**: Approve/reject users and manage roles
- **Inventory Setup Wizard**: Complete inventory initialization for new users
- **Role-Based Access Control**: Admin, Manager, and Staff roles
- **Statistics & Analytics**: System overview and user metrics

## 📋 Admin Features

### ✅ **Admin Authentication**
- **Admin Login Portal**: `/admin/login` (clean, security-focused interface)
- **Role Verification**: Automatic admin role checking on login
- **Secure Access**: Separate from regular user authentication

### ✅ **Admin Dashboard** (`/admin`)
- **User Management**: View, approve, reject, and manage user accounts
- **Statistics Cards**: Total users, pending approvals, approved/rejected counts
- **Filtering & Search**: Filter users by status and role
- **Pagination**: Handle large user lists efficiently
- **Inventory Setup Links**: Direct access to inventory initialization

### ✅ **Inventory Setup** (`/admin/inventory-setup`)
- **Complete Setup Wizard**: Step-by-step inventory initialization
- **Categories Management**: Create product categories
- **Warehouse Setup**: Configure storage locations
- **Product Addition**: Add initial inventory items
- **Progress Tracking**: Monitor setup completion status

## 🔐 Admin User Accounts

### Default Admin Accounts (created by seed script)
```
System Administrator
Email: admin@adminweb.com
Password: admin123!@#

Super Admin
Email: superadmin@adminweb.com
Password: super123!@#
```

### Demo Accounts
```
Demo Manager
Email: manager@adminweb.com
Password: manager123!@#

Demo Staff
Email: staff@adminweb.com
Password: staff123!@#
```

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
cd adminweb
npm install
```

### 2. Environment Configuration
Ensure your `.env.local` file contains:
```bash
MONGODB_URI=mongodb://localhost:27017/inventory-management-admin
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000
```

### 3. Seed Admin Users
```bash
npm run seed:admin
```

### 4. Start the Application
```bash
npm run dev
```

## 🌐 Access URLs

- **Admin Login**: `http://localhost:3000/admin/login`
- **Admin Dashboard**: `http://localhost:3000/admin`
- **Regular User Login**: `http://localhost:3000/login`
- **User Dashboard**: `http://localhost:3000/dashboard`

## 👥 User Roles & Permissions

### **Admin Role**
- ✅ Full system access
- ✅ User management (approve/reject users)
- ✅ Role assignment (admin/manager/staff)
- ✅ Inventory setup for all users
- ✅ System statistics and analytics
- ✅ Complete CRUD operations on all entities

### **Manager Role**
- ✅ Warehouse management
- ✅ Inventory tracking and updates
- ✅ Purchase order management
- ✅ Sales order processing
- ✅ Staff supervision

### **Staff Role**
- ✅ Basic inventory operations
- ✅ Product viewing and updates
- ✅ Order processing assistance
- ✅ Limited reporting access

## 🔄 Admin Workflow

1. **User Registration** → New users register through regular signup
2. **Admin Review** → Admins review pending user applications
3. **Approval Process** → Admins approve/reject users and assign roles
4. **Inventory Setup** → Admins initialize inventory for approved users
5. **System Access** → Users gain access based on assigned roles

## 📊 Admin Dashboard Features

### Statistics Overview
- **Total Users**: Complete user count
- **Pending Approvals**: Users awaiting admin review
- **Approved Users**: Active system users
- **Rejected Users**: Denied access users

### User Management Table
- **User Details**: Name, email, role, status
- **Status Indicators**: Color-coded status badges
- **Action Buttons**: Approve, reject, setup inventory
- **Pagination**: Navigate through large user lists
- **Filtering**: Filter by status and role

### Inventory Setup Integration
- **Setup Status**: Track completion progress
- **Direct Links**: Quick access to setup wizards
- **Completion Tracking**: Monitor setup milestones

## 🗂️ Project Structure

```
adminweb/
├── seed-admin.js              # Admin user seeding script
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── login/page.tsx     # Admin login portal
│   │   │   ├── page.tsx           # Admin dashboard
│   │   │   └── inventory-setup/   # Inventory setup wizard
│   │   └── api/
│   │       ├── admin/             # Admin API routes
│   │       └── auth/              # Authentication APIs
│   ├── models/                    # Database models
│   └── lib/                       # Utilities and auth
```

## 🔧 API Endpoints

### Admin User Management
- `GET /api/admin/users` - List users with filtering/pagination
- `GET /api/admin/users/[id]` - Get specific user details
- `PATCH /api/admin/users/[id]` - Approve/reject users

### Inventory Setup
- `GET /api/admin/inventory-setup/[userId]` - Get setup status
- `POST /api/admin/inventory-setup/[userId]` - Initialize inventory

### Authentication
- `POST /api/auth/login` - User login (supports admin role)
- `GET /api/auth/me` - Get current user info

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Granular permission system
- **Admin Verification**: Automatic admin role checking
- **Password Hashing**: bcrypt encryption for all passwords
- **Session Management**: Secure client-side token storage

## 🚀 Getting Started

1. **Clone and Setup**:
   ```bash
   cd adminweb
   npm install
   npm run seed:admin
   npm run dev
   ```

2. **Access Admin Portal**:
   - Open `http://localhost:3000/admin/login`
   - Login with admin credentials
   - Access full admin dashboard

3. **Test User Management**:
   - Register new users through regular signup
   - Approve them through admin dashboard
   - Set up their inventory

## 📝 Notes

- Admin accounts are pre-approved and ready to use
- The system supports multiple admin users
- Inventory setup is user-specific and tracked individually
- All admin actions are logged and auditable
- Regular users cannot access admin routes

## 🔄 Next Steps

Your AdminWeb admin system is now fully configured with:
- ✅ Complete admin authentication system
- ✅ User management and approval workflow
- ✅ Inventory setup capabilities
- ✅ Role-based access control
- ✅ Professional admin interface

The system is ready for production use with comprehensive admin controls and user management capabilities!
