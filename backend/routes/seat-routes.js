const router = require('express').Router();
const { getAvailableSeats, bookSeat, releaseSeat, initializeSeats } = require('../controllers/seat-controller');
const { verifyStudent, verifyAdmin } = require('../middleware/auth');

router.get('/:classId/:sessionId', verifyStudent, getAvailableSeats);
router.post('/book', verifyStudent, bookSeat);
router.post('/release', verifyStudent, releaseSeat);
router.post('/initialize', verifyAdmin, initializeSeats);

module.exports = router;
