const Fee = require('../models/feeSchema');
const Student = require('../models/studentSchema');

// Generate Fee for a specific student
const generateFee = async (req, res) => {
    try {
        const { studentId, month, amount } = req.body;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        const fee = new Fee({
            student: studentId,
            sclass: student.sclassName,
            school: student.school,
            month,
            amount,
            status: "Pending"
        });

        const result = await fee.save();
        res.send(result);
    } catch (err) {
        res.status(500).json(err);
    }
};

// Get Fees by Class
const getFeesByClass = async (req, res) => {
    try {
        const fees = await Fee.find({ sclass: req.params.id }).populate("student", "name rollNum");
        res.send(fees);
    } catch (err) {
        res.status(500).json(err);
    }
};

module.exports = { generateFee, getFeesByClass };
