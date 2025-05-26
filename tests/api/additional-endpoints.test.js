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

describe('Additional API Endpoints', function() {
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
    
    console.log('Additional API endpoints test cleanup complete');
  });

  describe('GET /ping', () => {
    it('should return a pong response', async () => {
      const res = await chai.request(app).get('/ping');
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('message', 'pong');
    });
  });

  describe('GET /files', () => {
    it('should return 401 if no token is provided', async () => {
      const res = await chai.request(app).get('/files');
      expect(res).to.have.status(401);
    });
    it('should return 401 if token is invalid', async () => {
      const res = await chai.request(app)
        .get('/files')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res).to.have.status(401);
    });
    it('should return all files with valid token', async () => {
      await FileMeta.create([
        { title: 'Test File 1', path: ['Folder1'] },
        { title: 'Test File 2', path: ['Folder2'] }
      ]);
      const res = await chai.request(app)
        .get('/files')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.equal(2);
    });
  });

  describe('POST /createFolder', () => {
    it('should return 400 if required fields are missing', async () => {
      const res = await chai.request(app)
        .post('/createFolder')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res).to.have.status(400);
      expect(res.body).to.have.property('error');
    });
    it('should create a new folder with valid fields', async () => {
      const folderData = {
        title: 'Test Folder',
        description: 'Test folder description',
        path: ['TestFolder']
      };
      const res = await chai.request(app)
        .post('/createFolder')
        .set('Authorization', `Bearer ${token}`)
        .send(folderData);
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('message', 'Folder created successfully');
      const savedFolder = await FileMeta.findOne({ title: folderData.title });
      expect(savedFolder).to.exist;
      expect(savedFolder.description).to.equal(folderData.description);
      expect(savedFolder.path).to.deep.equal(folderData.path);
    });
  });

  describe('GET /fileWithNoFolder', () => {
    it('should return files with no folder', async () => {
      await FileMeta.create({ title: 'No Folder', path: [] });
      const res = await chai.request(app)
        .get('/fileWithNoFolder')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
      expect(res.body[0].title).to.equal('No Folder');
    });
  });

  describe('GET /folders', () => {
    it('should return all top-level folders', async () => {
      await FileMeta.create({ title: 'File1', path: ['FolderA'] });
      await FileMeta.create({ title: 'File2', path: ['FolderB'] });
      const res = await chai.request(app)
        .get('/folders')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      expect(res.body).to.include('FolderA');
      expect(res.body).to.include('FolderB');
    });
  });

  describe('GET /folders/:folderName', () => {
    it('should return subfolders in the specified folder', async () => {
      await FileMeta.create({ title: 'File1', path: ['Parent', 'Child1'] });
      await FileMeta.create({ title: 'File2', path: ['Parent', 'Child2'] });
      const res = await chai.request(app)
        .get('/folders/Parent')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      expect(res.body).to.include('Child1');
      expect(res.body).to.include('Child2');
    });
  });

  describe('GET /folder/files/:folderName', () => {
    it('should return files in the specified folder', async () => {
      await FileMeta.create({ title: 'File1', path: ['FolderX'] });
      const res = await chai.request(app)
        .get('/folder/files/FolderX')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      expect(res.body[0].title).to.equal('File1');
    });
  });

  describe('PATCH /files/:id', () => {
    it('should update an existing file', async () => {
      const file = await FileMeta.create({ title: 'Old', path: ['A'] });
      const res = await chai.request(app)
        .patch(`/files/${file._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'New', path: ['B'] });
      expect(res).to.have.status(200);
      expect(res.body.title).to.equal('New');
      expect(res.body.path).to.deep.equal(['B']);
    });
    it('should return 404 for non-existent file', async () => {
      const id = new mongoose.Types.ObjectId();
      const res = await chai.request(app)
        .patch(`/files/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'X' });
      expect(res).to.have.status(404);
    });
    it('should return 500 for invalid ObjectId', async () => {
      const res = await chai.request(app)
        .patch('/files/invalid-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'X' });
      expect(res).to.have.status(500);
    });
  });

  describe('DELETE /files/:id', () => {
    it('should delete an existing file', async () => {
      const file = await FileMeta.create({ title: 'DeleteMe', path: ['Del'] });
      const res = await chai.request(app)
        .delete(`/files/${file._id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      expect(res.text).to.include('File deleted');
      const found = await FileMeta.findById(file._id);
      expect(found).to.not.exist;
    });
    it('should return 404 for non-existent file', async () => {
      const id = new mongoose.Types.ObjectId();
      const res = await chai.request(app)
        .delete(`/files/${id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(404);
    });
    it('should return 500 for invalid ObjectId', async () => {
      const res = await chai.request(app)
        .delete('/files/invalid-id')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(500);
    });
  });

  describe('GET /search', () => {
    it('should return 400 if query is missing', async () => {
      const res = await chai.request(app)
        .get('/search')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(400);
    });
    it('should return results for a valid query', async () => {
      await FileMeta.create({ title: 'Searchable', description: 'Find me', path: ['Search'] });
      const res = await chai.request(app)
        .get('/search?query=Searchable')
        .set('Authorization', `Bearer ${token}`);
      expect(res).to.have.status(200);
      expect(res.body).to.be.an('array');
      expect(res.body[0].title).to.equal('Searchable');
    });
  });
});