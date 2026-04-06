/**
 * Migration Script: Update existing seat labels from R01-00 format to sequential numbers
 * Run this once to update all existing seats in the database
 */

const mongoose = require("mongoose");
const Seat = require("./models/seatSchema");
require("dotenv").config();

async function migrateSeatLabels() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get all seats sorted by class, session, and seat number
    const seats = await Seat.find({})
      .sort({ sclass: 1, session: 1, seatNumber: 1 })
      .lean();

    console.log(`📊 Found ${seats.length} seats to update`);

    if (seats.length === 0) {
      console.log("ℹ️ No seats found. Run seat initialization first.");
      process.exit(0);
    }

    // Group seats by class and session
    const grouped = {};
    seats.forEach((seat) => {
      const key = `${seat.sclass}_${seat.session}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(seat);
    });

    let totalUpdated = 0;

    // Update each group
    for (const [key, groupSeats] of Object.entries(grouped)) {
      console.log(`\n🔄 Processing group: ${key} (${groupSeats.length} seats)`);

      // Sort by seat number to ensure correct sequence
      groupSeats.sort((a, b) => a.seatNumber - b.seatNumber);

      // Update each seat
      for (const seat of groupSeats) {
        const newLabel = String(seat.seatNumber);

        await Seat.updateOne(
          { _id: seat._id },
          { $set: { seatLabel: newLabel } }
        );

        totalUpdated++;
      }

      console.log(`✅ Updated ${groupSeats.length} seats in group ${key}`);
    }

    console.log(`\n🎉 Migration complete! Updated ${totalUpdated} seat labels.`);
    console.log(
      `   Seat labels now range from 1 to ${seats[seats.length - 1]?.seatNumber || "N/A"}`
    );

    // Update student records that reference old seat labels
    const Student = require("./models/Student");
    const students = await Student.find({
      seatNumber: { $regex: /^R\d+-\d+$/ }, // Match R01-00 format
    });

    console.log(`\n👥 Found ${students.length} students with old seat format`);

    for (const student of students) {
      try {
        // Find the seat by student ID (more reliable than class/session)
        const seat = await Seat.findOne({
          student: student._id,
          isTaken: true,
        });

        if (seat) {
          student.seatNumber = seat.seatLabel;
          await student.save();
          console.log(
            `   ✅ Updated student ${student.studentName}: ${student.seatNumber} → ${seat.seatLabel}`
          );
        } else {
          // Seat not found, clear the old format
          student.seatNumber = "";
          await student.save();
          console.log(
            `   ⚠️ Cleared seat for ${student.studentName} (no matching seat found)`
          );
        }
      } catch (err) {
        console.log(
          `   ⚠️ Skipped student ${student.studentName}: ${err.message}`
        );
      }
    }

    console.log("\n✨ All done!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrateSeatLabels();
