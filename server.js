const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
require("dotenv").config(); //configuration used for .env files

const app = express();
app.use(express.static('public'));
const port = process.env.PORT || 3000;
const fs = require('fs');

app.use(cors()); //allow CORS from any origin
app.use(express.json()); //parse JSON bodies

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection failed:", err));

//define json schema
const fileSchema = new mongoose.Schema({
  title: String,               // Name of the file
  description: String,         // Extra info about it
  azureBlobName: String,       // Name of file in Azure blob
  blobUrl: String,             // URL to download/view the file
  originalName: String,        // What it was called before upload
  uploadDate: Date,            // When it was uploaded
  path: [String]               // Virtual folder path (e.g. ["Human Rights", "Court Files"])
});

//define FileMeta model to interact with mongoDB
/*
its telling Mongoose:
“Hey, here's a model called FileMeta, based on this schema. 
Use this model to save and fetch file data in MongoDB.”
*/
const filemetas = mongoose.model("filemetas", fileSchema);


//MongoDB query: fetches all 'files' json info
app.get('/files', async (req, res) => {
  try {
    const files = await filemetas.find({});
    res.json(files); // Send back JSON
  } catch (err) {
    res.status(500).send("Error fetching files from database");
  }
});

//MongoDB query: fetches files json info (files that are without paths/not in folder)
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

//MongoDB query: fetches all unique 'folders' in json array
app.get('/folders', async (req, res) => {
  try {
    const files = await filemetas.find({}); //Get all files from MongoDB
    const folderSet = new Set();

    files.forEach(file => {
      if (file.path && file.path.length > 0) {
        folderSet.add(file.path[0]); //Save the first part of the path (top-level folder)
      }
    });

    res.json([...folderSet]); //Send unique folder names as an array ('...' converts set to an array)
  } catch (err) {
    res.status(500).send("Error fetching folders");
  }
});

//MongoDB query: fetches all 'files' in parsed folder
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

//MongoDB query: fetches all folders (in specified) in json array
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
      const folderIndex = file.path.indexOf(folder);  // Find index of 'folder' in the path array

      if (folderIndex !== -1 && folderIndex < file.path.length - 1) {// If the folder exists && the given folder wasnt the last folder in the directory/path then...
        followingFoldersSet.add(file.path[folderIndex + 1]); //...add the folling folder (in the directory/path) to the set
      }
    });

    console.log("All following folders:");
    followingFoldersSet.forEach(followingFolder => console.log(followingFolder));

    res.json([...followingFoldersSet]);

  } catch (err) {
    res.status(500).send("Error fetching folders");
  }
});

module.exports = app;
