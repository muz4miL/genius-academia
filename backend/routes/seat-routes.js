const router = require('express').Router();
const {
    getAvailableSeats,
    bookSeat,
    releaseSeat,
    initializeSeats,
    getAllSeatsAdmin,
    vacateSeat,
    toggleReservation,
} = require('../controllers/seat-controller');
const { protect } = require('../middleware/authMiddleware');

// Student Routes
router.get('/:classId/:sessionId', getAvailableSeats);
router.post('/book', bookSeat);
router.post('/release', releaseSeat);

// Admin Routes (Protected)
router.get('/admin/:classId/:sessionId', protect, getAllSeatsAdmin);
router.post('/initialize', protect, initializeSeats);
router.post('/vacate/:seatId', protect, vacateSeat);
router.patch('/reserve/:seatId', protect, toggleReservation);

module.exports = router;
