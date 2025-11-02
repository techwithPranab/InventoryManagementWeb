# Frontend Updates Required for Client-Specific Database

## Overview
The frontend needs to be updated to include the `X-Client-Code` header in API requests to work with the new client-specific database implementation.

## Required Changes

### 1. API Service Layer Updates

Update your API service to include the client code header:

```javascript
// services/api.js or similar
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.clientCode = localStorage.getItem('clientCode') || null;
  }

  setClientCode(clientCode) {
    this.clientCode = clientCode;
    localStorage.setItem('clientCode', clientCode);
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (this.clientCode) {
      headers['X-Client-Code'] = this.clientCode;
    }

    return headers;
  }

  async get(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async post(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }
    return response.json();
  }
}

export default new ApiService();
```

### 2. Authentication Flow Updates

Update the login process to handle client codes:

```javascript
// components/Login.js
const handleLogin = async (credentials) => {
  try {
    // First, authenticate the user
    const response = await apiService.post('/auth/login', credentials);
    
    // Store the token
    localStorage.setItem('token', response.token);
    
    // If the user has a specific client code, set it
    if (response.user.clientCode) {
      apiService.setClientCode(response.user.clientCode);
    } else {
      // For admin users, they might need to select a client
      // or have a default client code
      const clientCode = prompt('Enter client code:');
      if (clientCode) {
        apiService.setClientCode(clientCode);
      }
    }
    
    // Redirect to dashboard
    navigate('/dashboard');
  } catch (error) {
    setError(error.message);
  }
};
```

### 3. Client Code Management

Add a client code selector for admin users:

```javascript
// components/ClientSelector.js
import React, { useState } from 'react';
import apiService from '../services/api';

const ClientSelector = () => {
  const [clientCode, setClientCode] = useState(apiService.clientCode || '');

  const handleClientCodeChange = (e) => {
    const newClientCode = e.target.value;
    setClientCode(newClientCode);
    apiService.setClientCode(newClientCode);
    
    // Refresh the page or update the context to reload data
    window.location.reload();
  };

  return (
    <div className="client-selector">
      <label htmlFor="client-code">Client Code:</label>
      <input
        id="client-code"
        type="text"
        value={clientCode}
        onChange={handleClientCodeChange}
        placeholder="Enter client code"
      />
    </div>
  );
};

export default ClientSelector;
```

### 4. Context/State Management

Use React Context to manage client code across the app:

```javascript
// contexts/ClientContext.js
import React, { createContext, useContext, useState } from 'react';
import apiService from '../services/api';

const ClientContext = createContext();

export const useClient = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
};

export const ClientProvider = ({ children }) => {
  const [clientCode, setClientCode] = useState(
    localStorage.getItem('clientCode') || null
  );

  const updateClientCode = (newClientCode) => {
    setClientCode(newClientCode);
    apiService.setClientCode(newClientCode);
  };

  return (
    <ClientContext.Provider value={{ clientCode, updateClientCode }}>
      {children}
    </ClientContext.Provider>
  );
};
```

### 5. Error Handling

Update error handling to deal with client-specific errors:

```javascript
// utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.message.includes('Client code is required')) {
    // Redirect to client selection
    window.location.href = '/select-client';
  } else if (error.message.includes('Invalid client code')) {
    // Clear invalid client code and ask for new one
    localStorage.removeItem('clientCode');
    alert('Invalid client code. Please select a valid client.');
    window.location.href = '/select-client';
  } else {
    // Handle other errors normally
    console.error('API Error:', error);
  }
};
```

## Example Usage

After implementing these changes, your components can make API calls normally:

```javascript
// components/ProductList.js
import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await apiService.get('/products');
        setProducts(data.products);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Component JSX...
};
```

## Key Points

1. **Always include client code**: The `X-Client-Code` header must be included in requests to inventory-related endpoints
2. **Handle missing client codes**: Provide UI for users to select/enter client codes
3. **Store client code**: Use localStorage or context to persist the client code across sessions
4. **Error handling**: Gracefully handle client code validation errors
5. **Admin flexibility**: Allow admin users to switch between different client databases

## Testing

You can test the implementation with curl commands:

```bash
# Login to get a token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"password123"}'

# Use the token and client code to access products
curl -H "Authorization: Bearer YOUR_TOKEN" \
     -H "X-Client-Code: testclient" \
     http://localhost:5000/api/products
```
