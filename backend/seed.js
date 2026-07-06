/**
 * Seed Script - Creates the initial Admin, Teacher, Student, and Subject
 * Run: node seed.js
 */
const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const Subject = require('./models/Subject');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Create Admin
    let admin = await User.findOne({ email: 'admin@college.edu' });
    if (!admin) {
      admin = await User.create({
        name: 'System Admin',
        email: 'admin@college.edu',
        password: 'Admin@123',
        role: 'admin',
        department: 'Administration'
      });
      console.log('✅ Admin user created! (admin@college.edu / Admin@123)');
    } else {
      console.log('ℹ️ Admin user already exists.');
    }

    // 2. Create Teacher
    let teacher = await User.findOne({ email: 'teacher@college.edu' });
    if (!teacher) {
      teacher = await User.create({
        name: 'Prof. Sarah Jenkins',
        email: 'teacher@college.edu',
        password: 'Teacher@123',
        role: 'teacher',
        department: 'CSE'
      });
      console.log('✅ Teacher user created! (teacher@college.edu / Teacher@123)');
    } else {
      console.log('ℹ️ Teacher user already exists.');
    }

    // 3. Create Student (User's ID card)
    let student = await Student.findOne({ rollNumber: '24CSE01' });
    if (!student) {
      student = await Student.create({
        name: 'ABDULLA A',
        rollNumber: '24CSE01',
        email: 'abdulla@college.edu',
        phone: '9876543210',
        department: 'CSE',
        year: 1,
        section: 'A',
        gender: 'Male',
        isActive: true
      });
      console.log('✅ Student ABDULLA A (24CSE01) created!');
    } else {
      console.log('ℹ️ Student 24CSE01 already exists.');
    }

    // 4. Create Subject assigned to the Teacher
    let subject = await Subject.findOne({ code: 'CS101' });
    if (!subject) {
      subject = await Subject.create({
        name: 'Introduction to Computer Science',
        code: 'CS101',
        department: 'CSE',
        year: 1,
        section: 'A',
        teacher: teacher._id,
        creditHours: 4,
        isActive: true
      });
      console.log('✅ Subject CS101 assigned to Teacher created!');
    } else {
      console.log('ℹ️ Subject CS101 already exists.');
    }

    console.log('\n🎉 Seeding completed successfully!');
    console.log('Ready for testing your ID card!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seedData();
