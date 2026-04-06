/**
 * Migration: Add allowedGender field to existing seats
 * Sets allowedGender based on current wing assignment
 */

const mongoose = require("mongoose");
const Seat = require("./models/seatSchema");
require("dotenv").config();

async function addAllowedGenderField() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const seats = await Seat.find({});
    console.log(`📊 Found ${seats.length} seats to update`);

    let updated = 0;

    for (const seat of seats) {
      // Set default based on wing if not already set
      if (!seat.allowedGender) {
        seat.allowedGender = seat.wing === "Left" ? "Female" : "Male";
        await seat.save();
        updated++;
      }
    }

    console.log(`✅ Updated ${updated} seats with allowedGender field`);
    console.log(`ℹ️ ${seats.length - updated} seats already had allowedGender set`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

addAllowedGenderField();
