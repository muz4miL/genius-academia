const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
    sclass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sclass',
        required: true
    },
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'session',
        required: true
    },
    seatNumber: {
        type: Number,
        required: true
    },
    side: {
        type: String,
        enum: ['Left', 'Right'],
        required: true
    },
    position: {
        row: {
            type: Number,
            required: true
        },
        column: {
            type: Number,
            required: true
        }
    },
    isTaken: {
        type: Boolean,
        default: false
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'student',
        default: null
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin',
        required: true
    },
    bookedAt: {
        type: Date
    }
}, { timestamps: true });

// Compound index: One student can't book multiple seats in same class/session
seatSchema.index({ sclass: 1, session: 1, seatNumber: 1 }, { unique: true });

// Performance index for filtering available seats by side
seatSchema.index({ sclass: 1, session: 1, side: 1, isTaken: 1 });

module.exports = mongoose.model("seat", seatSchema);
