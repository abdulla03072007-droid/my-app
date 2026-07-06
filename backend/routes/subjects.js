const express = require('express');
const Subject = require('../models/Subject');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/subjects
// @desc    Get all subjects (teachers see only their subjects)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = {};

    // Teachers only see their own subjects
    if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    }

    const { department, year } = req.query;
    if (department) query.department = new RegExp(department, 'i');
    if (year) query.year = parseInt(year);

    const subjects = await Subject.find(query)
      .populate('teacher', 'name email department')
      .sort({ name: 1 });

    res.json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/subjects/:id
// @desc    Get subject by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('teacher', 'name email');
    if (!subject) return res.status(404).json({ message: 'Subject not found.' });
    res.json(subject);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   POST /api/subjects
// @desc    Create subject (Admin only)
// @access  Private/Admin
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, code, department, year, section, teacher, creditHours } = req.body;

    if (!name || !code || !department || !year || !teacher) {
      return res.status(400).json({ message: 'Name, code, department, year, and teacher are required.' });
    }

    const existing = await Subject.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: `Subject with code ${code} already exists.` });
    }

    const subject = await Subject.create({
      name, code: code.toUpperCase(), department, year, section, teacher, creditHours
    });

    const populated = await Subject.findById(subject._id).populate('teacher', 'name email');
    res.status(201).json({ message: 'Subject created successfully.', subject: populated });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   PUT /api/subjects/:id
// @desc    Update subject (Admin only)
// @access  Private/Admin
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, code, department, year, section, teacher, creditHours, isActive } = req.body;

    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { name, code: code ? code.toUpperCase() : undefined, department, year, section, teacher, creditHours, isActive },
      { new: true }
    ).populate('teacher', 'name email');

    if (!subject) return res.status(404).json({ message: 'Subject not found.' });
    res.json({ message: 'Subject updated successfully.', subject });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   DELETE /api/subjects/:id
// @desc    Delete subject (Admin only)
// @access  Private/Admin
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found.' });
    res.json({ message: 'Subject deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
