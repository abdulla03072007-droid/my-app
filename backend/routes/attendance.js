const express = require('express');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Helper: normalize date to start of day (UTC)
const startOfDay = (date) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};
const endOfDay = (date) => {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
};

// @route   POST /api/attendance/scan
// @desc    Mark attendance via QR scan (by roll number)
// @access  Private (Teacher or Admin)
router.post('/scan', authMiddleware, async (req, res) => {
  try {
    const { rollNumber, subjectId, date } = req.body;

    if (!rollNumber || !subjectId || !date) {
      return res.status(400).json({ message: 'Roll number, subject, and date are required.' });
    }

    // Find student by roll number
    const student = await Student.findOne({ rollNumber: rollNumber.toUpperCase() });
    if (!student) {
      return res.status(404).json({
        message: `Student with roll number "${rollNumber}" not found.`,
        rollNumber
      });
    }

    if (!student.isActive) {
      return res.status(400).json({ message: `Student ${student.name} is inactive.` });
    }

    // Verify subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found.' });
    }

    // Normalize date: parse YYYY-MM-DD string directly to avoid timezone issues
    const [year, month, day] = date.split('-').map(Number);
    const attendanceDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    // Check for duplicate: same student + subject + date
    const existing = await Attendance.findOne({
      student: student._id,
      subject: subjectId,
      date: attendanceDate
    });

    if (existing) {
      return res.status(409).json({
        message: `${student.name} is already marked present for today.`,
        student,
        alreadyMarked: true
      });
    }

    // Create attendance record
    const attendance = await Attendance.create({
      student: student._id,
      subject: subjectId,
      markedBy: req.user._id,
      date: attendanceDate,
      status: 'present',
      scannedAt: new Date()
    });

    res.status(201).json({
      message: `✅ ${student.name} marked present!`,
      student,
      attendance
    });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ message: 'Server error during QR scan.' });
  }
});

// @route   GET /api/attendance
// @desc    Get attendance records with filters
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { subjectId, studentId, startDate, endDate, date } = req.query;
    const query = {};

    if (subjectId) query.subject = subjectId;
    if (studentId) query.student = studentId;

    if (date) {
      // Parse YYYY-MM-DD safely in UTC to match stored dates
      const [y, m, d] = date.split('-').map(Number);
      const dayStart = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
      const dayEnd   = new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
      query.date = { $gte: dayStart, $lte: dayEnd };
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startOfDay(startDate);
      if (endDate) query.date.$lte = endOfDay(endDate);
    }

    // Teachers can only see their subjects
    if (req.user.role === 'teacher') {
      const teacherSubjects = await Subject.find({ teacher: req.user._id }).select('_id');
      const teacherSubjectIds = teacherSubjects.map(s => s._id);
      query.subject = { $in: teacherSubjectIds };
    }

    const records = await Attendance.find(query)
      .populate('student', 'name rollNumber department year section')
      .populate('subject', 'name code department')
      .populate('markedBy', 'name')
      .sort({ date: -1, scannedAt: -1 });

    res.json(records);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/attendance/stats
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const today = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const [
      totalStudents,
      totalSubjects,
      todayAttendance,
      totalRecords
    ] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      Subject.countDocuments({ isActive: true }),
      Attendance.countDocuments({ date: { $gte: today, $lte: todayEnd } }),
      Attendance.countDocuments()
    ]);

    // Last 7 days attendance trend
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = startOfDay(d);
      const dayEnd = endOfDay(d);
      const count = await Attendance.countDocuments({
        date: { $gte: dayStart, $lte: dayEnd },
        status: 'present'
      });
      last7Days.push({
        date: dayStart.toISOString().split('T')[0],
        count
      });
    }

    // Department-wise attendance (today)
    const deptWise = await Attendance.aggregate([
      { $match: { date: { $gte: today, $lte: todayEnd } } },
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentData'
        }
      },
      { $unwind: '$studentData' },
      {
        $group: {
          _id: '$studentData.department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalStudents,
      totalSubjects,
      todayAttendance,
      totalRecords,
      last7Days,
      deptWise
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   GET /api/attendance/report/:subjectId
// @desc    Get attendance report for a subject (percentage per student)
// @access  Private
router.get('/report/:subjectId', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const subjectId = req.params.subjectId;

    const dateQuery = {};
    if (startDate) dateQuery.$gte = startOfDay(startDate);
    if (endDate) dateQuery.$lte = endOfDay(endDate);

    // Get all attendance records for subject
    const allRecords = await Attendance.find({
      subject: subjectId,
      ...(Object.keys(dateQuery).length > 0 ? { date: dateQuery } : {})
    }).populate('student', 'name rollNumber department year section');

    // Count total unique class days
    const uniqueDates = [...new Set(allRecords.map(r => r.date.toISOString().split('T')[0]))];
    const totalClasses = uniqueDates.length;

    // Group by student
    const studentMap = {};
    allRecords.forEach(record => {
      const sid = record.student._id.toString();
      if (!studentMap[sid]) {
        studentMap[sid] = {
          student: record.student,
          presentCount: 0
        };
      }
      if (record.status === 'present') studentMap[sid].presentCount++;
    });

    const report = Object.values(studentMap).map(entry => ({
      student: entry.student,
      presentCount: entry.presentCount,
      totalClasses,
      percentage: totalClasses > 0 ? Math.round((entry.presentCount / totalClasses) * 100) : 0
    })).sort((a, b) => a.student.rollNumber.localeCompare(b.student.rollNumber));

    res.json({ report, totalClasses, uniqueDates });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// @route   DELETE /api/attendance/:id
// @desc    Delete attendance record (Admin only)
// @access  Private/Admin
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const record = await Attendance.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found.' });
    res.json({ message: 'Attendance record deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
