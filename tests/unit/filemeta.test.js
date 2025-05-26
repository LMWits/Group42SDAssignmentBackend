const chai = require('chai');
const expect = chai.expect;
const mongoose = require('mongoose');
const dbHandler = require('../helpers/db-handler');

// Load test environment variables
require('../helpers/test-env');

describe('FileMeta Model Unit Tests', () => {
  let FileMeta;

  before(async () => {
    await dbHandler.connect();
    
    // Use a different name for testing to avoid conflicts
    const FileMetaSchema = new mongoose.Schema({
      title: String,
      description: String,
      azureBlobName: String,
      blobUrl: String,
      originalName: String,
      uploadDate: { type: Date, default: Date.now },
      path: [String]
    });
    
    FileMeta = mongoose.models.FileMeta_test || 
      mongoose.model('FileMeta_test', FileMetaSchema);
  });
  
  afterEach(async () => await dbHandler.clearDatabase());
  after(async () => await dbHandler.closeDatabase());

  it('should create a new FileMeta with valid fields', async () => {
    const validFileMeta = {
      title: 'Valid Title',
      description: 'Valid Description',
      azureBlobName: 'valid-blob-name',
      blobUrl: 'https://example.com/valid-blob',
      originalName: 'original.txt',
      path: ['Folder1', 'Subfolder']
    };

    const newFileMeta = new FileMeta(validFileMeta);
    const savedFileMeta = await newFileMeta.save();
    
    // Check if document was saved successfully
    expect(savedFileMeta._id).to.exist;
    expect(savedFileMeta.title).to.equal(validFileMeta.title);
    expect(savedFileMeta.description).to.equal(validFileMeta.description);
    expect(savedFileMeta.azureBlobName).to.equal(validFileMeta.azureBlobName);
    expect(savedFileMeta.blobUrl).to.equal(validFileMeta.blobUrl);
    expect(savedFileMeta.originalName).to.equal(validFileMeta.originalName);
    expect(savedFileMeta.path).to.deep.equal(validFileMeta.path);
    expect(savedFileMeta.uploadDate).to.exist;
  });

  it('should allow missing optional fields', async () => {
    const partialFileMeta = {
      title: 'Partial Title',
      blobUrl: 'https://example.com/partial-blob'
    };

    const newFileMeta = new FileMeta(partialFileMeta);
    const savedFileMeta = await newFileMeta.save();
    
    expect(savedFileMeta._id).to.exist;
    expect(savedFileMeta.title).to.equal(partialFileMeta.title);
    expect(savedFileMeta.blobUrl).to.equal(partialFileMeta.blobUrl);
    expect(savedFileMeta.description).to.be.undefined;
    // In Mongoose, missing array fields are initialized as empty arrays rather than undefined
    expect(savedFileMeta.path).to.be.an('array').that.is.empty;
  });

  it('should handle empty path array', async () => {
    const fileMetaWithEmptyPath = {
      title: 'Empty Path Test',
      path: []
    };

    const newFileMeta = new FileMeta(fileMetaWithEmptyPath);
    const savedFileMeta = await newFileMeta.save();
    
    expect(savedFileMeta._id).to.exist;
    expect(savedFileMeta.path).to.be.an('array').that.is.empty;
  });

  it('should allow missing optional fields', async () => {
    const meta = new FileMeta({
      title: 'No Description',
      azureBlobName: 'no-desc',
      blobUrl: 'http://example.com/no-desc',
      originalName: 'no-desc.txt',
      path: []
    });
    await meta.save();
    const found = await FileMeta.findOne({ azureBlobName: 'no-desc' });
    expect(found).to.exist;
    expect(found.description).to.be.undefined;
  });

  it('should handle empty path array', async () => {
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
});