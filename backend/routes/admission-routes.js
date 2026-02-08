const router = require('express').Router();
const { approveSignup, promoteToStudent, getPendingSignups } = require('../controllers/admission-controller');
const { verifyAdmin } = require('../middleware/auth');

router.get('/signups', verifyAdmin, getPendingSignups);
router.post('/approve-signup/:signupId', verifyAdmin, approveSignup);
router.post('/promote/:admissionId', verifyAdmin, promoteToStudent);

module.exports = router;
