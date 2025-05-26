require("dotenv").config(); 
const app = require('./server');
const multer = require('multer');
const { BlobServiceClient } = require('@azure/storage-blob');
const mongoose = require('mongoose');

// Define schema
const FileMeta = mongoose.model('FileMeta', new mongoose.Schema({
  title: String,
  description: String,
  azureBlobName: String,
  blobUrl: String,
  originalName: String,
  uploadDate: { type: Date, default: Date.now },
  path: [String]
}));

// Multer
//more stprage: const upload = multer({ storage: multer.memoryStorage(),limits: { fileSize: 50 * 1024 * 1024 } // Allow files up to 50MB});
const upload = multer({ storage: multer.memoryStorage() });

//Azure connect
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_CONTAINER_NAME);

//Uploa our route
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded.' });

    console.log('File received:', file);

    const { title, description, Uploadpath } = req.body;
    console.log('Form data received:', { title, description, Uploadpath });

    const blobName = Date.now() + '-' + file.originalname;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    try {
      await blockBlobClient.uploadData(file.buffer); // This uploads the file buffer to Azure Blob Storage
    } catch (uploadErr) {
      console.error('❌ Azure upload error:', uploadErr);
      return res.status(500).json({ message: 'Azure upload failed.', error: uploadErr.message }); // If an error occurs during upload, respond with an error
    }
    
    const encodedBlobName = encodeURIComponent(blobName);
    const blobUrl = `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${process.env.AZURE_CONTAINER_NAME}/${encodedBlobName}`;

    const safePath = Uploadpath?.replace(/(\.\.|\\)/g, ''); // Some data validation
    const FinalPath = safePath.split("/").map(p => p.trim()).filter(p => p);

    const meta = new FileMeta({
      title,
      description,
      path: FinalPath,
      azureBlobName: blobName,
      blobUrl,
      originalName: file.originalname
    });

    await meta.save();
    res.json({ message: '✅ File uploaded successfully.', url: blobUrl });
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ message: 'Server error during upload.' });
  }
});
