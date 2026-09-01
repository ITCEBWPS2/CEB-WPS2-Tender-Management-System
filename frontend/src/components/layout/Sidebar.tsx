import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Plus, Users, UserPlus, Building2, Download, LogOut, Menu, FolderOpen, Briefcase, Gavel, Shield, FileSearch } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;  
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const userRole = (user?.role || '').toLowerCase().trim();

  const getRolePrefix = (): string => {
    if (userRole === 'super admin' || userRole === 'admin') return '/admin';
    if (userRole === 'procurement') return '/procurement';
    if (userRole === 'cecom') return '/cecom';
    if (userRole === 'clerk') return '/clerk';
    return '/admin';
  };

  const prefix = getRolePrefix();

  const hasRoleAccess = (allowed: string[] | undefined) => {
    if (!allowed) return true; 
    return allowed.map(r => r.toLowerCase().trim()).includes(userRole);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // NAVIGATION CONFIGURATION - DYNAMIC ROLE PREFIXED PATHS
  const navItems = [{
    title: 'Dashboard',
    path: `${prefix}/dashboard`,
    icon: <LayoutDashboard className="w-5 h-5" />
  }, {
    title: 'Records',
    path: `${prefix}/records`,
    icon: <FileText className="w-5 h-5" />,
    allowedRoles: ['Admin', 'Super Admin', 'Procurement', 'CECOM', 'Clerk'],
    subItems: [{
      title: 'All Records',
      path: `${prefix}/records`,
      icon: <FileText className="w-4 h-4" />
    }, {
      title: 'Add Record',
      path: `${prefix}/records/add`,
      icon: <Plus className="w-4 h-4" />,
      allowedRoles: ['Admin', 'Super Admin', 'Procurement', 'CECOM', 'Clerk']
    }]
  }, {
    title: 'Categories',
    path: `${prefix}/categories`,
    icon: <FolderOpen className="w-5 h-5" />,
    allowedRoles: ['Admin', 'Super Admin', 'Procurement', 'Clerk', 'CECOM'],
    subItems: [{
      title: 'Category List',
      path: `${prefix}/categories`,
      icon: <FolderOpen className="w-4 h-4" />
    }, {
      title: 'Add Category',
      path: `${prefix}/categories/add`,
      icon: <Plus className="w-4 h-4" />,
      allowedRoles: ['Admin', 'Super Admin', 'Procurement', 'CECOM', 'Clerk']
    }]
  }, {
    title: 'Units',
    path: `${prefix}/departments`,
    icon: <Briefcase className="w-5 h-5" />,
    allowedRoles: ['Admin', 'Super Admin', 'Procurement', 'Clerk', 'CECOM'], 
    subItems: [{
      title: 'Unit List',
      path: `${prefix}/departments`,
      icon: <Briefcase className="w-4 h-4" />
    }, {
      title: 'Add Unit',
      path: `${prefix}/departments/add`,
      icon: <Plus className="w-4 h-4" />,
      allowedRoles: ['Admin', 'Super Admin', 'Procurement', 'CECOM', 'Clerk']
    }]
  }, {
    title: 'TEC Staff',
    path: `${prefix}/tec-staff`,
    icon: <Users className="w-5 h-5" />,
    allowedRoles: ['Admin', 'Super Admin', 'Procurement', 'Clerk', 'CECOM'], 
    subItems: [{
      title: 'Staff List',
      path: `${prefix}/tec-staff`,
      icon: <Users className="w-4 h-4" />
    }, {
      title: 'Add Staff',
      path: `${prefix}/tec-staff/add`,
      icon: <UserPlus className="w-4 h-4" />,
      allowedRoles: ['Admin', 'Super Admin', 'CECOM', 'Clerk']
    }]
  }, {
    title: 'Bidders',
    path: `${prefix}/bidders`,
    icon: <Building2 className="w-5 h-5" />,
    allowedRoles: ['Admin', 'Super Admin', 'Procurement', 'Clerk', 'CECOM'], 
    subItems: [{
      title: 'Supplier List',
      path: `${prefix}/bidders`,
      icon: <Building2 className="w-4 h-4" />
    }, {
      title: 'Add Supplier',
      path: `${prefix}/bidders/add`,
      icon: <Plus className="w-4 h-4" />,
      allowedRoles: ['Admin', 'Super Admin', 'Procurement', 'CECOM', 'Clerk']
    }]
  }, {
    title: 'TEC Committee',
    path: `${prefix}/bid-opening`,
    icon: <Gavel className="w-5 h-5" />,
    allowedRoles: ['Admin', 'Super Admin', 'Procurement', 'CECOM', 'Clerk'], 
    subItems: [{
      title: 'View All Committees',
      path: `${prefix}/bid-opening`,
      icon: <Gavel className="w-4 h-4" />
    }, {
      title: 'Add Committee',
      path: `${prefix}/bid-opening/add`,
      icon: <Plus className="w-4 h-4" />,
      allowedRoles: ['Admin', 'Super Admin', 'Procurement', 'CECOM', 'Clerk']
    }]
  }, {
    title: 'User Management',
    path: `${prefix}/users`,
    icon: <Shield className="w-5 h-5" />,
    allowedRoles: ['Admin', 'Super Admin', 'CECOM'],
    subItems: [{
      title: 'All Users',
      path: `${prefix}/users`,
      icon: <Shield className="w-4 h-4" />
    }, {
      title: 'Add User',
      path: `${prefix}/users/add`,
      icon: <UserPlus className="w-4 h-4" />
    }]
  }, {
    title: 'Audit Log',
    path: `${prefix}/audit-log`,
    icon: <FileSearch className="w-5 h-5" />,
    allowedRoles: ['Admin', 'Super Admin', 'CECOM']
  }, {
    title: 'Export',
    path: `${prefix}/export`,
    icon: <Download className="w-5 h-5" />
  }];

  const filteredNavItems = navItems
    .filter(item => hasRoleAccess(item.allowedRoles))
    .map(item => ({
      ...item,
      subItems: item.subItems?.filter(sub => hasRoleAccess(sub.allowedRoles))
    }));

  return <>
      <div className={`fixed inset-0 bg-black/50 z-20 lg:hidden transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)} />
      <aside className={`fixed top-0 left-0 z-30 h-screen w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static`}>
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950 flex-shrink-0">
          <span className="text-lg font-bold tracking-tight">Tender Management</span>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><Menu className="w-6 h-6" /></button>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {filteredNavItems.map(item => <div key={item.path} className="mb-2">
              {!item.subItems || item.subItems.length === 0 ? <NavLink to={item.path} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#bd5d2a] text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                  {item.icon} {item.title}
                </NavLink> : <div className="space-y-1">
                  <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.title}</div>
                  {item.subItems.map(subItem => <NavLink key={subItem.path} to={subItem.path} end className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ml-2 ${isActive ? 'bg-[#bd5d2a] text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                      {subItem.icon} {subItem.title}
                    </NavLink>)}
                </div>}
            </div>)}
        </nav>
        <div className="flex-shrink-0 border-t border-slate-800 p-4">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>
    </>;
}