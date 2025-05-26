const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const dbHandler = require('../helpers/db-handler');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Load test environment variables
require('../helpers/test-env');

// Initialize chai-http properly
chai.use(chaiHttp);

describe('File Upload API', function() {
  // More reasonable timeout
  this.timeout(5000);
  
  let app;
  let FileMeta;
  
  before(async () => {
    // Connect to in-memory database before importing any app code
    await dbHandler.connect();
    
    // Import the app after DB connection is established
    app = require('../../server');
    
    // Get reference to the FileMeta model
    FileMeta = mongoose.models.FileMeta || 
      mongoose.model('FileMeta', new Schema({
        title: String,
        description: String,
        azureBlobName: String,
        blobUrl: String,
        originalName: String,
        uploadDate: { type: Date, default: Date.now },
        path: [String]
      }));
  });
  
  afterEach(async () => {
    await dbHandler.clearDatabase();
  });
  
  after(async () => {
    // Close the server if it exists
    if (app.closeServer) {
      await app.closeServer();
      console.log('Server closed via closeServer method');
    }
    
    // Explicitly restore sinon stubs if they exist
    if (sinon.restore) sinon.restore();
    
    // Close the MongoDB connection
    await dbHandler.closeDatabase();
    
    console.log('Upload API test cleanup complete');
  });

  // Test: FileMeta model should save and retrieve a document
  it('should save and retrieve a FileMeta document', async function() {
    const meta = new FileMeta({
      title: 'Test File',
      description: 'A test file',
      azureBlobName: 'blob123',
      blobUrl: 'http://example.com/blob',
      originalName: 'test.txt',
      path: ['folder1', 'folder2']
    });
    await meta.save();
    const found = await FileMeta.findOne({ azureBlobName: 'blob123' });
    expect(found).to.exist;
    expect(found.title).to.equal('Test File');
    expect(found.path).to.deep.equal(['folder1', 'folder2']);
  });

  // Test: FileMeta model should default uploadDate
  it('should set uploadDate by default', async function() {
    const meta = new FileMeta({
      title: 'Date Test',
      description: 'Check date',
      azureBlobName: 'dateblob',
      blobUrl: 'http://example.com/date',
      originalName: 'date.txt',
      path: []
    });
    await meta.save();
    const found = await FileMeta.findOne({ azureBlobName: 'dateblob' });
    expect(found.uploadDate).to.be.an.instanceof(Date);
  });

  // Test: FileMeta model should allow empty path array
  it('should allow saving FileMeta with empty path array', async function() {
    const meta = new FileMeta({
      title: 'Empty Path',
      description: 'No folders',
      azureBlobName: 'emptypath',
      blobUrl: 'http://example.com/emptypath',
      originalName: 'empty.txt',
      path: []
    });
    await meta.save();
    const found = await FileMeta.findOne({ azureBlobName: 'emptypath' });
    expect(found).to.exist;
    expect(found.path).to.deep.equal([]);
  });

  // Test: FileMeta model should update fields
  it('should update FileMeta fields', async function() {
    const meta = new FileMeta({
      title: 'Update Test',
      description: 'Before update',
      azureBlobName: 'updateme',
      blobUrl: 'http://example.com/updateme',
      originalName: 'update.txt',
      path: ['old']
    });
    await meta.save();
    meta.title = 'Updated Title';
    meta.description = 'After update';
    meta.path = ['new'];
    await meta.save();
    const found = await FileMeta.findOne({ azureBlobName: 'updateme' });
    expect(found.title).to.equal('Updated Title');
    expect(found.description).to.equal('After update');
    expect(found.path).to.deep.equal(['new']);
  });

  // Test: FileMeta model should delete a document
  it('should delete a FileMeta document', async function() {
    const meta = new FileMeta({
      title: 'Delete Test',
      description: 'To be deleted',
      azureBlobName: 'deleteblob',
      blobUrl: 'http://example.com/delete',
      originalName: 'delete.txt',
      path: ['delete']
    });
    await meta.save();
    await FileMeta.deleteOne({ azureBlobName: 'deleteblob' });
    const found = await FileMeta.findOne({ azureBlobName: 'deleteblob' });
    expect(found).to.not.exist;
  });
  
  describe('GET /files', () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: 'testuser', email: 'test@example.com', role: 'admin' }, process.env.JWT_SECRET);
    it('should return an array of files (empty if none exist)', async () => {
      const res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
    });
  });

  describe('GET /ping', () => {
    it('should return pong', async () => {
      const res = await chai.request(app).get('/ping');
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('message', 'pong');
    });
  });
});