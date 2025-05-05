const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const dbHandler = require('../helpers/db-handler');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Load test environment variables
require('../helpers/test-env');

// Initialize chai-http properly
chai.use(chaiHttp);

describe('Additional API Endpoints', function() {
  // Set reasonable timeout
  this.timeout(5000);
  
  let app;
  let FileMeta;
  
  before(async () => {
    // Connect to the in-memory database before importing the app
    await dbHandler.connect();
    
    // Import the app after DB connection is established
    app = require('../../server');
    
    // Access the already defined model instead of creating a new one
    FileMeta = mongoose.models.filemetas || 
      mongoose.model('filemetas', new Schema({
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
  
  after(async () => {
    // Close the server if it exists
    if (app.closeServer) {
      await app.closeServer();
      console.log('Server closed via closeServer method');
    }
    
    // Close the MongoDB connection
    await dbHandler.closeDatabase();
    
    console.log('Additional API endpoints test cleanup complete');
  });

  describe('GET /ping', () => {
    it('should return a pong response', async () => {
      const res = await chai.request(app).get('/ping');
      
      expect(res).to.have.status(200);
      expect(res.text).to.equal('Pong');
    });
  });

  describe('GET /files/:id', () => {
    it('should return a specific file by ID', async () => {
      // Create test data
      const fileData = { 
        title: 'Test File Get By ID', 
        description: 'Test description',
        path: ['TestFolder'] 
      };
      
      const newFile = await FileMeta.create(fileData);
      
      const res = await chai.request(app).get(`/files/${newFile._id}`);
      
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body.title).to.equal(fileData.title);
      expect(res.body.description).to.equal(fileData.description);
    });

    it('should return 404 for non-existent file ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await chai.request(app).get(`/files/${nonExistentId}`);
      
      expect(res).to.have.status(404);
    });

    it('should handle invalid ObjectId format', async () => {
      const res = await chai.request(app).get('/files/invalid-id');
      
      expect(res).to.have.status(500);
    });
  });

  describe('POST /createFolder', () => {
    it('should create a new folder', async () => {
      const folderData = {
        title: 'Test Folder',
        description: 'Test folder description',
        path: ['TestFolder']
      };
      
      const res = await chai.request(app)
        .post('/createFolder')
        .send(folderData);
      
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('message', 'Folder created successfully');
      
      // Verify folder was created in database
      const savedFolder = await FileMeta.findOne({ title: folderData.title });
      expect(savedFolder).to.exist;
      expect(savedFolder.description).to.equal(folderData.description);
      expect(savedFolder.path).to.deep.equal(folderData.path);
      expect(savedFolder.azureBlobName).to.be.null;
      expect(savedFolder.blobUrl).to.be.null;
      expect(savedFolder.originalName).to.be.null;
    });
  });

  describe('PATCH /files/:id', () => {
    it('should update an existing file', async () => {
      // Create test data
      const originalData = { 
        title: 'Original Title', 
        description: 'Original description',
        path: ['OriginalFolder'] 
      };
      
      const newFile = await FileMeta.create(originalData);
      
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        path: ['UpdatedFolder', 'SubFolder']
      };
      
      const res = await chai.request(app)
        .patch(`/files/${newFile._id}`)
        .send(updateData);
      
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('object');
      expect(res.body.title).to.equal(updateData.title);
      expect(res.body.description).to.equal(updateData.description);
      expect(res.body.path).to.deep.equal(updateData.path);
      
      // Verify database was updated
      const updatedFile = await FileMeta.findById(newFile._id);
      expect(updatedFile.title).to.equal(updateData.title);
      expect(updatedFile.description).to.equal(updateData.description);
      expect(updatedFile.path).to.deep.equal(updateData.path);
    });

    it('should return 404 when updating a non-existent file', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const res = await chai.request(app)
        .patch(`/files/${nonExistentId}`)
        .send({ title: 'New Title' });
      
      expect(res).to.have.status(404);
    });
  });

  describe('GET /files', () => {
    it('should return all files', async () => {
      // Create test data
      await FileMeta.create([
        { 
          title: 'Test File 1', 
          description: 'Description 1',
          path: ['Folder1'] 
        },
        { 
          title: 'Test File 2', 
          description: 'Description 2',
          path: ['Folder2'] 
        }
      ]);

      const res = await chai.request(app).get('/files');
      
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.equal(2);
      expect(res.body[0]).to.have.property('title');
      expect(res.body[1]).to.have.property('title');
    });

    it('should handle database errors', async () => {
      // Mock a database error by temporarily replacing the find method
      const originalFind = FileMeta.find;
      FileMeta.find = () => {
        throw new Error('Mock database error');
      };

      const res = await chai.request(app).get('/files');
      
      expect(res).to.have.status(500);
      
      // Restore the original find method
      FileMeta.find = originalFind;
    });
  });
});