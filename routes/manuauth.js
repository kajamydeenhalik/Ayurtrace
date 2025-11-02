const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// ✅ Manufacturer Signup
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  const role = "manufacturer";

  try {
    const [exists] = await db.query("SELECT * FROM users WHERE email=?", [email]);
    if (exists.length) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    await db.query("INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)", [email, hashed, role]);

    res.status(201).json({ message: "Manufacturer registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Manufacturer Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email=? AND role='manufacturer'", [email]);
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

module.exports = router;
