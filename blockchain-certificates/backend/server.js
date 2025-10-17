require('dotenv').config(); // Load environment variables
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const certificatesRouter = require('./routes/certificates');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API routes
app.use('/api/certificates', certificatesRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Backend server with Pinata is running on http://localhost:${PORT}`);
});