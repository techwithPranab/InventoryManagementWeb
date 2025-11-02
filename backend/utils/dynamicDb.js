const mongoose = require('mongoose');

/**
 * Dynamic Database Connection Utility
 * 
 * This utility manages dynamic connections to client-specific databases
 * based on the client code extracted from PAT token authentication.
 * 
 * Features:
 * - Connection pooling and reuse
 * - Automatic connection cleanup
 * - Error handling and retry logic
 * - Model registration for client databases
 */

class DatabaseManager {
  constructor() {
    this.connections = new Map(); // Store active connections
    this.models = new Map(); // Store registered models per connection
  }

  /**
   * Get or create a connection to the client database
   * @param {string} databaseName - Name of the client database
   * @param {Object} options - Connection options
   * @returns {mongoose.Connection} - Database connection
   */
  async getClientConnection(databaseName, options = {}) {
    try {
      // Check if connection already exists and is ready
      if (this.connections.has(databaseName)) {
        const connection = this.connections.get(databaseName);
        
        // Check connection state
        if (connection.readyState === 1) { // Connected
          return connection;
        } else if (connection.readyState === 2) { // Connecting
          // Wait for connection to be established
          await new Promise((resolve, reject) => {
            connection.once('connected', resolve);
            connection.once('error', reject);
            // Timeout after 10 seconds
            setTimeout(() => reject(new Error('Connection timeout')), 10000);
          });
          return connection;
        } else {
          // Connection is disconnected, remove it and create new one
          this.connections.delete(databaseName);
          this.models.delete(databaseName);
        }
      }

      // Create new connection
      const connectionString = this.buildConnectionString(databaseName);
      const connectionOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10, // Maximum number of connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        bufferMaxEntries: 0, // Disable mongoose buffering
        bufferCommands: false, // Disable mongoose buffering
        ...options
      };

      const connection = mongoose.createConnection(connectionString, connectionOptions);

      // Set up connection event handlers
      connection.on('connected', () => {
        console.log(`Connected to client database: ${databaseName}`);
      });

      connection.on('error', (error) => {
        console.error(`Database connection error for ${databaseName}:`, error);
        // Remove failed connection
        this.connections.delete(databaseName);
        this.models.delete(databaseName);
      });

      connection.on('disconnected', () => {
        console.log(`Disconnected from client database: ${databaseName}`);
        // Remove disconnected connection
        this.connections.delete(databaseName);
        this.models.delete(databaseName);
      });

      // Store connection
      this.connections.set(databaseName, connection);
      this.models.set(databaseName, new Map());

      // Wait for connection to be established
      await new Promise((resolve, reject) => {
        connection.once('connected', resolve);
        connection.once('error', reject);
        // Timeout after 10 seconds
        setTimeout(() => reject(new Error('Connection timeout')), 10000);
      });

      return connection;

    } catch (error) {
      console.error(`Failed to connect to database ${databaseName}:`, error);
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  /**
   * Build MongoDB connection string for client database
   * @param {string} databaseName - Name of the client database
   * @returns {string} - MongoDB connection string
   */
  buildConnectionString(databaseName) {
    const {
      MONGODB_URI,
      MONGODB_HOST = 'localhost',
      MONGODB_PORT = '27017',
      MONGODB_USERNAME,
      MONGODB_PASSWORD
    } = process.env;

    // If full URI is provided, replace database name
    if (MONGODB_URI) {
      return MONGODB_URI.replace(/\/[^\/]*(\?|$)/, `/${databaseName}$1`);
    }

    // Build URI from components
    let connectionString = 'mongodb://';
    
    if (MONGODB_USERNAME && MONGODB_PASSWORD) {
      connectionString += `${MONGODB_USERNAME}:${MONGODB_PASSWORD}@`;
    }
    
    connectionString += `${MONGODB_HOST}:${MONGODB_PORT}/${databaseName}`;

    return connectionString;
  }

  /**
   * Get or register a model for a specific client connection
   * @param {string} databaseName - Name of the client database
   * @param {string} modelName - Name of the model
   * @param {mongoose.Schema} schema - Mongoose schema
   * @param {string} collectionName - Optional collection name
   * @returns {mongoose.Model} - Mongoose model
   */
  async getModel(databaseName, modelName, schema, collectionName) {
    try {
      const connection = await this.getClientConnection(databaseName);
      const connectionModels = this.models.get(databaseName);

      // Check if model is already registered
      if (connectionModels.has(modelName)) {
        return connectionModels.get(modelName);
      }

      // Register new model
      const model = connection.model(modelName, schema, collectionName);
      connectionModels.set(modelName, model);

      return model;

    } catch (error) {
      console.error(`Failed to get model ${modelName} for database ${databaseName}:`, error);
      throw new Error(`Model registration failed: ${error.message}`);
    }
  }

  /**
   * Close connection to a specific client database
   * @param {string} databaseName - Name of the client database
   */
  async closeConnection(databaseName) {
    try {
      if (this.connections.has(databaseName)) {
        const connection = this.connections.get(databaseName);
        await connection.close();
        this.connections.delete(databaseName);
        this.models.delete(databaseName);
        console.log(`Closed connection to database: ${databaseName}`);
      }
    } catch (error) {
      console.error(`Error closing connection to ${databaseName}:`, error);
    }
  }

  /**
   * Close all client database connections
   */
  async closeAllConnections() {
    try {
      const promises = Array.from(this.connections.keys()).map(databaseName => 
        this.closeConnection(databaseName)
      );
      await Promise.all(promises);
      console.log('All client database connections closed');
    } catch (error) {
      console.error('Error closing database connections:', error);
    }
  }

  /**
   * Get connection statistics
   * @returns {Object} - Connection statistics
   */
  getConnectionStats() {
    const stats = {
      totalConnections: this.connections.size,
      connections: []
    };

    for (const [databaseName, connection] of this.connections) {
      stats.connections.push({
        databaseName,
        readyState: connection.readyState,
        readyStateText: this.getReadyStateText(connection.readyState),
        modelsCount: this.models.get(databaseName)?.size || 0
      });
    }

    return stats;
  }

  /**
   * Get readable text for connection ready state
   * @param {number} readyState - Connection ready state
   * @returns {string} - Readable state text
   */
  getReadyStateText(readyState) {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return states[readyState] || 'unknown';
  }

  /**
   * Health check for all connections
   * @returns {Object} - Health check results
   */
  async healthCheck() {
    const results = {
      healthy: true,
      connections: []
    };

    for (const [databaseName, connection] of this.connections) {
      try {
        // Simple ping to check connection
        await connection.db.admin().ping();
        
        results.connections.push({
          databaseName,
          status: 'healthy',
          readyState: connection.readyState
        });
      } catch (error) {
        results.healthy = false;
        results.connections.push({
          databaseName,
          status: 'unhealthy',
          readyState: connection.readyState,
          error: error.message
        });
      }
    }

    return results;
  }
}

// Create singleton instance
const dbManager = new DatabaseManager();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing database connections...');
  await dbManager.closeAllConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing database connections...');
  await dbManager.closeAllConnections();
  process.exit(0);
});

module.exports = dbManager;
