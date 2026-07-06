import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/axios';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

const StatCard = ({ icon, label, value, color, suffix = '' }) => (
  <div className={`stat-card ${color}`}>
    <div className={`stat-icon ${color}`}>{icon}</div>
    <div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}{suffix}</div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '10px 14px', fontSize: 13
      }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
        <p style={{ color: 'var(--accent-light)', fontWeight: 700 }}>
          {payload[0].value} present
        </p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('/attendance/stats');
        setStats(res.data);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <>
      <Navbar title="Dashboard" subtitle="Overview & Analytics" />
      <div className="page-container">
        <div className="loading-full"><div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /> Loading...</div>
      </div>
    </>
  );

  if (error) return (
    <>
      <Navbar title="Dashboard" />
      <div className="page-container">
        <div className="alert alert-error">{error}</div>
      </div>
    </>
  );

  const attendanceRate = stats.totalStudents > 0
    ? Math.round((stats.todayAttendance / stats.totalStudents) * 100)
    : 0;

  return (
    <>
      <Navbar title="Dashboard" subtitle="Real-time attendance overview" />
      <div className="page-container">

        {/* Stat Cards */}
        <div className="grid-4" style={{ marginBottom: 28 }}>
          <StatCard icon="🎓" label="Total Students" value={stats.totalStudents} color="blue" />
          <StatCard icon="📚" label="Active Subjects" value={stats.totalSubjects} color="purple" />
          <StatCard icon="✅" label="Present Today" value={stats.todayAttendance} color="green" />
          <StatCard icon="📊" label="Today's Rate" value={attendanceRate} suffix="%" color="yellow" />
        </div>

        {/* Charts row */}
        <div className="grid-2" style={{ marginBottom: 28 }}>
          {/* Attendance trend */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>
              📈 7-Day Attendance Trend
            </h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.last7Days}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#colorCount)"
                    dot={{ fill: '#6366f1', r: 4 }}
                    activeDot={{ r: 6, fill: '#818cf8' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department pie chart */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>
              🏫 Today by Department
            </h3>
            {stats.deptWise?.length > 0 ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.deptWise.map(d => ({ name: d._id || 'Unknown', value: d.count }))}
                      cx="50%" cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {stats.deptWise.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: 8, fontSize: 13
                      }}
                    />
                    <Legend
                      formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <div className="empty-state-icon">📊</div>
                <p className="empty-state-title">No attendance today yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Bar Chart */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>
            📅 Weekly Attendance Count
          </h3>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short' })}
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="url(#barGrad)" radius={[6, 6, 0, 0]}>
                  {stats.last7Days.map((_, i) => (
                    <Cell key={i} fill={i === 6 ? '#6366f1' : 'rgba(99,102,241,0.4)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
