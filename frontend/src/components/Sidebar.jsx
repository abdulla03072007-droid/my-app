import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MdDashboard, MdPeople, MdMenuBook, MdQrCodeScanner,
  MdAssessment, MdLogout, MdAdminPanelSettings, MdGroup
} from 'react-icons/md';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">📡</div>
        <h1>SmartAttend</h1>
        <span>QR Attendance System</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>

        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <MdDashboard className="nav-icon" />
          Dashboard
        </NavLink>

        <NavLink
          to="/mark-attendance"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <MdQrCodeScanner className="nav-icon" />
          Mark Attendance
        </NavLink>

        <NavLink
          to="/attendance-report"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <MdAssessment className="nav-icon" />
          Reports
        </NavLink>

        {user?.role === 'admin' && (
          <>
            <div className="nav-section-label" style={{ marginTop: 16 }}>Management</div>

            <NavLink
              to="/students"
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <MdPeople className="nav-icon" />
              Students
            </NavLink>

            <NavLink
              to="/subjects"
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <MdMenuBook className="nav-icon" />
              Subjects
            </NavLink>

            <NavLink
              to="/teachers"
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <MdGroup className="nav-icon" />
              Teachers
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div>
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <MdLogout /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
