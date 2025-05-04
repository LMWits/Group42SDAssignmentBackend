const { BlobServiceClient } = require("@azure/storage-blob");
require("dotenv").config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

if (!connectionString) {
  console.error("❌ Missing AZURE_STORAGE_CONNECTION_STRING in .env");
  process.exit(1);
}

try {
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  console.log("✅ Connection string is valid. BlobServiceClient created successfully.");
} catch (err) {
  console.error("❌ Azure error:", err.message);
}
