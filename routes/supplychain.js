const express = require('express');
const router = express.Router();
const Blockchain = require('../blockchain/blockchain');
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const blockchain = new Blockchain();
const db = require('./common_db');


// MySQL connection



// 1️⃣ Farmer → Lab (correct farmer route)
// ------------------ FILE UPLOAD CONFIG ------------------
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});


const upload = multer({ storage });


// ------------------ FARMER SUBMISSION ------------------
router.post("/farmer-dashboard", upload.fields([
  { name: "seedBill", maxCount: 1 },
  { name: "weeklyPhoto", maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      landDetails,
      cropType,
      processStep,
      coordinates,
      userid
    } = req.body;
// userid, id, farmer_name, harvest_date, crop_type, land_details, process_step, coordinates, seed_bill_path, weekly_photo_path, status, created_at
    const seedBillPath = req.files["seedBill"] ? req.files["seedBill"][0].filename : null;
    const weeklyPhotoPath = req.files["weeklyPhoto"] ? req.files["weeklyPhoto"][0].filename : null;

    // Insert farmer data into database
    const [result] = await db.query(
      `INSERT INTO farmer_data (userid,farmer_name,harvest_date, crop_type, land_details,  process_step,coordinates, seed_bill_path, weekly_photo_path,status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
      [
         userid,   
        "Farmer Default",          // placeholder if not in form         
        new Date(), 
        cropType,               
        landDetails,
        processStep,
        coordinates,
        seedBillPath,
        weeklyPhotoPath,
        "Pending Lab Verification",
      ]
    );
    // ✅ Auto-generate herb_id from database
     const herbId = result.insertId;

    // Prepare blockchain transaction
    const transaction = {
      stage: "Farmer",
      userid,
      landDetails,
      processStep,
      coordinates,
      seedBillPath,
      weeklyPhotoPath,
      submittedAt: new Date().toISOString()
    };

    const newBlock = blockchain.addBlock(transaction);

    // Store in blockchain DB table
   await db.query(
  `INSERT INTO blocks (herb_id, stakeholder_role, stakeholder_id, previous_hash, transaction_data, hash, verification_status)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [herbId, "Farmer", userid, newBlock.previousHash, JSON.stringify(transaction), newBlock.hash, "Pending"]
);

    res.json({
      message: "Farmer data recorded successfully",
      block: newBlock
    });

  } catch (error) {
    console.error("❌ Error submitting farmer data:",error);
    res.status(500).json({ error: error.message });
  }
});


// 2️⃣ Lab Reporter → Manufacturer
router.post('/lab', async (req, res) => {
  const { lab_name, product_id, test_result, grade } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO lab_data (lab_name, product_id, test_result, grade) VALUES (?, ?, ?, ?)',
      [lab_name, product_id, test_result, grade]
    );

    const transaction = { stage: 'Lab', lab_name, product_id, test_result, grade };
    const newBlock = blockchain.addBlock(transaction);

    await db.query(
      'INSERT INTO blocks (previous_hash, transaction_data, hash) VALUES (?, ?, ?)',
      [newBlock.previousHash, JSON.stringify(transaction), newBlock.hash]
    );

    res.json({ message: 'Lab data recorded', block: newBlock });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3️⃣ Manufacturer (Final stage)
router.post('/manufacturer', async (req, res) => {
  const { manufacturer_name, product_id, batch_id, process_details } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO manufacturer_data (manufacturer_name, product_id, batch_id, process_details) VALUES (?, ?, ?, ?)',
      [manufacturer_name, product_id, batch_id, process_details]
    );

    const transaction = { stage: 'Manufacturer', manufacturer_name, product_id, batch_id, process_details };
    const newBlock = blockchain.addBlock(transaction);

    await db.query(
      'INSERT INTO blocks (previous_hash, transaction_data, hash) VALUES (?, ?, ?)',
      [newBlock.previousHash, JSON.stringify(transaction), newBlock.hash]
    );

    res.json({ message: 'Manufacturer data recorded', block: newBlock });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// View Blockchain
router.get('/chain', (req, res) => {
  res.json(blockchain.chain);
});

module.exports = router;
