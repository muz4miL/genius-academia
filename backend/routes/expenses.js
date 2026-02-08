const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const Configuration = require("../models/Configuration");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { protect, restrictTo } = require("../middleware/authMiddleware");

// @route   GET /api/expenses
// @desc    Get all expenses
// @access  Public
router.get("/", async (req, res) => {
  try {
    const { category, startDate, endDate, limit } = req.query;

    let query = {};

    // Filter by category
    if (category && category !== "all") {
      query.category = category;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) query.expenseDate.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .sort({ expenseDate: -1 })
      .limit(limit ? parseInt(limit) : 100);

    // Calculate total for PAID expenses only
    const totalResult = await Expense.aggregate([
      { $match: { ...query, status: "paid" } },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
    ]);

    res.json({
      success: true,
      count: expenses.length,
      totalAmount: totalResult[0]?.totalAmount || 0,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching expenses",
      error: error.message,
    });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get single expense
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.json({
      success: true,
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching expense",
      error: error.message,
    });
  }
});

// @route   POST /api/expenses
// @desc    Create new expense with automatic partnership split
// @access  Protected
router.post("/", protect, async (req, res) => {
  try {
    console.log("📝 Expense creation request received:", req.body);
    const userRole = req.user?.role || "OPERATOR";

    const {
      title,
      category,
      amount,
      vendorName,
      dueDate,
      expenseDate,
      description,
      billNumber,
      paidByType = "ACADEMY_CASH", // NEW: Who actually paid for this
    } = req.body;

    // Validation
    if (!title || !category || !amount || !vendorName || !dueDate) {
      console.log("❌ Validation failed - missing fields");
      return res.status(400).json({
        success: false,
        message:
          "Please provide title, category, amount, vendor name, and due date",
      });
    }

    // ========================================
    // DYNAMIC PARTNERSHIP SPLIT LOGIC
    // ========================================

    // 1. Fetch expense split percentages from Configuration
    let splitRatio = { waqar: 40, zahid: 30, saud: 30 }; // Defaults
    const config = await Configuration.findOne();
    if (config && config.expenseSplit) {
      splitRatio = {
        waqar: config.expenseSplit.waqar || 40,
        zahid: config.expenseSplit.zahid || 30,
        saud: config.expenseSplit.saud || 30,
      };
      console.log(
        "📊 Using dynamic expense split from Configuration:",
        splitRatio,
      );
    }

    // 2. Find all partners (OWNER + PARTNER roles)
    const partners = await User.find({
      role: { $in: ["OWNER", "PARTNER"] },
      isActive: { $ne: false },
    });

    // 3. Calculate shares for each partner
    const parsedAmount = parseFloat(amount);
    const shares = [];
    let hasPartnerDebt = false;
    let payingPartnerId = null;
    let payingPartnerName = null;

    // Identify who paid if it's a partner (not academy cash)
    if (paidByType !== "ACADEMY_CASH") {
      const payerPartner = partners.find((p) => {
        const name = p.fullName.toLowerCase();
        return (
          (paidByType === "WAQAR" && name.includes("waqar")) ||
          (paidByType === "ZAHID" && name.includes("zahid")) ||
          (paidByType === "SAUD" && name.includes("saud"))
        );
      });
      if (payerPartner) {
        payingPartnerId = payerPartner._id;
        payingPartnerName = payerPartner.fullName;
      }
    }

    for (const partner of partners) {
      const nameKey = partner.fullName.toLowerCase();
      let percentage = 0;
      let partnerKey = null;

      if (nameKey.includes("waqar")) {
        percentage = splitRatio.waqar;
        partnerKey = "waqar";
      } else if (nameKey.includes("zahid")) {
        percentage = splitRatio.zahid;
        partnerKey = "zahid";
      } else if (nameKey.includes("saud")) {
        percentage = splitRatio.saud;
        partnerKey = "saud";
      }

      if (percentage > 0) {
        const shareAmount = Math.round((parsedAmount * percentage) / 100);

        // Determine the status of this share based on who paid
        let shareStatus = "UNPAID";

        if (paidByType === "ACADEMY_CASH") {
          // Academy paid - everyone's share is from academy funds
          shareStatus = "N/A"; // Not applicable - no inter-partner debt
        } else if (paidByType === "JOINT_POOL") {
          // Joint pool expense - deducted from gross revenue before splits
          shareStatus = "N/A"; // Not applicable - no inter-partner debt
        } else if (paidByType.toUpperCase() === partnerKey?.toUpperCase()) {
          // This partner paid the expense - their share is automatically "PAID"
          shareStatus = "PAID";
        } else {
          // Another partner paid - this partner owes them money
          shareStatus = "UNPAID";
          hasPartnerDebt = true;

          // Update the partner's debtToOwner if Sir Waqar paid
          if (paidByType === "WAQAR") {
            partner.debtToOwner = (partner.debtToOwner || 0) + shareAmount;
            await partner.save();
            console.log(
              `💳 Added PKR ${shareAmount} debt for ${partner.fullName} → Sir Waqar`,
            );
          }
        }

        shares.push({
          partner: partner._id,
          partnerName: partner.fullName,
          partnerKey,
          amount: shareAmount,
          percentage: percentage,
          status: shareStatus,
        });

        // 4. Only deduct from wallets if ACADEMY paid (normal flow)
        // JOINT_POOL expenses are NOT deducted here - they're handled in stats calculation
        if (paidByType === "ACADEMY_CASH") {
          if (
            partner.walletBalance &&
            typeof partner.walletBalance === "object"
          ) {
            partner.walletBalance.verified =
              (partner.walletBalance.verified || 0) - shareAmount;
            await partner.save();
            console.log(
              `💸 Deducted PKR ${shareAmount} from ${partner.fullName}'s wallet`,
            );
          }
        }

        // 5. Create notification for partner
        const notificationMessage =
          paidByType === "ACADEMY_CASH"
            ? `💰 New expense "${title}": Your share is PKR ${shareAmount.toLocaleString()} (${percentage}% of PKR ${parsedAmount.toLocaleString()})`
            : `💳 ${payingPartnerName || paidByType} paid for "${title}": Your share is PKR ${shareAmount.toLocaleString()} (${percentage}%)`;

        await Notification.create({
          recipient: partner._id,
          message: notificationMessage,
          type: "FINANCE",
        });
      }
    }

    const expenseData = {
      title,
      category,
      amount: parsedAmount,
      vendorName,
      dueDate: new Date(dueDate),
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      description,
      billNumber,
      status: "pending",
      paidByType,
      paidBy: payingPartnerId,
      splitRatio,
      shares,
      hasPartnerDebt,
    };

    console.log("💾 Creating expense with data:", expenseData);

    const expense = new Expense(expenseData);
    await expense.save();

    console.log("✅ Expense created successfully:", expense._id);

    // === REVERSE SMART SYNC: Role-based response ===
    // OPERATOR/PARTNER: Only return the single transaction record
    // OWNER: Return full data including totals
    const baseResponse = {
      success: true,
      message:
        paidByType === "ACADEMY_CASH"
          ? "Expense created successfully"
          : `Expense recorded - Paid by ${paidByType}`,
      data: {
        _id: expense._id,
        title: expense.title,
        category: expense.category,
        amount: expense.amount,
        vendorName: expense.vendorName,
        dueDate: expense.dueDate,
        status: expense.status,
        paidByType: expense.paidByType,
        createdAt: expense.createdAt,
      },
    };

    // OWNER-only: Include additional analytics
    if (userRole === "OWNER") {
      // Calculate current totals for owner
      const totalExpensesResult = await Expense.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      const currentTotalExpenses = totalExpensesResult[0]?.total || 0;

      baseResponse.shares = shares.map((s) => ({
        partner: s.partnerName,
        amount: s.amount,
        percentage: s.percentage,
        status: s.status,
      }));
      baseResponse.debtGenerated = hasPartnerDebt;
      baseResponse.analytics = {
        totalExpenses: currentTotalExpenses,
      };
    }

    res.status(201).json(baseResponse);
  } catch (error) {
    console.error("❌ Expense creation error:", error.message);
    console.error("Stack:", error.stack);
    res.status(400).json({
      success: false,
      message: "Error creating expense",
      error: error.message,
    });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Public
router.put("/:id", async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.json({
      success: true,
      message: "Expense updated successfully",
      data: expense,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating expense",
      error: error.message,
    });
  }
});

// @route   PATCH /api/expenses/:id/mark-paid
// @desc    Mark expense as paid
// @access  Public
router.patch("/:id/mark-paid", async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    if (expense.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Expense is already marked as paid",
      });
    }

    expense.status = "paid";
    expense.paidDate = new Date();

    await expense.save();

    res.json({
      success: true,
      message: "Expense marked as paid successfully",
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error marking expense as paid",
      error: error.message,
    });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Public
router.delete("/:id", async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.json({
      success: true,
      message: "Expense deleted successfully",
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting expense",
      error: error.message,
    });
  }
});

// @route   GET /api/expenses/partner-debts
// @desc    Get expenses paid by Waqar with partner debt details
// @access  Public
router.get("/partner-debts", async (req, res) => {
  try {
    const expenses = await Expense.find({
      paidByType: "WAQAR",
    })
      .sort({ expenseDate: -1 })
      .populate("shares.partner", "fullName")
      .lean();

    // Add status summary to each expense
    const expensesWithStatus = expenses.map((expense) => {
      const unpaidShares =
        expense.shares?.filter((s) => s.status === "UNPAID") || [];
      const paidShares =
        expense.shares?.filter((s) => s.status === "PAID") || [];

      return {
        ...expense,
        debtSummary: {
          totalUnpaid: unpaidShares.reduce((sum, s) => sum + s.amount, 0),
          totalPaid: paidShares.reduce((sum, s) => sum + s.amount, 0),
          unpaidPartners: unpaidShares.map((s) => s.partnerName),
          paidPartners: paidShares.map((s) => s.partnerName),
        },
      };
    });

    res.json({
      success: true,
      count: expenses.length,
      data: expensesWithStatus,
    });
  } catch (error) {
    console.error("❌ Partner debts error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching partner debts",
      error: error.message,
    });
  }
});

module.exports = router;
