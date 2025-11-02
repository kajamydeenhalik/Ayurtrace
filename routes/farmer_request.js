const express = require("express");
const router = express.Router();
const db = require("../db");

// 🧾 Get all farmer requests pending lab verification
router.get("/pending", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, userid, farmer_name, crop_type, land_details, process_step, coordinates, seed_bill_path, weekly_photo_path, status FROM farmer_data WHERE status='Pending Lab Verification'"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🧪 Verify farmer record
router.post("/verify/:farmerId", async (req, res) => {
  const { farmerId } = req.params;
  const {
    lab_userid,
    lab_id,
    lab_name,
    verification_status,
    remarks,
    lab_location,
    latitude,
    longitude
  } = req.body;

  try {
    // 1️⃣ Insert new record into lab_reports
    await db.query(
      `INSERT INTO lab_reports 
        (farmer_id, lab_userid, lab_id, lab_name, lab_location, latitude, longitude, verification_status, remarks) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        farmerId,
        lab_userid,
        lab_id,
        lab_name,
        lab_location,
        latitude,
        longitude,
        verification_status,
        remarks,
      ]
    );

    // 2️⃣ Update farmer status
    await db.query(
      "UPDATE farmer_data SET status=? WHERE id=?",
      [verification_status === "Approved" ? "Verified by Lab" : "Rejected by Lab", farmerId]
    );

    res.json({ message: "Lab verification recorded successfully" });
  } catch (err) {
    console.error("❌ Error saving lab verification:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
