const express = require("express");
const router = express.Router();
const db = require("../db");

// ✅ Fetch all farmer requests with status = 'Pending Lab Verification'
router.get("/pending", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, userid, farmer_name, harvest_date, crop_type, land_details, process_step, coordinates, seed_bill_path, weekly_photo_path, status FROM farmer_data WHERE status = 'Pending Lab Verification'"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ Fetch all herb records for a specific farmer (by email)
router.get("/status/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT id, userid, farmer_name, crop_type, harvest_date, land_details, coordinates, seed_bill_path, weekly_photo_path, status FROM farmer_data WHERE email = ? ORDER BY id DESC",
      [email]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching farmer herb status:", err);
    res.status(500).json({ error: err.message });
  }
});




// ✅ Detailed verification from lab reporter
router.post("/verify/:id", async (req, res) => {
  const { id } = req.params;
  const { farmer_userid, verification_status, lab_name, lab_id, address } = req.body;

  try {
    // ✅ 1. Construct a readable status
    let statusText = "";
    if (verification_status === "Approved") {
      statusText = `Approved by ${lab_name}`;
    } else if (verification_status === "Rejected") {
      statusText = `Rejected by ${lab_name}`;
    } else {
      statusText = verification_status; // fallback
    }

    // ✅ 2. Update status in farmer_data table
    await db.query(
      "UPDATE farmer_data SET status = ? WHERE id = ?",
      [statusText, id]
    );

    // ✅ 3. Store full verification details in verification_log table
    await db.query(
      `INSERT INTO verification_log 
       (farmer_userid, lab_name, lab_id, address, verification_status, verified_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [farmer_userid, lab_name, lab_id, address, verification_status]
    );

    res.json({ message: "Verification data recorded successfully" });
  } catch (err) {
    console.error("❌ Verification error:", err);
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;
