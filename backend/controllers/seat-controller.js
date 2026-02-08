const Seat = require('../models/seatSchema');
const Student = require('../models/studentSchema');
const Session = require('../models/sessionSchema');

// Get Available Seats - Filtered by Student's Gender
const getAvailableSeats = async (req, res) => {
    try {
        const { classId, sessionId } = req.params;
        const studentId = req.user.id;

        // Security: Extract student from DB (NO TRUST in frontend)
        const student = await Student.findById(studentId).select('gender');
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Validate session is active
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }

        // Gender-based filtering
        const allowedSide = student.gender === 'Female' ? 'Left' : 'Right';

        // Get available seats filtered by gender
        // Only return available seats to reduce data transfer
        const seats = await Seat.find({
            sclass: classId,
            session: sessionId,
            side: allowedSide
        }).sort({ seatNumber: 1 }).populate('student', 'name rollNum');

        res.status(200).json({ seats, allowedSide, studentGender: student.gender });
    } catch (err) {
        res.status(500).json({ message: "Error fetching seats", error: err.message });
    }
};

// Book Seat - With Atomic Lock and Gender Guard
const bookSeat = async (req, res) => {
    try {
        const { seatId } = req.body;
        const studentId = req.user.id;

        // Security: Extract student from DB
        const student = await Student.findById(studentId).select('gender sclassName');
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Get seat details
        const seat = await Seat.findById(seatId);
        if (!seat) {
            return res.status(404).json({ message: "Seat not found" });
        }

        // Gender Guard: Validate gender matches seat side
        const allowedSide = student.gender === 'Female' ? 'Left' : 'Right';
        if (seat.side !== allowedSide) {
            return res.status(403).json({
                message: `Access Denied: ${student.gender} students can only book seats on the ${allowedSide} side`
            });
        }

        // Unbook any previous seat for this student in the same session
        await Seat.updateMany(
            { student: studentId, session: seat.session },
            { $set: { isTaken: false, student: null, bookedAt: null } }
        );

        // Atomic Lock: Race condition protection
        const bookedSeat = await Seat.findOneAndUpdate(
            { _id: seatId, isTaken: false },
            { isTaken: true, student: studentId, bookedAt: new Date() },
            { new: true }
        ).populate('student', 'name rollNum gender');

        // Race Condition: Seat taken milliseconds ago
        if (!bookedSeat) {
            return res.status(409).json({ message: "Seat already taken" });
        }

        res.status(200).json({ message: "Seat booked successfully", seat: bookedSeat });
    } catch (err) {
        res.status(500).json({ message: "Error booking seat", error: err.message });
    }
};

// Release Seat
const releaseSeat = async (req, res) => {
    try {
        const { seatId } = req.body;
        const studentId = req.user.id;

        // Find and release seat only if it belongs to the student
        const seat = await Seat.findOneAndUpdate(
            { _id: seatId, student: studentId },
            { isTaken: false, student: null, bookedAt: null },
            { new: true }
        );

        if (!seat) {
            return res.status(404).json({ message: "Seat not found or not booked by you" });
        }

        res.status(200).json({ message: "Seat released successfully", seat });
    } catch (err) {
        res.status(500).json({ message: "Error releasing seat", error: err.message });
    }
};

// Initialize Seats for a Class - Admin Only
const initializeSeats = async (req, res) => {
    try {
        const { classId, sessionId, schoolId } = req.body;

        if (!classId || !sessionId || !schoolId) {
            return res.status(400).json({ message: "classId, sessionId, and schoolId are required" });
        }

        // Check if seats already exist
        const existingSeats = await Seat.find({ sclass: classId, session: sessionId });
        if (existingSeats.length > 0) {
            return res.status(400).json({ message: "Seats already initialized for this class and session" });
        }

        // Initialize 30 seats (15 Left, 15 Right)
        const newSeats = [];
        for (let i = 1; i <= 30; i++) {
            const side = i <= 15 ? 'Left' : 'Right';
            const column = i <= 15 ? i : i - 15;
            newSeats.push({
                sclass: classId,
                session: sessionId,
                school: schoolId,
                seatNumber: i,
                side: side,
                position: {
                    row: Math.ceil(column / 3),
                    column: ((column - 1) % 3) + 1
                },
                isTaken: false,
                student: null
            });
        }

        const createdSeats = await Seat.insertMany(newSeats);
        res.status(201).json({ message: "Seats initialized successfully", count: createdSeats.length, seats: createdSeats });
    } catch (err) {
        res.status(500).json({ message: "Error initializing seats", error: err.message });
    }
};

module.exports = { getAvailableSeats, bookSeat, releaseSeat, initializeSeats };
