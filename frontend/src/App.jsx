import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Subjects from './pages/Subjects';
import Teachers from './pages/Teachers';
import MarkAttendance from './pages/MarkAttendance';
import AttendanceReport from './pages/AttendanceReport';

const Layout = ({ children }) => (
  <div className="app-layout">
    <Sidebar />
    <div className="main-content">{children}</div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/mark-attendance" element={
            <ProtectedRoute>
              <Layout><MarkAttendance /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/attendance-report" element={
            <ProtectedRoute>
              <Layout><AttendanceReport /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/students" element={
            <ProtectedRoute adminOnly>
              <Layout><Students /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/subjects" element={
            <ProtectedRoute adminOnly>
              <Layout><Subjects /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/teachers" element={
            <ProtectedRoute adminOnly>
              <Layout><Teachers /></Layout>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
