const mongoose = require('mongoose');

// Import schemas
const CategorySchema = require('../models/Category').schema;
const ProductSchema = require('../models/Product').schema;
const WarehouseSchema = require('../models/Warehouse').schema;
const InventorySchema = require('../models/Inventory').schema;
const PurchaseOrderSchema = require('../models/PurchaseOrder').schema;
const SalesOrderSchema = require('../models/SalesOrder').schema;
const UserSchema = require('../models/User').schema;
const ManufacturerSchema = require('../models/Manufacturer').schema;
const SupplierSchema = require('../models/Supplier').schema;
const ShippingSchema = require('../models/Shipping').schema;
const InventoryTransferSchema = require('../models/InventoryTransfer').schema;
const ContactSchema = require('../models/Contact').schema;

// Cache for client models to avoid recreation
const clientModelCache = new Map();

const getClientModels = (clientConnection) => {
  if (!clientConnection) {
    throw new Error('Client connection is required');
  }

  const connectionId = clientConnection.id;
  
  // Return cached models if they exist
  if (clientModelCache.has(connectionId)) {
    return clientModelCache.get(connectionId);
  }

  // Create models for this client connection
  const models = {
    Category: clientConnection.model('Category', CategorySchema),
    Product: clientConnection.model('Product', ProductSchema),
    Warehouse: clientConnection.model('Warehouse', WarehouseSchema),
    Inventory: clientConnection.model('Inventory', InventorySchema),
    PurchaseOrder: clientConnection.model('PurchaseOrder', PurchaseOrderSchema),
    SalesOrder: clientConnection.model('SalesOrder', SalesOrderSchema),
    User: clientConnection.model('User', UserSchema),
    Manufacturer: clientConnection.model('Manufacturer', ManufacturerSchema),
    Supplier: clientConnection.model('Supplier', SupplierSchema),
    Shipping: clientConnection.model('Shipping', ShippingSchema),
    InventoryTransfer: clientConnection.model('InventoryTransfer', InventoryTransferSchema),
    Contact: clientConnection.model('Contact', ContactSchema),
  };

  // Cache the models
  clientModelCache.set(connectionId, models);

  return models;
};

// Clean up cache when connection closes
const cleanupClientCache = (connectionId) => {
  clientModelCache.delete(connectionId);
};

module.exports = {
  getClientModels,
  cleanupClientCache
};
