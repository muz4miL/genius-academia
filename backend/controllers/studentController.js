const Student = require("../models/Student");
const FeeRecord = require("../models/FeeRecord");
const Transaction = require("../models/Transaction");
const Teacher = require("../models/Teacher");
const Class = require("../models/Class");
const Configuration = require("../models/Configuration");
const Notification = require("../models/Notification");
const User = require("../models/User");

// Minimal revenue helper inline to avoid import errors
const calculateRevenueSplit = async ({ fee, teacherRole, teacher, config }) => {
  const isOwner = teacherRole === "OWNER";
  const staffShare = config?.salaryConfig?.teacherShare || 70;

  if (isOwner) {
    // Owner keeps 100% of their own class fees
    return {
      teacherRevenue: fee,
      poolRevenue: 0,
      isPartner: false,
      isOwner: true,
      stream: "OWNER_DIRECT",
      splitType: "OWNER_100",
    };
  }

  const compType = teacher?.compensation?.type || "percentage";
  if (compType === "fixed") {
    return {
      teacherRevenue: 0,
      poolRevenue: fee,
      isPartner: false,
      isOwner: false,
      stream: "STAFF_TUITION",
      splitType: "FIXED_SALARY",
      config: {
        staffTeacherShare: 0,
        staffAcademyShare: 100,
      },
    };
  }

  const teacherSharePct =
    teacher?.compensation?.teacherShare ?? staffShare;
  const teacherAmt = Math.round((fee * teacherSharePct) / 100);
  return {
    teacherRevenue: teacherAmt,
    poolRevenue: fee - teacherAmt,
    isPartner: false,
    isOwner: false,
    stream: "STAFF_TUITION",
    splitType: "STAFF_SPLIT",
    config: {
      staffTeacherShare: teacherSharePct,
      staffAcademyShare: 100 - teacherSharePct,
    },
  };
};

const getTeacherRole = async (teacher) => {
  if (!teacher) return "STAFF";
  // Check the teacher's own role field first
  if (teacher.role === "OWNER") return "OWNER";
  if (teacher.role === "PARTNER") return "PARTNER";
  // Check if teacher is linked to a User with an elevated role
  if (teacher.userId) {
    try {
      const linkedUser = await User.findById(teacher.userId).select("role").lean();
      if (linkedUser?.role === "OWNER") return "OWNER";
    } catch (_) { /* fallthrough */ }
  }
  return "STAFF";
};

// Academy's 30% pool share is retained by the owner (single-owner model)
// No multi-partner distribution needed
const distributePoolRevenue = async ({ poolAmount }) => {
  // In single-owner mode, the academy share stays with the academy
  return { academyShare: poolAmount };
};

// GET all students
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET single student
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student)
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Calculate Fee Status — PAID only when Paid == Total, otherwise PENDING
const calculateFeeStatus = (paidAmount, totalFee) => {
  if (paidAmount >= totalFee && totalFee > 0) return "Paid";
  return "Pending"; // default — includes partial payments
};

// CREATE student
exports.createStudent = async (req, res) => {
  try {
    const studentData = { ...req.body };

    // Calculate fee status on admission
    const paidAmount = studentData.paidAmount || 0;
    const totalFee = studentData.totalFee || 0;
    studentData.feeStatus = calculateFeeStatus(paidAmount, totalFee);

    // Smart Seat Assignment — gender-based wing prefix
    if (!studentData.seatNumber) {
      const gender = studentData.gender || "Male";
      const prefix = gender === "Female" ? "L" : "R"; // L = Left Wing, R = Right Wing
      const lastSeat = await Student.findOne({
        seatNumber: new RegExp(`^${prefix}-`),
      })
        .sort({ seatNumber: -1 })
        .select("seatNumber")
        .lean();
      let nextNum = 1;
      if (lastSeat && lastSeat.seatNumber) {
        const parts = lastSeat.seatNumber.split("-");
        nextNum = (parseInt(parts[1], 10) || 0) + 1;
      }
      studentData.seatNumber = `${prefix}-${String(nextNum).padStart(3, "0")}`;
    }

    const student = await Student.create(studentData);
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// UPDATE student
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE student
exports.deleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Student deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// COLLECT FEE - Simplified but Working Version
exports.collectFee = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, month, subject, teacherId, paymentMethod, notes } =
      req.body;

    console.log("Collecting fee:", { id, amount, month, subject });

    if (!amount || !month) {
      return res
        .status(400)
        .json({ success: false, message: "Amount and month required" });
    }

    const student = await Student.findById(id);
    if (!student)
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });

    // Find teacher
    let teacher = null;
    if (teacherId) {
      teacher = await Teacher.findById(teacherId);
    }

    // Get role and calculate split
    const teacherRole = teacher ? await getTeacherRole(teacher) : "STAFF";
    const config = await Configuration.findOne();
    const split = await calculateRevenueSplit({
      fee: Number(amount),
      teacherRole,
      teacher,
      config,
    });

    // Create Fee Record
    const feeRecord = await FeeRecord.create({
      student: student._id,
      studentName: student.studentName,
      className: student.class,
      subject: subject || "General",
      amount: Number(amount),
      month,
      status: "PAID",
      collectedBy: req.user?._id,
      collectedByName: req.user?.fullName || "Staff",
      teacher: teacher?._id,
      teacherName: teacher?.name,
      isPartnerTeacher: split.isOwner || false,
      revenueSource: split.splitType,
      splitBreakdown: {
        teacherShare: split.teacherRevenue,
        academyShare: split.poolRevenue,
        teacherPercentage: split.isOwner ? 100 : (split.config?.staffTeacherShare || 70),
        academyPercentage: split.isOwner ? 0 : (split.config?.staffAcademyShare || 30),
      },
      paymentMethod: paymentMethod || "CASH",
      notes,
    });

    // Update student with strict fee status calculation
    student.paidAmount = (student.paidAmount || 0) + Number(amount);
    student.feeStatus = calculateFeeStatus(
      student.paidAmount,
      student.totalFee || 0,
    );
    await student.save();

    // Update teacher balance
    if (teacher && split.teacherRevenue > 0) {
      if (!teacher.balance)
        teacher.balance = { floating: 0, verified: 0, pending: 0 };

      if (split.isOwner) {
        // Owner's earnings are immediately verified
        teacher.balance.verified =
          (teacher.balance.verified || 0) + split.teacherRevenue;
      } else {
        // Staff teachers earn floating until day close
        teacher.balance.floating =
          (teacher.balance.floating || 0) + split.teacherRevenue;
      }
      await teacher.save();

      // Notification (non-critical)
      try {
        await Notification.create({
          recipient: teacher._id,
          message: `Fee received: ${student.studentName} - ${month}: PKR ${split.teacherRevenue}`,
          type: "FINANCE",
          relatedId: feeRecord._id.toString(),
        });
      } catch (e) {
        console.log("Notification skipped");
      }
    }

    // Create transaction record
    await Transaction.create({
      type: "INCOME",
      category: "Tuition",
      stream: split.stream,
      amount: Number(amount),
      description: `Fee: ${student.studentName} - ${month}`,
      collectedBy: req.user?._id,
      status: split.isOwner ? "VERIFIED" : "FLOATING",
      studentId: student._id,
      splitDetails: {
        teacherShare: split.teacherRevenue,
        academyShare: split.poolRevenue,
        teacherId: teacher?._id,
        teacherName: teacher?.name,
      },
    });

    // Update collector's totalCash tracking
    if (req.user?._id && !split.isOwner) {
      try {
        const collector = await User.findById(req.user._id);
        if (collector) {
          collector.totalCash = (collector.totalCash || 0) + Number(amount);
          await collector.save();
        }
      } catch (e) {
        console.log("TotalCash update skipped:", e.message);
      }
    }

    // Academy's share is retained automatically (single-owner model)
    if (split.poolRevenue > 0) {
      console.log(`Academy retains PKR ${split.poolRevenue} (30% of ${amount})`);
    }

    res.status(201).json({
      success: true,
      message: `Fee collected! Receipt: ${feeRecord.receiptNumber}`,
      data: { feeRecord, split },
    });
  } catch (error) {
    console.error("CollectFee Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

exports.getFeeHistory = async (req, res) => {
  try {
    const records = await FeeRecord.find({ student: req.params.id }).sort({
      createdAt: -1,
    });
    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.trackPrint = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student)
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });

    const version = (student.printHistory?.length || 0) + 1;
    const receiptId = `TOKEN-${student.studentId}-${Math.random().toString(36).substr(2, 4).toUpperCase()}-V${version}`;

    student.printHistory = student.printHistory || [];
    student.printHistory.push({ receiptId, printedAt: new Date(), version });
    await student.save();

    res.json({ success: true, data: { receiptId, version, student } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.findByToken = async (req, res) => {
  try {
    const student = await Student.findOne({
      "printHistory.receiptId": req.params.token,
    });
    if (!student)
      return res.status(404).json({ success: false, message: "Invalid token" });
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
