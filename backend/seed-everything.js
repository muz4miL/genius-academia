/**
 * COMPLETE SYSTEM SEED
 * Seeds EVERYTHING in the correct order for full testing:
 * - Admin user (OWNER)
 * - Session
 * - Classes (2)
 * - Teachers (3) with User accounts
 * - Students (8) with passwords, barcodeIds, and fee records
 * - Transactions (income + expenses)
 * - Seats (182 = 13 rows × 14 cols, gender-segregated)
 * - Demo seat assignments (5 students)
 *
 * Run: node seed-everything.js
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/genius-academia";

async function seedEverything() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Import all models
    const User = require("./models/User");
    const Session = require("./models/Session");
    const Class = require("./models/Class");
    const Teacher = require("./models/Teacher");
    const Student = require("./models/Student");
    const Transaction = require("./models/Transaction");
    const Expense = require("./models/Expense");
    const Seat = require("./models/seatSchema");

    // ─────────────────────────────────────────
    // STEP 1: CLEAR EVERYTHING
    // ─────────────────────────────────────────
    console.log("🗑️  CLEARING ALL DATA...");
    await Student.deleteMany({});
    await Teacher.deleteMany({});
    await Class.deleteMany({});
    await Session.deleteMany({});
    await Transaction.deleteMany({});
    await Expense.deleteMany({});
    await Seat.deleteMany({});
    await User.deleteMany({});
    console.log("✅ Database cleared\n");

    // ─────────────────────────────────────────
    // STEP 2: CREATE ADMIN USER
    // ─────────────────────────────────────────
    console.log("👤 CREATING ADMIN USER...");
    const admin = await User.create({
      userId: "ADM0001",
      username: "admin",
      password: "admin123",
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
    console.log("✅ Admin: admin / admin123\n");

    // ─────────────────────────────────────────
    // STEP 3: CREATE SESSION
    // ─────────────────────────────────────────
    console.log("📅 CREATING SESSION...");
    const session = await Session.create({
      sessionName: "Academic Year 2025-2026",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-06-30"),
      status: "active",
      fee: 25000,
    });
    console.log(`✅ Session: ${session.sessionName}\n`);

    // ─────────────────────────────────────────
    // STEP 4: CREATE CLASSES
    // ─────────────────────────────────────────
    console.log("🎓 CREATING CLASSES...");
    const class1 = await Class.create({
      classTitle: "10th Grade Medical",
      className: "10th Grade Medical",
      gradeLevel: "10th Grade",
      group: "Pre-Medical",
      baseFee: 25000,
      session: session._id,
      subjects: [
        { name: "Biology", fee: 5000 },
        { name: "Chemistry", fee: 5000 },
        { name: "Physics", fee: 4000 },
        { name: "Mathematics", fee: 4000 },
      ],
      schedule: "Morning • Mon-Fri",
      startTime: "08:00",
      endTime: "12:00",
      status: "active",
    });

    const class2 = await Class.create({
      classTitle: "12th Grade Engineering",
      className: "12th Grade Engineering",
      gradeLevel: "12th Grade",
      group: "Pre-Engineering",
      baseFee: 30000,
      session: session._id,
      subjects: [
        { name: "Physics", fee: 6000 },
        { name: "Chemistry", fee: 6000 },
        { name: "Mathematics", fee: 6000 },
      ],
      schedule: "Evening • Mon-Fri",
      startTime: "14:00",
      endTime: "18:00",
      status: "active",
    });
    console.log("✅ 2 Classes created\n");

    // ─────────────────────────────────────────
    // STEP 5: CREATE TEACHERS
    // ─────────────────────────────────────────
    console.log("👨‍🏫 CREATING TEACHERS...");
    const hashedTeacherPass = await bcrypt.hash("teacher123", 10);

    const teachers = [];
    const teacherData = [
      {
        name: "Dr. Ahmed Khan",
        email: "ahmed@gia.edu",
        subject: "Biology",
        qual: "PhD Biology",
        phone: "03001234567",
        cnic: "12345-6789012-3",
      },
      {
        name: "Prof. Fatima Ali",
        email: "fatima@gia.edu",
        subject: "Chemistry",
        qual: "MSc Chemistry",
        phone: "03009876543",
        cnic: "12345-6789012-4",
      },
      {
        name: "Engr. Hassan Raza",
        email: "hassan@gia.edu",
        subject: "Physics",
        qual: "BE Electrical",
        phone: "03001112222",
        cnic: "12345-6789012-5",
      },
    ];

    for (let i = 0; i < teacherData.length; i++) {
      const td = teacherData[i];
      const username =
        td.name
          .replace(/[^a-zA-Z]/g, "")
          .toLowerCase()
          .slice(0, 12) +
        (1000 + i);

      const teacher = await Teacher.create({
        name: td.name,
        email: td.email,
        password: hashedTeacherPass,
        subject: td.subject,
        qualification: td.qual,
        phone: td.phone,
        cnic: td.cnic,
        status: "active",
        username: username,
        plainPassword: "teacher123",
        compensation: {
          type: "percentage",
          teacherShare: 70,
          academyShare: 30,
        },
        balance: { floating: 0, verified: 0, pending: 0 },
        totalPaid: 0,
      });
      teachers.push(teacher);

      await User.create({
        userId: `TCH000${i + 1}`,
        username: username,
        password: "teacher123",
        fullName: td.name,
        role: "TEACHER",
        permissions: ["dashboard", "lectures"],
        phone: td.phone,
        isActive: true,
        teacherId: teacher._id,
      });

      console.log(`   ✅ ${td.name} → ${username} / teacher123`);
    }
    console.log("");

    // ─────────────────────────────────────────
    // STEP 6: CREATE STUDENTS WITH PASSWORDS
    // ─────────────────────────────────────────
    console.log("👨‍🎓 CREATING STUDENTS...");

    const studentsData = [
      {
        name: "Saifullah Khan",
        father: "Muhammad Khan",
        gender: "Male",
        parentCell: "03001111111",
        studentCell: "03111111111",
        address: "Model Town, Lahore",
        totalFee: 25000,
        paid: 25000,
        classRef: class1,
        referral: "Facebook Ad",
      },
      {
        name: "Ayesha Malik",
        father: "Malik Riaz",
        gender: "Female",
        parentCell: "03002222222",
        studentCell: "03122222222",
        address: "DHA Phase 5, Lahore",
        totalFee: 25000,
        paid: 20000,
        classRef: class1,
        referral: "Friend Referral",
      },
      {
        name: "Ali Hassan",
        father: "Hassan Ahmed",
        gender: "Male",
        parentCell: "03003333333",
        studentCell: "03133333333",
        address: "Johar Town, Lahore",
        totalFee: 25000,
        paid: 25000,
        classRef: class1,
        referral: "Google Search",
      },
      {
        name: "Zainab Fatima",
        father: "Muhammad Fatima",
        gender: "Female",
        parentCell: "03004444444",
        studentCell: "03144444444",
        address: "Gulberg, Lahore",
        totalFee: 25000,
        paid: 15000,
        classRef: class1,
        referral: "Walk-in",
      },
      {
        name: "Hamza Tariq",
        father: "Tariq Mahmood",
        gender: "Male",
        parentCell: "03005555555",
        studentCell: "03155555555",
        address: "Faisal Town, Lahore",
        totalFee: 25000,
        paid: 25000,
        classRef: class1,
        referral: "Friend Referral",
      },
      {
        name: "Bilal Ahmed",
        father: "Ahmed Raza",
        gender: "Male",
        parentCell: "03006666666",
        studentCell: "03166666666",
        address: "Bahria Town, Lahore",
        totalFee: 30000,
        paid: 30000,
        classRef: class2,
        referral: "Instagram",
      },
      {
        name: "Usman Khalid",
        father: "Khalid Mehmood",
        gender: "Male",
        parentCell: "03007777777",
        studentCell: "03177777777",
        address: "Garden Town, Lahore",
        totalFee: 30000,
        paid: 25000,
        classRef: class2,
        referral: "Friend Referral",
      },
      {
        name: "Fahad Iqbal",
        father: "Iqbal Hussain",
        gender: "Male",
        parentCell: "03008888888",
        studentCell: "03188888888",
        address: "Cavalry Ground, Lahore",
        totalFee: 30000,
        paid: 30000,
        classRef: class2,
        referral: "Google Search",
      },
    ];

    const students = [];

    for (let i = 0; i < studentsData.length; i++) {
      const sd = studentsData[i];
      const cls = sd.classRef;

      // Generate password: first 4 chars of name + last 4 digits of phone
      const phoneDigits = sd.parentCell.replace(/\D/g, "").slice(-4);
      const namePart = sd.name.replace(/\s/g, "").toLowerCase().slice(0, 4);
      const defaultPassword = `${namePart}${phoneDigits}`;

      // Generate barcodeId (numeric)
      const barcodeId = String(260001 + i);

      const student = await Student.create({
        studentName: sd.name,
        fatherName: sd.father,
        gender: sd.gender,
        class: cls.classTitle,
        group: cls.group,
        parentCell: sd.parentCell,
        studentCell: sd.studentCell,
        address: sd.address,
        totalFee: sd.totalFee,
        paidAmount: sd.paid,
        classRef: cls._id,
        sessionRef: session._id,
        referralSource: sd.referral,
        studentStatus: "Active",
        password: defaultPassword,
        plainPassword: defaultPassword,
        barcodeId: barcodeId,
      });

      students.push(student);
      console.log(
        `   ✅ ${sd.name} → ID: ${student.studentId} | Barcode: ${barcodeId} | Password: ${defaultPassword}`,
      );
    }
    console.log("");

    // ─────────────────────────────────────────
    // STEP 7: CREATE TRANSACTIONS
    // ─────────────────────────────────────────
    console.log("💰 CREATING TRANSACTIONS...");
    let totalRevenue = 0;
    for (const student of students) {
      if (student.paidAmount > 0) {
        await Transaction.create({
          type: "INCOME",
          category: "Tuition",
          amount: student.paidAmount,
          description: `Admission fee from ${student.studentName} - ${student.class}`,
          date: new Date(),
          status: "FLOATING",
          studentId: student._id,
          classId: student.classRef,
        });
        totalRevenue += student.paidAmount;
      }
    }
    console.log(
      `   ✅ ${students.length} INCOME transactions (PKR ${totalRevenue.toLocaleString()})`,
    );

    // Expenses
    const expense1 = await Expense.create({
      title: "Electricity Bill",
      category: "Electricity Bill",
      amount: 8500,
      vendorName: "LESCO",
      dueDate: new Date("2026-02-28"),
      expenseDate: new Date("2026-02-10"),
      status: "paid",
      description: "Monthly electricity",
    });
    const expense2 = await Expense.create({
      title: "Staff Tea",
      category: "Staff Tea & Refreshments",
      amount: 6000,
      vendorName: "Local Cafe",
      dueDate: new Date("2026-02-15"),
      expenseDate: new Date("2026-02-05"),
      status: "paid",
      description: "Monthly refreshments",
    });

    for (const exp of [expense1, expense2]) {
      await Transaction.create({
        type: "EXPENSE",
        category: exp.category,
        amount: exp.amount,
        description: `Expense: ${exp.title}`,
        date: exp.expenseDate,
        status: "VERIFIED",
      });
    }
    console.log(`   ✅ 2 EXPENSE transactions (PKR 14,500)\n`);

    // ─────────────────────────────────────────
    // STEP 8: CREATE 182 SEATS
    // ─────────────────────────────────────────
    console.log("🪑 CREATING 182 SEATS (13 × 14)...");
    const ROWS = 13,
      COLS = 14,
      COLS_PER_WING = 7;
    const seatData = [];
    let seatNumber = 1;

    for (let row = 1; row <= ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const wing = col < COLS_PER_WING ? "Left" : "Right";
        const seatLabel = `R${String(row).padStart(2, "0")}-${String(col + 1).padStart(2, "0")}`;

        seatData.push({
          sclass: class1._id,
          session: session._id,
          school: admin._id,
          seatNumber,
          seatLabel,
          wing,
          side: wing,
          position: { row, column: col },
          isTaken: false,
          isReserved: false,
          student: null,
          bookedAt: null,
          lastModifiedBy: admin._id,
          history: [],
        });
        seatNumber++;
      }
    }

    await Seat.insertMany(seatData);
    console.log("   ✅ 182 seats created (Left=Girls, Right=Boys)\n");

    // ─────────────────────────────────────────
    // STEP 9: ASSIGN DEMO SEATS
    // ─────────────────────────────────────────
    console.log("🎬 ASSIGNING DEMO SEATS TO STUDENTS...");

    // Only assign seats to class1 students (first 5)
    for (let i = 0; i < Math.min(5, students.length); i++) {
      const student = students[i];
      const wing = student.gender === "Female" ? "Left" : "Right";

      const seat = await Seat.findOne({
        sclass: class1._id,
        session: session._id,
        wing,
        isTaken: false,
      });

      if (seat) {
        seat.student = student._id;
        seat.isTaken = true;
        seat.bookedAt = new Date();
        seat.history = [
          {
            action: "booked",
            performedBy: student._id,
            performedByModel: "Student",
            timestamp: new Date(),
          },
        ];
        await seat.save();

        student.seatNumber = seat.seatNumber;
        student.seatLabel = seat.seatLabel;
        await student.save();

        console.log(
          `   ✅ ${student.studentName} (${student.gender}) → ${seat.seatLabel} (${wing})`,
        );
      }
    }

    // ─────────────────────────────────────────
    // FINAL SUMMARY
    // ─────────────────────────────────────────
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ COMPLETE SYSTEM SEED SUCCESSFUL!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("🔐 LOGIN CREDENTIALS:");
    console.log("┌─────────────────────────────────────────────────────┐");
    console.log("│ ADMIN PANEL (localhost:8080/login)                  │");
    console.log("│   Username: admin                                  │");
    console.log("│   Password: admin123                               │");
    console.log("├─────────────────────────────────────────────────────┤");
    console.log("│ STUDENT PORTAL (localhost:8080/student-portal)      │");
    console.log("│                                                     │");

    for (const s of students) {
      const id = s.studentId || s.barcodeId;
      const pwd = s.plainPassword;
      const line = `│   ${s.studentName.padEnd(20)} ID: ${String(id).padEnd(8)} Pass: ${pwd.padEnd(12)}│`;
      console.log(line);
    }

    console.log("├─────────────────────────────────────────────────────┤");
    console.log("│ TEACHERS (localhost:8080/login)                     │");

    for (const t of teachers) {
      const line = `│   ${t.name.padEnd(20)} → ${t.username.padEnd(18)} / teacher123│`;
      console.log(line);
    }

    console.log("└─────────────────────────────────────────────────────┘");
    console.log("\n📊 DATA SUMMARY:");
    console.log(`   Students: ${students.length}`);
    console.log(`   Teachers: ${teachers.length}`);
    console.log(`   Classes: 2`);
    console.log(`   Seats: 182 (Left: 91 Girls, Right: 91 Boys)`);
    console.log(`   Booked Seats: 5 (demo)`);
    console.log(`   Revenue: PKR ${totalRevenue.toLocaleString()}`);
    console.log(`   Expenses: PKR 14,500`);
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

seedEverything();
