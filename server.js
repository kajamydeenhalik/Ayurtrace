const express = require('express');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

const db = require('./db'); // Import MySQL connection file

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Routes
app.use('/api', require('./routes/supplychain'));
app.use(express.static('frontend'));

// ✅ Test Database Connection at startup
(async () => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    console.log('✅ Database connected successfully! Test result:', rows[0].result);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
})();

// Start the Server
app.listen(4000, () => console.log('✅ Server running on http://localhost:4000'));
