/**
 * MEGA SEED — Production-Ready Test Data
 *
 * Builds ON TOP of seed-everything.js data.
 * Adds realistic financial flows:
 *   - Fee collections with proper 70/30 teacher/academy splits
 *   - FeeRecord entries with receipt numbers
 *   - Teacher balance updates (floating/verified/pending)
 *   - Teacher payout vouchers
 *   - Daily closing records
 *   - Expenses with transactions
 *   - Notifications
 *   - Timetable entries
 *   - Configuration singleton
 *
 * Run: node seed-mega.js
 */

const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/geniusDB";

async function seedMega() {
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
    const FeeRecord = require("./models/FeeRecord");
    const TeacherPayment = require("./models/TeacherPayment");
    const Expense = require("./models/Expense");
    const DailyClosing = require("./models/DailyClosing");
    const Notification = require("./models/Notification");
    const Configuration = require("./models/Configuration");
    const Timetable = require("./models/Timetable");

    // ─── Fetch existing data ───
    const admin = await User.findOne({ role: "OWNER" });
    if (!admin) {
      console.error("❌ No OWNER user found. Run seed-everything.js first!");
      process.exit(1);
    }

    const session = await Session.findOne({ status: "active" });
    const classes = await Class.find({ status: "active" });
    const teachers = await Teacher.find({ status: "active" });
    const students = await Student.find({ status: "active" });

    console.log(
      `📊 Found: ${students.length} students, ${teachers.length} teachers, ${classes.length} classes\n`,
    );

    // ─── Clean only financial data (keep students/teachers/classes/users) ───
    console.log("🗑️  Clearing financial data...");
    await Transaction.deleteMany({});
    await FeeRecord.deleteMany({});
    await TeacherPayment.deleteMany({});
    await DailyClosing.deleteMany({});
    await Notification.deleteMany({});
    await Expense.deleteMany({});
    if (Timetable) await Timetable.deleteMany({});
    console.log("✅ Financial data cleared\n");

    // Reset teacher balances
    for (const teacher of teachers) {
      teacher.balance = { floating: 0, verified: 0, pending: 0 };
      teacher.totalPaid = 0;
      await teacher.save();
    }

    // Reset student financials to admission-only state
    for (const student of students) {
      student.paidAmount = 0;
      await student.save();
    }

    // ─── Build teacher lookup by subject ───
    const teacherBySubject = {};
    for (const t of teachers) {
      teacherBySubject[t.subject.toLowerCase()] = t;
    }

    // ─── STEP 1: Configuration singleton ───
    console.log("⚙️  SETTING UP CONFIGURATION...");
    await Configuration.deleteMany({});
    await Configuration.create({
      academyName: "Genius Islamian's Academy",
      systemAdminName: "Engr. Waqar Ahmad",
      academyAddress:
        "Opp. Islamia College, Danishabad, University Road, Peshawar",
      academyPhone: "091-5601600",
      salaryConfig: { teacherShare: 70, academyShare: 30 },
      defaultSubjectFees: [
        { name: "Biology", fee: 5000 },
        { name: "Chemistry", fee: 5000 },
        { name: "Physics", fee: 5000 },
        { name: "Mathematics", fee: 4000 },
        { name: "English", fee: 3000 },
      ],
      sessionPrices: [
        {
          sessionId: session._id,
          sessionName: session.sessionName,
          price: 25000,
        },
      ],
    });
    console.log("✅ Configuration set (systemAdminName: Engr. Waqar Ahmad)\n");

    // ─── STEP 2: Timetable entries ───
    console.log("📅 CREATING TIMETABLE...");
    const timetableEntries = [];
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const timeSlots = [
      { start: "08:00", end: "09:30" },
      { start: "09:45", end: "11:15" },
      { start: "11:30", end: "13:00" },
      { start: "14:00", end: "15:30" },
      { start: "15:45", end: "17:15" },
    ];

    for (const cls of classes) {
      const classSubjects = cls.subjects || [];
      for (let i = 0; i < classSubjects.length; i++) {
        const subj = classSubjects[i];
        const teacher = teacherBySubject[subj.name.toLowerCase()];
        if (!teacher) continue; // Skip subjects without assigned teachers
        // Assign 2 days per subject
        const assignedDays = [days[i % 5], days[(i + 2) % 5]];
        const slot = timeSlots[i % timeSlots.length];

        for (const day of assignedDays) {
          timetableEntries.push({
            classId: cls._id,
            className: cls.classTitle,
            subject: subj.name,
            teacherId: teacher?._id || null,
            teacherName: teacher?.name || "TBA",
            day,
            startTime: slot.start,
            endTime: slot.end,
            status: "active",
          });
        }
      }
    }

    if (Timetable) {
      // Create one by one to trigger pre-save hooks (entryId auto-generation)
      for (const entry of timetableEntries) {
        await Timetable.create(entry);
      }
      console.log(`✅ ${timetableEntries.length} timetable entries created\n`);
    }

    // ─── STEP 3: Fee Collections over 3 months ───
    console.log("💰 SIMULATING FEE COLLECTIONS (3 months)...");
    const months = ["January 2026", "February 2026", "March 2026"];
    let totalCollected = 0;
    let feeRecordCount = 0;
    let transactionCount = 0;

    for (const month of months) {
      const monthDate = new Date(`2026-${months.indexOf(month) + 1}-15`);

      for (const student of students) {
        // Get the class for this student
        const cls = classes.find(
          (c) => c._id.toString() === student.classRef?.toString(),
        );
        if (!cls) continue;

        const studentSubjects = student.subjects || [];
        if (studentSubjects.length === 0) continue;

        // Calculate monthly payment: total fee / 3 (spread over 3 months approx)
        // Some students pay full, some partial, some skip a month
        const paymentChance = Math.random();
        if (month === "March 2026" && paymentChance < 0.15) continue; // 15% haven't paid March yet
        if (month === "February 2026" && paymentChance < 0.05) continue; // 5% missed Feb

        // Calculate per-subject fee payment
        for (const subj of studentSubjects) {
          const subjName = typeof subj === "string" ? subj : subj.name;
          const subjFee = typeof subj === "object" ? subj.fee || 5000 : 5000;
          const teacher = teacherBySubject[subjName.toLowerCase()];

          // 70/30 split
          const teacherShare = Math.round(subjFee * 0.7);
          const academyShare = subjFee - teacherShare;

          // Create FeeRecord
          await FeeRecord.create({
            student: student._id,
            studentName: student.studentName,
            class: cls._id,
            className: cls.classTitle,
            subject: subjName,
            amount: subjFee,
            month: month,
            status: "PAID",
            collectedBy: admin._id,
            collectedByName: admin.fullName,
            teacher: teacher?._id || null,
            teacherName: teacher?.name || "N/A",
            paymentMethod: "CASH",
            splitBreakdown: {
              teacherShare,
              academyShare,
              teacherPercentage: 70,
              academyPercentage: 30,
            },
            revenueSource: "standard-split",
          });
          feeRecordCount++;

          // Create INCOME transaction (full amount)
          await Transaction.create({
            type: "INCOME",
            category: "Tuition",
            amount: subjFee,
            description: `Fee: ${student.studentName} — ${subjName} (${month})`,
            date: monthDate,
            status: month === "March 2026" ? "FLOATING" : "VERIFIED",
            studentId: student._id,
            classId: cls._id,
            collectedBy: admin._id,
            splitDetails: {
              teacherShare,
              academyShare,
              teacherPercentage: 70,
              academyPercentage: 30,
              teacherId: teacher?._id || null,
              teacherName: teacher?.name || "N/A",
            },
          });
          transactionCount++;

          // Create LIABILITY transaction (teacher's share)
          if (teacher) {
            await Transaction.create({
              type: "LIABILITY",
              category: "Teacher Share",
              amount: teacherShare,
              description: `Teacher share: ${teacher.name} — ${subjName} from ${student.studentName}`,
              date: monthDate,
              status: month === "March 2026" ? "FLOATING" : "VERIFIED",
              splitDetails: {
                teacherId: teacher._id,
                teacherName: teacher.name,
                teacherShare,
                academyShare,
                teacherPercentage: 70,
                academyPercentage: 30,
              },
            });
            transactionCount++;

            // Update teacher balance
            if (month === "March 2026") {
              teacher.balance.floating += teacherShare;
            } else {
              teacher.balance.pending += teacherShare;
            }
          }

          // Update student paid amount
          student.paidAmount += subjFee;
          totalCollected += subjFee;
        }
      }

      console.log(`   ✅ ${month} — fees collected`);
    }

    // Save all updated students and teachers
    for (const student of students) {
      await student.save();
    }
    for (const teacher of teachers) {
      await teacher.save();
    }

    console.log(`\n📊 Fee Summary:`);
    console.log(`   Total Collected: PKR ${totalCollected.toLocaleString()}`);
    console.log(`   FeeRecords: ${feeRecordCount}`);
    console.log(`   Transactions: ${transactionCount}\n`);

    // ─── STEP 4: Teacher Payouts (Jan + Feb) ───
    console.log("💸 PROCESSING TEACHER PAYOUTS...");
    let payoutCount = 0;

    for (const teacher of teachers) {
      // Pay out January earnings (partial payout)
      const janEarnings = teacher.balance.pending;
      if (janEarnings <= 0) continue;

      // Pay 25% of pending as a moderate payout
      const payoutAmount = Math.round(janEarnings * 0.25);
      if (payoutAmount <= 0) continue;

      const voucherId = `TP-202603-${String(payoutCount + 1).padStart(4, "0")}`;

      await TeacherPayment.create({
        voucherId,
        teacherId: teacher._id,
        teacherName: teacher.name,
        subject: teacher.subject,
        amountPaid: payoutAmount,
        compensationType: teacher.compensation?.type || "percentage",
        month: "March",
        year: 2026,
        sessionId: session._id,
        sessionName: session.sessionName,
        paymentDate: new Date("2026-03-08"),
        paymentMethod: "cash",
        status: "paid",
        notes: "Monthly salary payout",
        authorizedBy: admin.fullName,
      });

      // Create EXPENSE transaction for payout
      await Transaction.create({
        type: "EXPENSE",
        category: "Teacher Payout",
        amount: payoutAmount,
        description: `Payout to ${teacher.name} (${teacher.subject})`,
        date: new Date("2026-03-08"),
        status: "VERIFIED",
        splitDetails: {
          teacherId: teacher._id,
          teacherName: teacher.name,
        },
      });
      transactionCount++;

      // Update teacher balance
      teacher.balance.pending -= payoutAmount;
      teacher.totalPaid += payoutAmount;
      await teacher.save();

      console.log(
        `   ✅ ${teacher.name}: PKR ${payoutAmount.toLocaleString()} paid (Voucher: ${voucherId})`,
      );
      payoutCount++;
    }
    console.log("");

    // ─── STEP 5: Expenses ───
    console.log("📋 CREATING EXPENSES...");
    const expenses = [
      {
        title: "Rent — January",
        category: "Rent",
        amount: 25000,
        vendor: "Property Owner",
        date: "2026-01-01",
        status: "paid",
      },
      {
        title: "Electricity Bill — Jan",
        category: "Electricity Bill",
        amount: 11000,
        vendor: "PESCO",
        date: "2026-01-12",
        status: "paid",
      },
      {
        title: "Rent — February",
        category: "Rent",
        amount: 25000,
        vendor: "Property Owner",
        date: "2026-02-01",
        status: "paid",
      },
      {
        title: "Electricity Bill — Feb",
        category: "Electricity Bill",
        amount: 12500,
        vendor: "PESCO",
        date: "2026-02-10",
        status: "paid",
      },
      {
        title: "Generator Fuel",
        category: "Generator Fuel",
        amount: 8000,
        vendor: "PSO Fuel Station",
        date: "2026-02-15",
        status: "paid",
      },
      {
        title: "Staff Tea & Snacks — Feb",
        category: "Staff Tea & Refreshments",
        amount: 4500,
        vendor: "Local Canteen",
        date: "2026-02-28",
        status: "paid",
      },
      {
        title: "Stationery & Printing",
        category: "Stationery",
        amount: 6200,
        vendor: "Peshawar Stationers",
        date: "2026-02-20",
        status: "paid",
      },
      {
        title: "Marketing Flyers",
        category: "Marketing / Ads",
        amount: 15000,
        vendor: "Digital Print Solutions",
        date: "2026-02-25",
        status: "paid",
      },
      {
        title: "Rent — March",
        category: "Rent",
        amount: 25000,
        vendor: "Property Owner",
        date: "2026-03-01",
        status: "paid",
      },
      {
        title: "Electricity Bill — Mar",
        category: "Electricity Bill",
        amount: 13000,
        vendor: "PESCO",
        date: "2026-03-05",
        status: "paid",
      },
      {
        title: "Staff Tea — Mar",
        category: "Staff Tea & Refreshments",
        amount: 3500,
        vendor: "Local Canteen",
        date: "2026-03-10",
        status: "paid",
      },
    ];

    let totalExpenses = 0;
    for (const exp of expenses) {
      await Expense.create({
        title: exp.title,
        category: exp.category,
        amount: exp.amount,
        vendorName: exp.vendor,
        expenseDate: new Date(exp.date),
        status: exp.status,
        description: exp.title,
      });

      if (exp.status === "paid") {
        await Transaction.create({
          type: "EXPENSE",
          category: exp.category,
          amount: exp.amount,
          description: `Expense: ${exp.title}`,
          date: new Date(exp.date),
          status: "VERIFIED",
        });
        transactionCount++;
        totalExpenses += exp.amount;
      }
    }
    console.log(
      `   ✅ ${expenses.length} expenses (PKR ${totalExpenses.toLocaleString()} paid)\n`,
    );

    // ─── STEP 6: Daily Closings ───
    console.log("🔒 CREATING DAILY CLOSINGS...");
    const closingDates = [
      "2026-01-20",
      "2026-01-25",
      "2026-01-30",
      "2026-02-05",
      "2026-02-10",
      "2026-02-15",
      "2026-02-20",
      "2026-02-25",
      "2026-02-28",
      "2026-03-02",
      "2026-03-05",
      "2026-03-08",
    ];

    for (const dateStr of closingDates) {
      const d = new Date(dateStr);
      // Count transactions around that date
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTxns = await Transaction.countDocuments({
        date: { $gte: dayStart, $lte: dayEnd },
        status: "VERIFIED",
      });

      const dayTotal = await Transaction.aggregate([
        {
          $match: {
            date: { $gte: dayStart, $lte: dayEnd },
            type: "INCOME",
            status: "VERIFIED",
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      await DailyClosing.create({
        closedBy: admin._id,
        closedByName: admin.fullName,
        date: d,
        totalAmount: dayTotal[0]?.total || 0,
        transactionCount: dayTxns || 0,
        status: "VERIFIED",
        notes: `End-of-day closing for ${dateStr}`,
      });
    }
    console.log(`   ✅ ${closingDates.length} daily closings\n`);

    // ─── STEP 7: Notifications ───
    console.log("🔔 CREATING NOTIFICATIONS...");
    const notifications = [
      {
        msg: "New fee collection: PKR 5,000 from Saifullah Khan (Biology)",
        type: "FINANCE",
      },
      {
        msg: "Teacher payout processed: Dr. Ahmed Khan — PKR 21,000",
        type: "FINANCE",
      },
      { msg: "Daily closing completed for March 8, 2026", type: "SYSTEM" },
      { msg: "Electricity bill expense: PKR 13,000 recorded", type: "FINANCE" },
      {
        msg: "New student admission: Fahad Iqbal enrolled in 12th Engineering",
        type: "SYSTEM",
      },
      {
        msg: "Payroll update: Prof. Fatima Ali — PKR 18,900 paid",
        type: "FINANCE",
      },
      { msg: "System configuration updated by admin", type: "SYSTEM" },
    ];

    for (let i = 0; i < notifications.length; i++) {
      await Notification.create({
        recipient: admin._id,
        recipientRole: "OWNER",
        message: notifications[i].msg,
        type: notifications[i].type,
        isRead: i < 4, // First 4 are read, last 3 unread
      });
    }
    console.log(`   ✅ ${notifications.length} notifications (3 unread)\n`);

    // ─── STEP 8: Today's Walk-In Collections ───
    console.log("🏦 ADDING TODAY'S COLLECTIONS...");
    const today = new Date();
    today.setHours(10, 0, 0, 0);

    // Pick 3 students who "walk in" today to pay fees
    const todayStudents = students.slice(0, 3);
    let todayCollected = 0;

    for (const student of todayStudents) {
      const cls = classes.find(
        (c) => c._id.toString() === student.classRef?.toString(),
      );
      if (!cls) continue;

      // Each pays a single subject fee today
      const subj = student.subjects[0];
      if (!subj) continue;
      const subjName = typeof subj === "string" ? subj : subj.name;
      const subjFee = typeof subj === "object" ? subj.fee || 5000 : 5000;
      const teacher = teacherBySubject[subjName.toLowerCase()];
      const teacherShare = Math.round(subjFee * 0.7);
      const academyShare = subjFee - teacherShare;

      await FeeRecord.create({
        student: student._id,
        studentName: student.studentName,
        class: cls._id,
        className: cls.classTitle,
        subject: subjName,
        amount: subjFee,
        month: "March 2026 (Extra)",
        status: "PAID",
        collectedBy: admin._id,
        collectedByName: admin.fullName,
        teacher: teacher?._id || null,
        teacherName: teacher?.name || "N/A",
        paymentMethod: "CASH",
        splitBreakdown: {
          teacherShare,
          academyShare,
          teacherPercentage: 70,
          academyPercentage: 30,
        },
        revenueSource: "standard-split",
      });
      feeRecordCount++;

      await Transaction.create({
        type: "INCOME",
        category: "Tuition",
        amount: subjFee,
        description: `Fee: ${student.studentName} — ${subjName} (Walk-in)`,
        date: today,
        status: "FLOATING",
        studentId: student._id,
        classId: cls._id,
        collectedBy: admin._id,
        splitDetails: {
          teacherShare,
          academyShare,
          teacherPercentage: 70,
          academyPercentage: 30,
          teacherId: teacher?._id || null,
          teacherName: teacher?.name || "N/A",
        },
      });
      transactionCount++;

      if (teacher) {
        await Transaction.create({
          type: "LIABILITY",
          category: "Teacher Share",
          amount: teacherShare,
          description: `Teacher share: ${teacher.name} — ${subjName} from ${student.studentName}`,
          date: today,
          status: "FLOATING",
          splitDetails: {
            teacherId: teacher._id,
            teacherName: teacher.name,
            teacherShare,
            academyShare,
            teacherPercentage: 70,
            academyPercentage: 30,
          },
        });
        transactionCount++;
        teacher.balance.floating += teacherShare;
        await teacher.save();
      }

      student.paidAmount += subjFee;
      await student.save();
      todayCollected += subjFee;
      totalCollected += subjFee;
    }
    console.log(
      `   ✅ Today's walk-ins: ${todayStudents.length} students, PKR ${todayCollected.toLocaleString()}\n`,
    );

    // ─── FINAL REPORT ───
    console.log("═══════════════════════════════════════");
    console.log("   🎉 MEGA SEED COMPLETE!");
    console.log("═══════════════════════════════════════");
    console.log(`   Students: ${students.length}`);
    console.log(`   Teachers: ${teachers.length}`);
    console.log(`   Classes: ${classes.length}`);
    console.log(`   Fee Records: ${feeRecordCount}`);
    console.log(`   Transactions: ${transactionCount}`);
    console.log(`   Expenses: ${expenses.length}`);
    console.log(`   Teacher Payouts: ${payoutCount}`);
    console.log(`   Daily Closings: ${closingDates.length}`);
    console.log(`   Timetable Entries: ${timetableEntries.length}`);
    console.log(`   Notifications: ${notifications.length}`);
    console.log("");
    console.log(`   💰 Total Revenue: PKR ${totalCollected.toLocaleString()}`);
    console.log(`   💸 Total Expenses: PKR ${totalExpenses.toLocaleString()}`);
    console.log("");

    // Print teacher balances
    console.log("   📊 Teacher Balances:");
    for (const t of teachers) {
      const fresh = await Teacher.findById(t._id);
      console.log(
        `      ${fresh.name} (${fresh.subject}): Floating=PKR ${fresh.balance.floating}, Verified=PKR ${fresh.balance.verified}, Pending=PKR ${fresh.balance.pending}, TotalPaid=PKR ${fresh.totalPaid}`,
      );
    }
    console.log("");

    // Print student fee status
    console.log("   📊 Student Fee Status:");
    for (const s of students) {
      const fresh = await Student.findById(s._id);
      console.log(
        `      ${fresh.studentName}: Fee=${fresh.totalFee}, Paid=${fresh.paidAmount}, Status=${fresh.feeStatus}`,
      );
    }
    console.log("");

    console.log("   🔑 Login: admin / admin123");
    console.log("   🌐 Frontend: http://localhost:8080");
    console.log("   🖥️  Backend: http://localhost:5000");
    console.log("═══════════════════════════════════════\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed Error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedMega();
