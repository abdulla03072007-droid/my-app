import { useAuth } from '../context/AuthContext';

const Navbar = ({ title, subtitle }) => {
  const { user } = useAuth();

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <header className="navbar">
      <div>
        <div className="navbar-title">{title}</div>
        {subtitle && <div className="navbar-subtitle">{subtitle}</div>}
      </div>
      <div className="navbar-right">
        <span className="text-sm text-muted">{dateStr}</span>
        <span className={`badge badge-${user?.role}`}>
          {user?.role === 'admin' ? '🛡️' : '👤'} {user?.role}
        </span>
      </div>
    </header>
  );
};

export default Navbar;
