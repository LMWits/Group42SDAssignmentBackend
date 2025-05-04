require('dotenv').config();           // Load env vars first
const app = require('./server');      // Start the server and DB
require('./UploadR');                 // Handle file uploads

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});

//Trigger workflow