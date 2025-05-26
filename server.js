const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const cookieParser = require('cookie-parser');
const app = express();
const port = process.env.NODE_ENV === 'test' ? 0 : (process.env.PORT || 3000);
const fs = require('fs');
const axios = require("axios");
const jwt = require('jsonwebtoken');
const path = require('path');

// Helper function to get Authorization headers
function getAuthHeaders() {
  const token = localStorage.getItem('serverToken');
  return token ? { 'Authorization': 'Bearer ' + token } : {};
}

app.use(cors({
  origin: function(origin, callback) {
    // const allowed = ["http://localhost:8080", "http://127.0.0.1:8080"];
    const allowed = ["http://localhost:8080", "http://127.0.0.1:8080", "https://gentle-tree-06c29d803.6.azurestaticapps.net", "https://group42backendv2-hyckethpe4fwfjga.uksouth-01.azurewebsites.net"];
    
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process in production
  // process.exit(1);
});

// For your server startup - modified to store server reference and make it accessible
let server;
if (process.env.NODE_ENV !== 'test-setup') { // Only start the server if not in test-setup mode
  server = app.listen(port, () => {
    const addr = server.address();
    if (addr && addr.port) {
      console.log(`✅ Server running on port ${addr.port}`);
    } else {
      console.error("❌ Server started but address is null");
    }
  });
  

  server.on('error', (error) => {
    console.error('Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use`);
    }
  });
}

// Expose the server for testing purposes
app.server = server;

// Expose a method to close the server cleanly
app.closeServer = async () => {
  if (server) {
    return new Promise((resolve) => {
      server.close(() => {
        console.log('Server closed successfully');
        resolve();
      });
    });
  }
  return Promise.resolve();
};

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection failed:", err));

//define json schema
const fileSchema = new mongoose.Schema({
  title: { type: String, required: true },               // Name of the file
  description: String,         // Extra info about it
  azureBlobName: String,       // Name of file in Azure blob
  blobUrl: String,             // URL to download/view the file
  originalName: String,        // What it was called before upload
  uploadDate: Date,            // When it was uploaded
  path: [String]               // Virtual folder path (e.g. ["Human Rights", "Court Files"])
});

//define FileMeta model to interact with mongoDB
const filemetas = mongoose.model("filemetas", fileSchema);

// JWT authentication middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

// Apply requireAuth to all API routes except public endpoints
app.use((req, res, next) => {
  const publicExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.map', '.html'];
  const ext = path.extname(req.path);
  if (
    req.path === '/authorize' ||
    req.path === '/ping' ||
    req.path === '/debug-cookies' ||
    publicExtensions.includes(ext)
  ) {
    // Serve static file without auth
    const filePath = path.join(__dirname, 'public', req.path);
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        return next();
      }
      res.sendFile(filePath);
    });
    return;
  }
  requireAuth(req, res, next);
});

app.get('/files', async (req, res) => {
  try {
    const files = await filemetas.find({});
    res.json(files); // Send back JSON
  } catch (err) {
    res.status(500).send("Error fetching files from database");
  }
});

app.get('/ping', async (req, res) => {
  try {
    res.status(200).json({ message: 'pong' });
  } catch (err) {
    res.status(500).send("Error pinging");
  }
});

app.post('/authorize', (req, res) => {
  const { userId, email, role } = req.body;
  if (!userId || !email || !role) {
    return res.status(400).json({ error: 'Missing userId, email, or role' });
  }
  const token = jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '2h' });
  // No cookies: client must store token in localStorage and send in Authorization header
  res.json({ token });
});

//app.get('/adminHP.html', requireAuth, (req, res, next) => {
//  console.log('[AdminHP] Authenticated user:', req.user);
//  res.sendFile(path.join(__dirname, 'public', 'adminHP.html'));
//}); 

app.use((req, res, next) => {
  // Allow unauthenticated access to static assets (css, js, images, favicon, etc.)
  const publicExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.map', '.html'];
  const ext = path.extname(req.path);
  if (
    req.path === '/authorize' ||
    req.path === '/ping' ||
    req.path === '/debug-cookies' ||
    publicExtensions.includes(ext)
  ) {
    // Serve static file without auth
    const filePath = path.join(__dirname, 'public', req.path);
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        return next();
      }
      res.sendFile(filePath);
    });
    return;
  }
  // For all other routes, require authentication
  requireAuth(req, res, next);
});

app.get('/fileWithNoFolder', async (req, res) => {
  try {
    const files = await filemetas.find({});
    const fileWithNoFolder = new Set();

    files.forEach(file => {
      if (!file.path || file.path.length == 0) {
        fileWithNoFolder.add(file); //Save the first part of the path (top-level folder)
      }
    });

    res.json([...fileWithNoFolder]); // Send back JSON
  } catch (err) {
    res.status(500).send("Error fetching files from database");
  }
});

app.get('/folders', async (req, res) => {
  try {
    const files = await filemetas.find({}); //Get all files from MongoDB
    const folderSet = new Set();

    files.forEach(file => {
      if (file.path && file.path.length > 0) {
        folderSet.add(file.path[0]);
      }
      
      // Include top-level folders that are standalone (have no blob)
      if (
        (!file.azureBlobName || !file.blobUrl) &&
        file.path &&
        file.path.length === 1
      ) 
      {
        folderSet.add(file.path[0]);
      }
      
    });

    res.json([...folderSet]); //Send unique folder names as an array ('...' converts set to an array)
  } catch (err) {
    res.status(500).send("Error fetching folders");
  }
});

app.get('/folder/files/:folderName', async (req, res) => {
  try {
    const folder = req.params.folderName;

    /*
    send 'find' query to mongo to find any if there is a file with this folder name
    any where in its directoy
    */
    const files = await filemetas.find({
      path: { $exists: true, $type: 'array' },  // Ensure 'path' exists and is an array
      "path": { $in: [folder] },  // Check if folder is anywhere in the path
      "path.0": { $exists: true }  // Ensure path has at least one element (to handle edge cases where path is empty)
    });

    /*
      now, in this list of files, store the files that have the specified folder as the last entry in the path
    */
    const filteredFiles = files.filter(file => 
      file.path[file.path.length - 1] === folder //i.e if file.path[last index] == folder add to filteredFiles
    );


    res.json(filteredFiles);
  } catch (err) {
    res.status(500).send("Error fetching files in folder");
  }
});

app.get('/folders/:folderName', async (req, res) => {
  try {
    const folder = req.params.folderName;
    const followingFoldersSet = new Set(); //set to hold folder that comes after given 'folderName' in the path of each file

    const files = await filemetas.find({
      path: { $exists: true, $type: 'array' },  // Ensure 'path' exists and is an array
      "path": { $in: [folder] },  // Check if folder is anywhere in the path
    });

    //iterate over the files and extract the folder that comes directly after the 'folderName'
    files.forEach(file => {
      const folderIndex = file.path.indexOf(folder);
    
      // Case 1: regular files with subfolders
      if (folderIndex !== -1 && folderIndex < file.path.length - 1) {
        followingFoldersSet.add(file.path[folderIndex + 1]);
      }
    
      // Case 2: standalone folder entries (e.g. ["Human Rights", "Court Cases"]) created by user
      if (
        (!file.azureBlobName || !file.blobUrl) &&
        folderIndex !== -1 &&
        folderIndex < file.path.length - 1
      ) {
        followingFoldersSet.add(file.path[folderIndex + 1]);
      }
    });    

    console.log("All following folders:");
    followingFoldersSet.forEach(followingFolder => console.log(followingFolder));

    res.json([...followingFoldersSet]);

  } catch (err) {
    res.status(500).send("Error fetching folders");
  }
});

app.get('/files/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const file = await filemetas.findById(id);
    if (!file) return res.status(404).send("File not found");
    res.json(file);
  } catch (err) {
    res.status(500).send("Error fetching file by ID");
  }
});

//Create folder
app.post('/createFolder', async (req, res) => {
  try {
    const { title, description, path } = req.body;
    if (!title || !Array.isArray(path)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create an entry with no blob fields since it's a folder
    const newFolder = new filemetas({
      title,
      description,
      path,
      azureBlobName: null,
      blobUrl: null,
      originalName: null,
      uploadDate: new Date()
    });

    await newFolder.save();

    res.json({ message: "Folder created successfully" });
  } catch (err) {
    console.error("Error creating folder:", err);
    res.status(500).json({ message: "Error creating folder", error: err.message });
  }
});

app.patch('/files/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, path } = req.body;

  try {
    const updatedFile = await filemetas.findByIdAndUpdate(
      id,
      { title, description, path },
      { new: true } // Return updated document
    );
    if (!updatedFile) return res.status(404).send("File not found");
    res.json(updatedFile);
  } catch (err) {
    res.status(500).send("Error updating file");
  }
});


//mongoDB + AZURE query
/*
  1. DELETES the files JSON
  2. DELETES actual files (blob) from azure
*/
console.log("Using container:", process.env.AZURE_CONTAINER_NAME);

const { BlobServiceClient } = require('@azure/storage-blob');
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_CONTAINER_NAME);

app.delete('/files/:id', async (req, res) => {
  const { id } = req.params;

  try {
    //mongoDB delete
    const deletedFile = await filemetas.findByIdAndDelete(id); 
    if (!deletedFile) return res.status(404).send("File not found");

    //Azure delete
    console.log("Deleting file from Azure:", deletedFile.azureBlobName);

    try {
      const blockBlobClient = containerClient.getBlockBlobClient(deletedFile.azureBlobName);
      const result = await blockBlobClient.deleteIfExists();
      console.log("Azure blob deletion result:", result);
    } catch (azureErr) {
      console.error("Failed to delete blob from Azure:", azureErr.message);
    }

    res.send("File deleted (from mongoDB and Azure)");
  } catch (err) {
    console.error("Error during file deletion:", err);
    res.status(500).send("Error deleting file");
  }
});

app.get('/search', async (req, res) => {
  const { query } = req.query;

  if (!query) return res.status(400).json({ message: "Query required" });

  const translatedQuery = await translateToEnglish(query);
  const { keywords, type, year } = parseQuery(translatedQuery); //uses helper funtion parseQuery()
  const keywordRegexes = keywords.split(/\s+/).map(word => new RegExp(word, 'i'));// case-insensitive partial match on each word in keywords

  // and conditions: return documents where at least one of the words in keywords is in title, description, or a path folder
  const andConditions = keywordRegexes.map(regex => ({
    $or: [
      { title: regex },
      { description: regex },
      { path: regex }
    ]
  }));

  //file type filter
  if (type) {

    const typeExtensions = {
    pdf: /\.(pdf)$/i,
    image: /\.(jpg|jpeg|png|gif)$/i,
    audio: /\.(mp3|wav)$/i,
    video: /\.(mp4|mov|avi)$/i
    };

    andConditions.push({ originalName: { $regex: typeExtensions[type] }}); //add 'originalName:type' to andConditions using typeExtensions and parseQuery()
  }

  //try mongoDB query "find" then sort
  try {
    console.log("AND conditions:", andConditions); //remove

    const files = await filemetas.find({ $and: andConditions });

    //rank results based on score system
    const scored = files.map(file => {
      let score = 0;

      //Loops through each individual keyword (as a regex) and Adds points per keyword match per field
      console.log("keywords length:" + keywords.length)

      if(keywords.length > 0 || type){
        for (const regex of keywordRegexes) {
          if (file.title?.match(regex)) score += 5; //title match = 5
          if (file.description?.match(regex)) score += 2; //description match = 2
          if (file.path?.some(folder => folder.match(regex))) score += 1; //path match = 1
        }
      }
      
      //if year is in search, bring up score (not redundent because: year was removed as keyword so it wont be in keywordRegexes for loop above)
      const yearStr = year?.toString();
      if (yearStr) {
        if (file.title?.includes(yearStr)) score += 5;
        if (file.description?.includes(yearStr)) score += 2;
        if (file.path?.some(folder => folder.includes(yearStr))) score += 1;
      }

      //if searched year is in upload date, bring up score
      if (year && new Date(file.uploadDate).getFullYear() == year) {
        score += 2; //upload date = 2
      }

      return { file, score };
    });

    //filter out files with score=0
    const filtered = scored.filter(f => f.score > 0);

    //Sort by score descending
    filtered.sort((a, b) => b.score - a.score);

    console.log("FILES FOUND:", filtered);//remove

    //Return just the file data, sorted
    res.json(filtered.map(f => f.file));

  }catch (err) {
    console.error("Search error:", err);
    res.status(500).send("Error searching files");
  }
});


//Helper funtion to remove stop words in search query, allows for NLP
const stopWords = new Set([
  "the", "is", "in", "at", "of", "on", "for", "from", "a", "an", "to", "with", "by", "about", "show", "me", "uploaded"
]);

const typeKeywords = {
  pdf: ["pdf", "document", "file"],
  image: ["image", "photo", "jpg", "png", "jpeg", "picture"],
  audio: ["audio", "sound", "mp3", "wav", "song", "music"],
  video: ["video", "mp4", "mov","movie"]
};

function parseQuery(rawQuery) {
  if (!rawQuery) return { keywords: "", type: null, year: null};

  
  const words = rawQuery.toLowerCase().split(/\s+/); //convert to lowercase and split into words
  let cleanedWords = words.filter(word => !stopWords.has(word)); //filter out stop words
  
  let type = null;
  let year = null;

  //Look for typeKeywords in cleanedWords to detect type
  for (const [key, aliases] of Object.entries(typeKeywords)) {
    if (aliases.some(alias => cleanedWords.includes(alias))) {
      type = key;
      cleanedWords = cleanedWords.filter(word => !aliases.includes(word)); //remove type word from keywords
      break;
    }
  }

  //Look for year in cleanedWords to detect year
  const yearMatch = rawQuery.match(/\b(19|20)\d{2}\b/);

  if (yearMatch) {
    year = parseInt(yearMatch[0]);
    cleanedWords = cleanedWords.filter(word => word !== yearMatch[0]); //remove year from keywords
  }

  return {
    keywords: cleanedWords.join(" "),
    type,
    year
  };
}


//Multi language search function
async function translateToEnglish(text) {
  try {
    const response = await axios.post('https://google-translate113.p.rapidapi.com/api/v1/translator/text', {
      text,
      to: 'en',
      from: 'auto'
    }, {
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'google-translate113.p.rapidapi.com'
      }
    });

    //console.log("Full API response:", response.data); //remove
    const translated = response.data.trans;
    console.log(`🔤 Translated "${text}" → "${translated}"`); //remove

    return translated;
  } catch (error) {
    console.error("Translation failed:", error.response?.data || error.message);
    return text;
  }
}


app.get('/debug-cookies', (req, res) => {
  res.json({ cookies: req.cookies, headers: req.headers });
});

module.exports = app;
