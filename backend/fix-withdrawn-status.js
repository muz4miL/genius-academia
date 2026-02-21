const mongoose = require('mongoose');
require('dotenv').config();

const DB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/genius-academia';

mongoose.connect(DB_URI).then(async () => {
  const Student = require('./models/Student');
  
  // Find all withdrawn students
  const withdrawn = await Student.find({ studentStatus: 'Withdrawn' })
    .select('studentName studentId status studentStatus')
    .lean();
  
  console.log('Withdrawn students found:', withdrawn.length);
  withdrawn.forEach(s => {
    console.log(`  ${s.studentName} (${s.studentId}) - status: ${s.status}, studentStatus: ${s.studentStatus}`);
  });
  
  // Fix: set status to inactive for any withdrawn student still showing active
  const result = await Student.updateMany(
    { studentStatus: 'Withdrawn', status: 'active' },
    { status: 'inactive' }
  );
  
  console.log('\nFixed:', result.modifiedCount, 'students updated to inactive');
  
  await mongoose.disconnect();
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
