const chai = require('chai');
const expect = chai.expect;
const mongoose = require('mongoose');
const dbHandler = require('../helpers/db-handler');

// Load test environment variables
require('../helpers/test-env');

describe('Folder Integration Tests', () => {
  let FileMeta;
  
  before(async () => {
    await dbHandler.connect();
    
    // Get FileMeta model if it exists or create it
    FileMeta = mongoose.models.filemetas || 
      mongoose.model('filemetas', new mongoose.Schema({
        title: String,
        description: String,
        azureBlobName: String,
        blobUrl: String,
        originalName: String,
        uploadDate: { type: Date, default: Date.now },
        path: [String]
      }));
  });
  
  afterEach(async () => await dbHandler.clearDatabase());
  after(async () => await dbHandler.closeDatabase());

  describe('Folder structure operations', () => {
    it('should correctly retrieve nested folder structures', async () => {
      // Create a complex folder structure
      await FileMeta.create([
        { 
          title: 'File 1', 
          description: 'First file',
          azureBlobName: 'blob1',
          blobUrl: 'https://example.com/blob1',
          path: ['Projects', 'Web', 'Frontend'] 
        },
        { 
          title: 'File 2', 
          description: 'Second file',
          azureBlobName: 'blob2',
          blobUrl: 'https://example.com/blob2',
          path: ['Projects', 'Web', 'Backend'] 
        },
        { 
          title: 'File 3', 
          description: 'Third file',
          azureBlobName: 'blob3',
          blobUrl: 'https://example.com/blob3',
          path: ['Projects', 'Mobile'] 
        },
        { 
          title: 'File 4', 
          description: 'Fourth file',
          azureBlobName: 'blob4',
          blobUrl: 'https://example.com/blob4',
          path: ['Documents', 'Legal'] 
        }
      ]);

      // Test retrieving top-level folders
      const topFolders = await FileMeta.find({}).distinct('path.0');
      expect(topFolders).to.include('Projects');
      expect(topFolders).to.include('Documents');
      
      // Test retrieving subfolders for 'Projects'
      const projectsFolders = await FileMeta.find({ 'path.0': 'Projects' }).distinct('path.1');
      expect(projectsFolders).to.include('Web');
      expect(projectsFolders).to.include('Mobile');

      // Test retrieving files in 'Frontend' folder
      const frontendFiles = await FileMeta.find({ path: 'Frontend' });
      expect(frontendFiles).to.have.lengthOf(1);
      expect(frontendFiles[0].title).to.equal('File 1');
    });

    it('should handle file path changes correctly', async () => {
      // Create a file in a specific path
      const file = await FileMeta.create({
        title: 'Movable File',
        description: 'This file will be moved',
        azureBlobName: 'movable-blob',
        blobUrl: 'https://example.com/movable',
        path: ['Original', 'Location']
      });

      // Update the file's path
      await FileMeta.updateOne(
        { _id: file._id },
        { $set: { path: ['New', 'Path'] } }
      );

      // Verify the file has been moved
      const movedFile = await FileMeta.findById(file._id);
      expect(movedFile.path).to.deep.equal(['New', 'Path']);

      // Check old location is empty
      const filesInOldPath = await FileMeta.find({ path: 'Location' });
      expect(filesInOldPath).to.have.lengthOf(0);

      // Check new location has our file
      const filesInNewPath = await FileMeta.find({ path: 'Path' });
      expect(filesInNewPath).to.have.lengthOf(1);
      expect(filesInNewPath[0].title).to.equal('Movable File');
    });
  });
});