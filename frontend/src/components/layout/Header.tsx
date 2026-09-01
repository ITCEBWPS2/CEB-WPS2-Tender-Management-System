import { Menu, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const { user } = useAuth();

  const name = user?.name || 'User';
  const email = user?.email || 'user@tec.gov';

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.endsWith('/dashboard') || path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/records')) return 'Records Management';
    if (path.includes('/categories')) return 'Category Management';
    if (path.includes('/departments')) return 'Department Management';
    if (path.includes('/tec-staff')) return 'TEC Staff';
    if (path.includes('/bidders')) return 'Supplier Management';
    if (path.includes('/bid-opening')) return 'TEC Committee';
    if (path.includes('/users')) return 'User Management';
    if (path.includes('/audit-log')) return 'Audit Log';
    if (path.includes('/export')) return 'Export Data';
    return 'Tender Management';
  };

  return <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-slate-800">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-900">{name}</p>
            <p className="text-xs text-slate-500">{email}</p>
          </div>
          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>;
}