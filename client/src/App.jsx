import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import TeacherDashboard from './pages/TeacherDashboard';
import CreateAssignment from './pages/CreateAssignment';
import AssignmentDetail from './pages/AssignmentDetail';
import StudentDashboard from './pages/StudentDashboard';
import SubmitAssignment from './pages/SubmitAssignment';
import GradingResult from './pages/GradingResult';
import { isNativeApp } from './utils/platform';
import { clearStoredAuth, getStoredAuth, persistAuth } from './utils/storage';

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

export const ConfirmContext = createContext(null);

export function useConfirm() {
  return useContext(ConfirmContext);
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

function ConfirmDialog({ dialog, onCancel, onConfirm }) {
  if (!dialog) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-dialog-title" className="confirm-title">
          {dialog.title}
        </h3>
        <p className="confirm-message">{dialog.message}</p>
        <div className="confirm-actions">
          <button className="btn btn-ghost btn-lg" type="button" onClick={onCancel}>
            {dialog.cancelText}
          </button>
          <button
            className={`btn ${dialog.tone === 'danger' ? 'btn-danger' : 'btn-primary'} btn-lg`}
            type="button"
            onClick={onConfirm}
          >
            {dialog.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const confirmResolverRef = useRef(null);
  const Router = isNativeApp() ? HashRouter : BrowserRouter;

  useEffect(() => {
    let active = true;

    const restoreAuth = async () => {
      const stored = await getStoredAuth();
      if (active && stored?.user) {
        setUser(stored.user);
      }
      if (active) {
        setLoading(false);
      }
    };

    void restoreAuth();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => () => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(false);
      confirmResolverRef.current = null;
    }
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    void persistAuth(userData, token);
  };

  const logout = () => {
    setUser(null);
    void clearStoredAuth();
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const closeConfirmDialog = (result) => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(result);
      confirmResolverRef.current = null;
    }
    setConfirmDialog(null);
  };

  const showConfirm = (options = {}) => new Promise((resolve) => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(false);
    }

    confirmResolverRef.current = resolve;
    setConfirmDialog({
      title: options.title || '请确认操作',
      message: options.message || '确定继续吗？',
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      tone: options.tone || 'primary',
    });
  });

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
        <ConfirmContext.Provider value={showConfirm}>
          <Router>
            <Toast toast={toast} onClose={() => setToast(null)} />
            <ConfirmDialog
              dialog={confirmDialog}
              onCancel={() => closeConfirmDialog(false)}
              onConfirm={() => closeConfirmDialog(true)}
            />
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
          </Router>
        </ConfirmContext.Provider>
      </ToastContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
