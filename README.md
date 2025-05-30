# Constitutional Archive Backend

This repository contains the backend source code for the arcHive. It supports secure folder and file uploads, metadata storage, and serves the admin panel and public search interface through a Node.js and Express-based API.

---

## Features

- File and folder creation with metadata  
-  Azure Blob Storage integration  
- MongoDB-based metadata storage  
- API endpoints for admin uploads and public access  
- Input validation and error handling  
- RESTful structure with organized routes  
-  CI/CD pipeline via GitHub Actions  
- Deployment on Microsoft Azure  

---

## Tech Stack

- **Backend Framework:** Node.js, Express.js  
- **Database:** MongoDB (MongoDB Atlas)  
- **Cloud Storage:** Azure Blob Storage  
- **CI/CD:** GitHub Actions  
- **Deployment:** Microsoft Azure  

---

## Getting Started

### Prerequisites

- Node.js and npm  
- GitHub CLI (optional)  

### Installation

```bash
git clone https://github.com/LMWits/Group42SDAssignmentBackend.git
cd Group42SDAssignmentBackend
npm install
```

### Configuration

Change all to the urls/links in each file from the original to the localhost links which have been commented out (if there is such in the file). Thereafter you can comment out the links which were previously in the fetch statements. 

Create a `.env` file in the root with the following content:

Note that these keys are private and the values of the configuration strings are contained in the email we have sent you (given that we have given permission/emailed you). If you do not have the value of the keys then following is just a reference to what the env initialisation looks like: 

```env
AZURE_STORAGE_CONNECTION_STRING
MONGODB_URI
PORT=3000
```

---

## Running the App

```bash
node index.js
```

The backend will start on `http://localhost:3000`.

---

## Deployment

This project is deployed via **Microsoft Azure** with automated CI/CD configured using **GitHub Actions**.

---

## Testing & Coverage

Unit tests and code coverage are integrated via `jest` and `supertest`.

```bash
npm test
```

Code coverage is uploaded to [Codecov](https://about.codecov.io/).

---

## Usage

Admins can:

- Create folders with title/description  
- Upload files along with metadata
- View folder structures  
-Edit and delete files
- Search documents  
- Access public folders/files

Users can:

- Search documents  
- Access public folders/files (read-only)

  
# Group42SDAssignmentBackend

[![codecov](https://codecov.io/github/LMWits/Group42SDAssignmentBackend/branch/main/graph/badge.svg)](https://codecov.io/github/LMWits/Group42SDAssignmentBackend)

This repository contains the backend for the Group42 SDA assignment.
