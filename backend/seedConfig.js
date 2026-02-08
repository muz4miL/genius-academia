const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Configuration = require("./models/Configuration");

dotenv.config();

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log(err));

const seedConfig = async () => {
  try {
    await Configuration.deleteMany({}); // Clear old settings
    
    // Create Default Configuration for Genius Academia
    await Configuration.create({
      academyName: "Genius Academia",
      academyAddress: "Peshawar, Pakistan",
      academyPhone: "+92 300 1234567",
      
      // Teacher Compensation
      salaryConfig: {
        teacherShare: 70,
        academyShare: 30,
      },
      
      // Financial Policies
      defaultLateFee: 500,
      feeDueDay: 10,
      
      // Default Subject Fees (will be auto-initialized by model)
      defaultSubjectFees: [],
      
      // Session Prices (to be filled as needed)
      sessionPrices: [],
    });

    console.log("🎉 Genius Academia Configuration Created!");
    process.exit();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

seedConfig();