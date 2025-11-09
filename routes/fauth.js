
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./common_db');
const path = require("path");


const JWT_SECRET = "mysecuretokenkey"; // put in .env in real project

router.get('/auth',(req,res)=>{
   res.sendFile(path.join(__dirname,'..', 'frontend','farmer.html'));
})

// 📝 Signup
router.post("/auth/signup", async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const [existing] = await db.query("SELECT * FROM users WHERE email=?", [email]);
    if (existing.length) return res.status(400).json({ message: "Email already exists" });

    const hash = await bcrypt.hash(password, 10);
    await db.query("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)", [
      name,
      email,
      hash,
      role,
    ]);
    res.json({ message: `${role} registered successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔐 Login
router.post("/auth/login", async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email=? AND role=?", [email, role]);
    if (!rows.length) return res.status(404).json({ message: "User not found" });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.user_id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "2h" }
    );
    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports =router;

