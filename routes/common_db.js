const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Kaja@123',
  database: 'blockchain_project'
});

module.exports = db;