const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

// Load Environment Variables
dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected for Seeding"))
  .catch((err) => console.log(err));

const seedUsers = async () => {
  try {
    // 1. Wipe the current Users
    await User.deleteMany({});
    console.log("🧹 Old users cleared.");

    // NOTE: We are sending PLAIN TEXT passwords. 
    // The User.js model's "pre-save" hook will handle the encryption automatically.
    
    // Create Owner (Sir Waqar)
    const waqar = await User.create({
      userId: "OWNER-001",
      username: "waqar",
      fullName: "Sir Waqar Baig",
      password: "admin123", // <--- SENT AS PLAIN TEXT
      role: "OWNER",
      totalCash: 0,
      walletBalance: { floating: 0, verified: 0 },
      permissions: ["dashboard", "admissions", "students", "finance", "teachers", "configuration"]
    });

    console.log("🎉 Owner Created Successfully!");
    console.log("-----------------------------------------");
    console.log("👤 OWNER: waqar / admin123");
    console.log("-----------------------------------------");

    process.exit();
  } catch (error) {
    console.error("❌ Seeding Failed:", error);
    process.exit(1);
  }
};

seedUsers();