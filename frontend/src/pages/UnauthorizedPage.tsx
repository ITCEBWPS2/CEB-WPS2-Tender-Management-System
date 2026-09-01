import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user, logout, getRoleHomeRoute } = useAuth();

  const handleReturnHome = () => {
    if (user && user.role) {
      navigate(getRoleHomeRoute(user.role));
    } else {
      navigate('/login');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden text-center p-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
        <p className="text-slate-600 mb-6 text-sm">
          You do not have permission to access this page. Your current role is{' '}
          <span className="font-semibold text-slate-900">{user?.role || 'Guest'}</span>.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleReturnHome} className="flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Go to My Dashboard
          </Button>
          <Button variant="outline" onClick={handleLogout} className="flex items-center justify-center gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
