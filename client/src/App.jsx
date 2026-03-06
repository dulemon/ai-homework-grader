import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import TeacherDashboard from './pages/TeacherDashboard';
import CreateAssignment from './pages/CreateAssignment';
import AssignmentDetail from './pages/AssignmentDetail';
import StudentDashboard from './pages/StudentDashboard';
import SubmitAssignment from './pages/SubmitAssignment';
import GradingResult from './pages/GradingResult';

// Auth Context
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// Toast Context
export const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className={`toast toast-${toast.type}`}>
      <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
      <span>{toast.message}</span>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Check for stored auth
    const stored = localStorage.getItem('hw-auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
      } catch {
        localStorage.removeItem('hw-auth');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('hw-auth', JSON.stringify({ user: userData, token }));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hw-auth');
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <ToastContext.Provider value={showToast}>
        <BrowserRouter>
          <Toast toast={toast} onClose={() => setToast(null)} />
          <Routes>
            <Route path="/login" element={user ? <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} /> : <Login />} />
            <Route path="/teacher" element={user?.role === 'teacher' ? <TeacherDashboard /> : <Navigate to="/login" />} />
            <Route path="/teacher/assignment/new" element={user?.role === 'teacher' ? <CreateAssignment /> : <Navigate to="/login" />} />
            <Route path="/teacher/assignment/:id" element={user?.role === 'teacher' ? <AssignmentDetail /> : <Navigate to="/login" />} />
            <Route path="/student" element={user?.role === 'student' ? <StudentDashboard /> : <Navigate to="/login" />} />
            <Route path="/student/assignment/:id" element={user?.role === 'student' ? <SubmitAssignment /> : <Navigate to="/login" />} />
            <Route path="/grading/:id" element={user ? <GradingResult /> : <Navigate to="/login" />} />
            <Route path="*" element={<Navigate to={user ? (user.role === 'teacher' ? '/teacher' : '/student') : '/login'} />} />
          </Routes>
        </BrowserRouter>
      </ToastContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
