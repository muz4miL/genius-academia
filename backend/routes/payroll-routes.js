const router = require('express').Router();
const { grantAdvance, getTeacherPayroll, finalizeSalary } = require('../controllers/finance/payroll-controller');
const { verifyAdmin } = require('../middleware/auth');

router.post('/advance', verifyAdmin, grantAdvance);
router.get('/teacher/:teacherId', verifyAdmin, getTeacherPayroll);
router.post('/finalize', verifyAdmin, finalizeSalary);

module.exports = router;
