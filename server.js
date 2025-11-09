const express = require('express');

const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();
const router = express.Router();

const db = require('./db'); // Import MySQL connection file
const path = require('path');


// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'front.html'));
});

app.get('/about',(req,res,next)=>{
       res.sendFile(path.join(__dirname, 'frontend','about.html'));
});

app.get('/contactus',(req,res,next)=>{
       res.sendFile(path.join(__dirname, 'frontend','contact.html'));
});

app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname,  'frontend','index.html'));
});
app.use('/api', require('./routes/supplychain'));
// app.use("/auth", require('./routes/fauth'));
const fauth = require('./routes/fauth');
app.use(fauth);

// app.use("/authlab", require('./routes/labauth'));
const authlab = require('./routes/labauth');
app.use(authlab);

const authmanu = require('./routes/manuauth');
app.use(authmanu);
// app.use("/authmanu", require('./routes/manuauth'));

const farmer_request = require('./routes/farmer_request');
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static('frontend'));
app.use(express.json());

app.use('/farmer',farmer_request);
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
