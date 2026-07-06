import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import { MdDownload, MdSearch, MdFilterList } from 'react-icons/md';

const AttendanceReport = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState([]);
  const [totalClasses, setTotalClasses] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await API.get('/subjects');
        setSubjects(res.data);
      } catch { /* ignore */ }
    };
    fetchSubjects();
  }, []);

  const fetchReport = async () => {
    if (!selectedSubject) { alert('Please select a subject.'); return; }
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await API.get(`/attendance/report/${selectedSubject}`, { params });
      setReport(res.data.report);
      setTotalClasses(res.data.totalClasses);
      setFetched(true);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const getColor = (pct) => {
    if (pct >= 75) return 'high';
    if (pct >= 50) return 'medium';
    return 'low';
  };

  const getBadgeStyle = (pct) => {
    if (pct >= 75) return { background: 'var(--green-glow)', color: 'var(--green)' };
    if (pct >= 50) return { background: 'var(--yellow-glow)', color: 'var(--yellow)' };
    return { background: 'var(--red-glow)', color: 'var(--red)' };
  };

  const exportCSV = () => {
    if (!report.length) return;
    const subjectInfo = subjects.find(s => s._id === selectedSubject);
    const headers = ['Roll Number', 'Name', 'Department', 'Year', 'Section', 'Present', 'Total Classes', 'Percentage'];
    const rows = report.map(r => [
      r.student.rollNumber, r.student.name, r.student.department,
      r.student.year, r.student.section || '',
      r.presentCount, r.totalClasses, `${r.percentage}%`
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${subjectInfo?.code || 'report'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const avgPercentage = report.length > 0
    ? Math.round(report.reduce((acc, r) => acc + r.percentage, 0) / report.length)
    : 0;

  const below75 = report.filter(r => r.percentage < 75).length;

  return (
    <>
      <Navbar title="Attendance Reports" subtitle="View and export attendance data" />
      <div className="page-container">

        {/* Filters */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)' }}>
            <MdFilterList style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Filter Report
          </h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
              <label className="form-label">Subject *</label>
              <select
                id="report-subject"
                className="form-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="">— Select Subject —</option>
                {subjects.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">From Date</label>
              <input
                id="report-start-date"
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">To Date</label>
              <input
                id="report-end-date"
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button
              id="generate-report-btn"
              className="btn btn-primary"
              onClick={fetchReport}
              disabled={loading}
              style={{ marginBottom: 0 }}
            >
              {loading ? <><span className="spinner" /> Loading...</> : <><MdSearch /> Generate Report</>}
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        {fetched && (
          <>
            <div className="grid-4" style={{ marginBottom: 24 }}>
              <div className="stat-card blue">
                <div className="stat-icon blue">👨‍🎓</div>
                <div><div className="stat-label">Total Students</div><div className="stat-value">{report.length}</div></div>
              </div>
              <div className="stat-card purple">
                <div className="stat-icon purple">📅</div>
                <div><div className="stat-label">Total Classes</div><div className="stat-value">{totalClasses}</div></div>
              </div>
              <div className="stat-card green">
                <div className="stat-icon green">📈</div>
                <div><div className="stat-label">Avg Attendance</div><div className="stat-value">{avgPercentage}%</div></div>
              </div>
              <div className="stat-card yellow">
                <div className="stat-icon yellow">⚠️</div>
                <div><div className="stat-label">Below 75%</div><div className="stat-value">{below75}</div></div>
              </div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', borderBottom: '1px solid var(--border)'
              }}>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>
                  📊 Detailed Report — {subjects.find(s => s._id === selectedSubject)?.name}
                </h3>
                <button id="export-csv-btn" className="btn btn-success btn-sm" onClick={exportCSV}>
                  <MdDownload /> Export CSV
                </button>
              </div>

              <div className="table-container" style={{ border: 'none' }}>
                {report.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <p className="empty-state-title">No attendance data found</p>
                    <p className="empty-state-desc">No attendance has been marked for this subject in the selected date range.</p>
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Roll Number</th>
                        <th>Name</th>
                        <th>Dept</th>
                        <th>Year</th>
                        <th>Present</th>
                        <th>Total</th>
                        <th>Attendance %</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.map((r, i) => (
                        <tr key={r.student._id}>
                          <td className="text-muted text-sm">{i + 1}</td>
                          <td><span className="roll-number">{r.student.rollNumber}</span></td>
                          <td style={{ fontWeight: 600 }}>{r.student.name}</td>
                          <td>{r.student.department}</td>
                          <td>Yr {r.student.year}</td>
                          <td style={{ fontWeight: 700, color: 'var(--green)' }}>{r.presentCount}</td>
                          <td className="text-secondary">{r.totalClasses}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="progress-bar" style={{ flex: 1, maxWidth: 80 }}>
                                <div
                                  className={`progress-fill ${getColor(r.percentage)}`}
                                  style={{ width: `${r.percentage}%` }}
                                />
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 700, minWidth: 36 }}>{r.percentage}%</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge" style={getBadgeStyle(r.percentage)}>
                              {r.percentage >= 75 ? '✓ Good' : r.percentage >= 50 ? '⚡ Risk' : '✗ Low'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

        {!fetched && !loading && (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <p className="empty-state-title">Select a subject to view report</p>
              <p className="empty-state-desc">Choose a subject and optionally set date range, then click Generate Report.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AttendanceReport;
