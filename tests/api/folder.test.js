const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const dbHandler = require('../helpers/db-handler');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const jwt = require('jsonwebtoken');

// Load test environment variables
require('../helpers/test-env');

// Initialize chai-http properly
chai.use(chaiHttp);

describe('Folder API Routes', function() {
  // Set reasonable timeout
  this.timeout(5000);
  
  let app;
  let FileMeta;
  const token = jwt.sign({ userId: 'testuser', email: 'test@example.com', role: 'admin' }, process.env.JWT_SECRET);
  
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
    
    console.log('Folder API test cleanup complete');
  });

  describe('GET /folders', () => {
    it('should return all top-level folders', async () => {
      // Create test data
      await FileMeta.create({ 
        title: 'Test File 1', 
        path: ['Folder1', 'SubFolder'] 
      });
      await FileMeta.create({ 
        title: 'Test File 2', 
        path: ['Folder2'] 
      });

      const res = await chai.request(app).get('/folders')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
      expect(res.body).to.include('Folder1');
      expect(res.body).to.include('Folder2');
    });
  });

  describe('GET /folder/files/:folderName', () => {
    it('should return files in the specified folder', async () => {
      // Create test data
      const file1 = await FileMeta.create({ 
        title: 'Test File 1', 
        description: 'Description 1',
        azureBlobName: 'blob1',
        blobUrl: 'https://example.com/blob1',
        originalName: 'original1.txt',
        path: ['Legal', 'Contracts'] 
      });
      const file2 = await FileMeta.create({ 
        title: 'Test File 2', 
        description: 'Description 2',
        azureBlobName: 'blob2',
        blobUrl: 'https://example.com/blob2',
        originalName: 'original2.txt',
        path: ['Legal', 'Contracts', 'Signed'] 
      });
      const file3 = await FileMeta.create({ 
        title: 'Test File 3', 
        description: 'Description 3',
        azureBlobName: 'blob3',
        blobUrl: 'https://example.com/blob3',
        originalName: 'original3.txt',
        path: ['HR'] 
      });

      // Test for files in the 'Contracts' folder
      const res = await chai.request(app)
        .get(`/folder/files/${encodeURIComponent('Contracts')}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.equal(1);
      expect(res.body[0].title).to.equal('Test File 1');
    });

    it('should return an empty array for non-existent folder', async () => {
      const res = await chai.request(app)
        .get(`/folder/files/NonExistentFolder`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.equal(0);
    });
  });

  describe('GET /folders/:folderName', () => {
    it('should return subfolders in the specified folder', async () => {
      // Create test data with nested folders
      await FileMeta.create({ 
        title: 'Test File 1', 
        path: ['Parent', 'Child1', 'Grandchild'] 
      });
      await FileMeta.create({ 
        title: 'Test File 2', 
        path: ['Parent', 'Child2'] 
      });
      await FileMeta.create({ 
        title: 'Test File 3', 
        path: ['Parent', 'Child3'] 
      });

      const res = await chai.request(app)
        .get(`/folders/Parent`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
      expect(res.body).to.have.members(['Child1', 'Child2', 'Child3']);
    });
  });

  describe('GET /fileWithNoFolder', () => {
    it('should return files without a folder path', async () => {
      // Create test data
      await FileMeta.create({ 
        title: 'File with path', 
        path: ['Some', 'Path'] 
      });
      
      const fileWithNoPath = await FileMeta.create({ 
        title: 'File without path',
        description: 'No path file' 
      });
      
      const emptyPathFile = await FileMeta.create({ 
        title: 'File with empty path',
        path: [] 
      });

      const res = await chai.request(app)
        .get('/fileWithNoFolder')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(1);
      
      // Check if returned files include those without paths
      const titles = res.body.map(file => file.title);
      expect(titles).to.include('File without path');
      expect(titles).to.include('File with empty path');
    });
  });
});