# Client-Specific Database Implementation

## Overview
The backend now supports client-specific databases to isolate data between different clients. Each client gets their own MongoDB database named `inventory_management_{clientCode}`.

## How It Works

### 1. Database Connection
- Main database: `inventory_management` (for user authentication and admin functions)
- Client databases: `inventory_management_{clientCode}` (for client-specific inventory data)

### 2. Middleware Updates

#### Auth Middleware (`middleware/auth.js`)
- Checks for `X-Client-Code` header in requests
- Creates dynamic database connections for client-specific data
- Automatically sets up client models in `req.models`
- Caches connections to improve performance

#### Client Models Utility (`utils/clientModels.js`)
- Provides `getClientModels()` function to get models for specific client connections
- Caches models to avoid recreation
- Supports all inventory-related models

### 3. Model Updates
All models now export both the model and schema:
```javascript
const ModelName = mongoose.model('ModelName', schema);
module.exports = ModelName;
module.exports.schema = schema;
```

### 4. Route Updates

#### Routes that require client-specific data:
- `/api/products` - All product operations
- `/api/categories` - All category operations  
- `/api/inventory` - All inventory operations
- `/api/warehouses` - All warehouse operations
- `/api/purchases` - All purchase order operations
- `/api/sales` - All sales order operations
- `/api/suppliers` - All supplier operations
- `/api/manufacturers` - All manufacturer operations

#### Routes that use main database:
- `/api/auth` - User authentication and registration
- `/api/admin` - Admin management functions

## Usage

### Frontend Implementation
When making API calls to client-specific endpoints, include the client code header:

```javascript
const headers = {
  'Authorization': `Bearer ${token}`,
  'X-Client-Code': clientCode,
  'Content-Type': 'application/json'
};

fetch('/api/products', { headers })
  .then(response => response.json())
  .then(data => console.log(data));
```

### Route Protection
Routes that require client-specific data use three middleware:
```javascript
router.get('/', [auth, requireClientCode], async (req, res) => {
  const { Product, Category } = req.models;
  // Use client-specific models
});
```

### Client Code Format
Client codes should be:
- Alphanumeric characters only
- Lowercase recommended
- Unique per client
- Examples: `client001`, `acme_corp`, `retail_store`

## Benefits

1. **Data Isolation**: Complete separation of client data
2. **Scalability**: Each client has their own database
3. **Security**: No risk of data leaks between clients
4. **Performance**: Smaller databases for better query performance
5. **Customization**: Each client can have custom schemas if needed

## Database Structure

```
MongoDB
├── inventory_management (main)
│   ├── users (authentication)
│   ├── admin_users
│   └── system_config
├── inventory_management_client001
│   ├── products
│   ├── categories
│   ├── inventory
│   ├── warehouses
│   └── ...
├── inventory_management_client002
│   ├── products
│   ├── categories
│   └── ...
└── ...
```

## Error Handling

The system handles various error scenarios:
- Missing client code: Returns 400 error
- Invalid client code: Returns 400 error
- Database connection timeout: Returns 400 error
- Authentication failures: Returns 401 error

## Testing

To test the client-specific functionality:

1. Register/login as an admin user
2. Make API calls with `X-Client-Code` header
3. Verify data is stored in client-specific database
4. Try different client codes to confirm isolation

Example:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "X-Client-Code: testclient" \
     -H "Content-Type: application/json" \
     http://localhost:5000/api/products
```
