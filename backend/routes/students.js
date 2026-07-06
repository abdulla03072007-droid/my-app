const express = require('express');
const Student = require('../models/Student');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/students
// @desc    Get all students (with optional filters)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { department, year, section, search, isActive } = req.query;
    const query = {};

    if (department) query.department = new RegExp(department, 'i');
    if (year) query.year = parseInt(year);
    if (section) query.section = section.toUpperCase();
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { rollNumber: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const students = await Student.find(query).sort({ rollNumber: 1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/students/:id
// @desc    Get single student by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/students/roll/:rollNumber
// @desc    Get student by roll number (used by QR scanner)
// @access  Private
router.get('/roll/:rollNumber', authMiddleware, async (req, res) => {
  try {
    const student = await Student.findOne({
      rollNumber: req.params.rollNumber.toUpperCase()
    });
    if (!student) {
      return res.status(404).json({ message: `Student with roll number ${req.params.rollNumber} not found.` });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   POST /api/students
// @desc    Add a new student (Admin only)
// @access  Private/Admin
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, rollNumber, email, phone, department, year, section, gender } = req.body;

    if (!name || !rollNumber || !department || !year) {
      return res.status(400).json({ message: 'Name, roll number, department, and year are required.' });
    }

    const existing = await Student.findOne({ rollNumber: rollNumber.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: `Roll number ${rollNumber} already exists.` });
    }

    const student = await Student.create({
      name, rollNumber: rollNumber.toUpperCase(),
      email, phone, department, year, section, gender
    });

    res.status(201).json({ message: 'Student added successfully.', student });
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   PUT /api/students/:id
// @desc    Update student (Admin only)
// @access  Private/Admin
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, rollNumber, email, phone, department, year, section, gender, isActive } = req.body;

    if (rollNumber) {
      const existing = await Student.findOne({
        rollNumber: rollNumber.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      if (existing) {
        return res.status(400).json({ message: 'Roll number already in use by another student.' });
      }
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      {
        name,
        rollNumber: rollNumber ? rollNumber.toUpperCase() : undefined,
        email, phone, department, year, section, gender, isActive
      },
      { new: true, runValidators: true }
    );

    if (!student) return res.status(404).json({ message: 'Student not found.' });
    res.json({ message: 'Student updated successfully.', student });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   DELETE /api/students/:id
// @desc    Delete student (Admin only)
// @access  Private/Admin
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    res.json({ message: 'Student deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   POST /api/students/bulk
// @desc    Bulk import students (Admin only)
// @access  Private/Admin
router.post('/bulk', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'Students array is required.' });
    }

    const formatted = students.map(s => ({
      ...s,
      rollNumber: s.rollNumber.toUpperCase()
    }));

    const result = await Student.insertMany(formatted, { ordered: false });
    res.status(201).json({ message: `${result.length} students imported successfully.` });
  } catch (error) {
    res.status(500).json({ message: 'Bulk import error. Check for duplicate roll numbers.' });
  }
});

module.exports = router;
