# API Architecture - Admin Web & Backend Separation

## Overview
The API architecture has been redesigned to separate concerns between Admin Web internal operations and Backend inventory operations.

## API Structure

### Admin Web Internal APIs (Same-Origin)
These APIs operate within the Admin Web application and handle user management:

```typescript
// Auth endpoints (Admin Web)
api.auth.login        // '/api/auth/login'
api.auth.signup       // '/api/auth/signup' 
api.auth.me          // '/api/auth/me'

// Admin management endpoints (Admin Web)
api.admin.users()              // '/api/admin/users'
api.admin.users('status=pending') // '/api/admin/users?status=pending'
api.admin.userById(userId)     // '/api/admin/users/{userId}'
api.admin.dashboard           // '/api/admin/dashboard'
```

### Backend APIs (External, Cross-Origin)
These APIs call the external backend service for inventory operations:

```typescript
// Inventory setup endpoints (Backend)
api.backend.inventorySetup     // '/api/admin/inventory-setup'
api.backend.inventoryStatus(userId) // '/api/admin/inventory-setup/{userId}'
```

## Usage Pattern

### Admin Web Operations
```typescript
// Direct API calls (same-origin)
const response = await fetch(api.admin.users(), {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Backend Operations
```typescript
// Use buildUrl for cross-origin calls
const response = await fetch(api.buildUrl(api.backend.inventorySetup), {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` 
  },
  body: JSON.stringify(data)
});
```

## Environment Configuration

Set `NEXT_PUBLIC_API_BASE_URL` in your environment:

```bash
# Development
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# Production  
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

## Data Flow

1. **User Management**: Admin Web → Admin Web Database
2. **Inventory Setup**: Admin Web → Backend → New Database Creation
3. **Inventory Status**: Admin Web → Backend → Existing Database Query

## Benefits

- ✅ Clear separation of concerns
- ✅ Flexible deployment (different domains/ports)
- ✅ Centralized API configuration
- ✅ Fallback to relative URLs for same-origin
- ✅ Type-safe API structure
