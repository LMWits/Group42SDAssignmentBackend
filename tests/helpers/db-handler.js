const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;
let isConnected = false;
let mongoServer;

/**
 * Connect to the in-memory database.
 */
module.exports.connect = async () => {
  // If already connected, return
  if (isConnected) return;
  
  mongod = await MongoMemoryServer.create();
  mongoServer = mongod; // Store reference for explicit cleanup
  const uri = mongod.getUri();
  
  // Disconnect from any existing connection first
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  const mongooseOpts = {};

  await mongoose.connect(uri, mongooseOpts);
  isConnected = true;
  
  // Override default mongoose.connect to prevent accidental connection in tests
  const originalConnect = mongoose.connect;
  mongoose.connect = async () => {
    console.log('Attempted to connect to MongoDB outside of test environment. Connection prevented.');
    return mongoose.connection;
  };
  
  // Store original connect for restore
  mongoose._originalConnect = originalConnect;
};

/**
 * Drop database, close the connection and stop mongod.
 */
module.exports.closeDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    
    if (mongod) {
      await mongod.stop(true); // true parameter forces immediate stop
    }
    
    // Add explicit call to stop mongo memory server
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    isConnected = false;
    
    // Restore original mongoose.connect
    if (mongoose._originalConnect) {
      mongoose.connect = mongoose._originalConnect;
      delete mongoose._originalConnect;
    }
    
    console.log('Test database connection closed successfully');
  } catch (error) {
    console.error('Error closing test database:', error);
  }
};

/**
 * Remove all the data for all db collections.
 */
module.exports.clearDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
};