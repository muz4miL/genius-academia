const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/genius-academia";

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: "admin" });
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists! Deleting it...");
      await User.deleteOne({ username: "admin" });
    }

    // Create admin user with all permissions
    const adminUser = await User.create({
      userId: "ADM0001",
      username: "admin",
      password: "admin123", // Will be hashed by pre-save hook
      fullName: "System Admin",
      role: "OWNER",
      permissions: [
        "dashboard",
        "admissions",
        "students",
        "teachers",
        "finance",
        "classes",
        "timetable",
        "sessions",
        "configuration",
        "users",
        "website",
        "payroll",
        "settlement",
        "gatekeeper",
        "frontdesk",
        "inquiries",
        "reports",
        "lectures",
      ],
      isActive: true,
    });

    console.log("✅ Admin user created successfully!");
    console.log("\n🔐 Login Credentials:");
    console.log("   Username: admin");
    console.log("   Password: admin123");
    console.log("   Role: OWNER");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

createAdmin();
