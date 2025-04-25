const sinon = require('sinon');

// BlockBlobClient mock with proper uploadData function
const blockBlobClientMock = {
  uploadData: sinon.stub().callsFake(function(buffer) {
    // Return a promise that resolves with a mock response
    return Promise.resolve({
      etag: 'mock-etag',
      lastModified: new Date(),
      contentMD5: 'mock-md5',
      requestId: 'mock-request-id',
      version: '1.0'
    });
  }),
  url: 'https://example.com/mock-blob-url'
};

// ContainerClient mock
const containerClientMock = {
  getBlockBlobClient: sinon.stub().callsFake(function(blobName) {
    console.log(`Mock: Getting block blob client for ${blobName}`);
    // Return our mock block blob client
    return blockBlobClientMock;
  })
};

// BlobServiceClient mock
const blobServiceClientMock = {
  getContainerClient: sinon.stub().callsFake(function(containerName) {
    console.log(`Mock: Getting container client for ${containerName}`);
    // Return our mock container client
    return containerClientMock;
  })
};

module.exports = {
  blockBlobClientMock,
  containerClientMock,
  blobServiceClientMock
};