import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { DashboardPage } from './pages/DashboardPage';
import { RecordsPage } from './pages/RecordsPage';
import { AddEditRecordPage } from './pages/AddEditRecordPage';
import { ViewRecordPage } from './pages/ViewRecordPage';
import { CategoryListPage } from './pages/CategoryListPage';
import { AddEditCategoryPage } from './pages/AddEditCategoryPage';
import { DepartmentListPage } from './pages/DepartmentListPage';
import { AddEditDepartmentPage } from './pages/AddEditDepartmentPage';
import { ExportPage } from './pages/ExportPage';
import { TecStaffPage } from './pages/TecStaffPage';
import { AddEditStaffPage } from './pages/AddEditStaffPage';
import { BidderListPage } from './pages/BidderListPage';
import { AddEditBidderPage } from './pages/AddEditBidderPage';
import { BidOpeningCommitteePage } from './pages/BidOpeningCommitteePage';
import { AddEditCommitteePage } from './pages/AddEditCommitteePage';
import { UserManagementPage } from './pages/UserManagementPage';
import { AddEditUserPage } from './pages/AddEditUserPage';
import { AuditLogPage } from './pages/AuditLogPage';

// Component to handle root / and un-prefixed redirects to role home route
function RootRedirect() {
  const { isAuthenticated, user, getRoleHomeRoute } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={getRoleHomeRoute(user.role)} replace />;
}

export function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Root & un-prefixed fallback redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* 1. ADMIN SHELL (/admin/*) -> Admin & Super Admin roles */}
          <Route element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']} />}>
            <Route path="/admin/dashboard" element={<DashboardPage />} />
            <Route path="/admin/records" element={<RecordsPage />} />
            <Route path="/admin/records/add" element={<AddEditRecordPage />} />
            <Route path="/admin/records/edit/:id" element={<AddEditRecordPage />} />
            <Route path="/admin/records/view/:id" element={<ViewRecordPage />} />
            <Route path="/admin/categories" element={<CategoryListPage />} />
            <Route path="/admin/categories/add" element={<AddEditCategoryPage />} />
            <Route path="/admin/categories/edit/:id" element={<AddEditCategoryPage />} />
            <Route path="/admin/departments" element={<DepartmentListPage />} />
            <Route path="/admin/departments/add" element={<AddEditDepartmentPage />} />
            <Route path="/admin/departments/edit/:id" element={<AddEditDepartmentPage />} />
            <Route path="/admin/tec-staff" element={<TecStaffPage />} />
            <Route path="/admin/tec-staff/add" element={<AddEditStaffPage />} />
            <Route path="/admin/tec-staff/edit/:id" element={<AddEditStaffPage />} />
            <Route path="/admin/bidders" element={<BidderListPage />} />
            <Route path="/admin/bidders/add" element={<AddEditBidderPage />} />
            <Route path="/admin/bidders/edit/:id" element={<AddEditBidderPage />} />
            <Route path="/admin/bid-opening" element={<BidOpeningCommitteePage />} />
            <Route path="/admin/bid-opening/add" element={<AddEditCommitteePage />} />
            <Route path="/admin/bid-opening/edit/:id" element={<AddEditCommitteePage />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/users/add" element={<AddEditUserPage />} />
            <Route path="/admin/users/edit/:id" element={<AddEditUserPage />} />
            <Route path="/admin/audit-log" element={<AuditLogPage />} />
            <Route path="/admin/export" element={<ExportPage />} />
          </Route>

          {/* 2. PROCUREMENT SHELL (/procurement/*) -> Procurement role */}
          <Route element={<ProtectedRoute allowedRoles={['Procurement']} />}>
            <Route path="/procurement/dashboard" element={<DashboardPage />} />
            <Route path="/procurement/records" element={<RecordsPage />} />
            <Route path="/procurement/records/add" element={<AddEditRecordPage />} />
            <Route path="/procurement/records/edit/:id" element={<AddEditRecordPage />} />
            <Route path="/procurement/records/view/:id" element={<ViewRecordPage />} />
            <Route path="/procurement/categories" element={<CategoryListPage />} />
            <Route path="/procurement/categories/add" element={<AddEditCategoryPage />} />
            <Route path="/procurement/categories/edit/:id" element={<AddEditCategoryPage />} />
            <Route path="/procurement/departments" element={<DepartmentListPage />} />
            <Route path="/procurement/departments/add" element={<AddEditDepartmentPage />} />
            <Route path="/procurement/departments/edit/:id" element={<AddEditDepartmentPage />} />
            <Route path="/procurement/tec-staff" element={<TecStaffPage />} />
            <Route path="/procurement/bidders" element={<BidderListPage />} />
            <Route path="/procurement/bidders/add" element={<AddEditBidderPage />} />
            <Route path="/procurement/bidders/edit/:id" element={<AddEditBidderPage />} />
            <Route path="/procurement/bid-opening" element={<BidOpeningCommitteePage />} />
            <Route path="/procurement/bid-opening/add" element={<AddEditCommitteePage />} />
            <Route path="/procurement/bid-opening/edit/:id" element={<AddEditCommitteePage />} />
            <Route path="/procurement/export" element={<ExportPage />} />
          </Route>

          {/* 3. CECOM SHELL (/cecom/*) -> CECOM role */}
          <Route element={<ProtectedRoute allowedRoles={['CECOM']} />}>
            <Route path="/cecom/dashboard" element={<DashboardPage />} />
            <Route path="/cecom/records" element={<RecordsPage />} />
            <Route path="/cecom/records/add" element={<AddEditRecordPage />} />
            <Route path="/cecom/records/edit/:id" element={<AddEditRecordPage />} />
            <Route path="/cecom/records/view/:id" element={<ViewRecordPage />} />
            <Route path="/cecom/categories" element={<CategoryListPage />} />
            <Route path="/cecom/categories/add" element={<AddEditCategoryPage />} />
            <Route path="/cecom/categories/edit/:id" element={<AddEditCategoryPage />} />
            <Route path="/cecom/departments" element={<DepartmentListPage />} />
            <Route path="/cecom/departments/add" element={<AddEditDepartmentPage />} />
            <Route path="/cecom/departments/edit/:id" element={<AddEditDepartmentPage />} />
            <Route path="/cecom/tec-staff" element={<TecStaffPage />} />
            <Route path="/cecom/tec-staff/add" element={<AddEditStaffPage />} />
            <Route path="/cecom/tec-staff/edit/:id" element={<AddEditStaffPage />} />
            <Route path="/cecom/bidders" element={<BidderListPage />} />
            <Route path="/cecom/bidders/add" element={<AddEditBidderPage />} />
            <Route path="/cecom/bidders/edit/:id" element={<AddEditBidderPage />} />
            <Route path="/cecom/bid-opening" element={<BidOpeningCommitteePage />} />
            <Route path="/cecom/bid-opening/add" element={<AddEditCommitteePage />} />
            <Route path="/cecom/bid-opening/edit/:id" element={<AddEditCommitteePage />} />
            <Route path="/cecom/users" element={<UserManagementPage />} />
            <Route path="/cecom/users/add" element={<AddEditUserPage />} />
            <Route path="/cecom/users/edit/:id" element={<AddEditUserPage />} />
            <Route path="/cecom/audit-log" element={<AuditLogPage />} />
            <Route path="/cecom/export" element={<ExportPage />} />
          </Route>

          {/* 4. CLERK SHELL (/clerk/*) -> Clerk role */}
          <Route element={<ProtectedRoute allowedRoles={['Clerk']} />}>
            <Route path="/clerk/dashboard" element={<DashboardPage />} />
            <Route path="/clerk/records" element={<RecordsPage />} />
            <Route path="/clerk/records/add" element={<AddEditRecordPage />} />
            <Route path="/clerk/records/edit/:id" element={<AddEditRecordPage />} />
            <Route path="/clerk/records/view/:id" element={<ViewRecordPage />} />
            <Route path="/clerk/categories" element={<CategoryListPage />} />
            <Route path="/clerk/categories/add" element={<AddEditCategoryPage />} />
            <Route path="/clerk/categories/edit/:id" element={<AddEditCategoryPage />} />
            <Route path="/clerk/departments" element={<DepartmentListPage />} />
            <Route path="/clerk/departments/add" element={<AddEditDepartmentPage />} />
            <Route path="/clerk/departments/edit/:id" element={<AddEditDepartmentPage />} />
            <Route path="/clerk/tec-staff" element={<TecStaffPage />} />
            <Route path="/clerk/tec-staff/add" element={<AddEditStaffPage />} />
            <Route path="/clerk/tec-staff/edit/:id" element={<AddEditStaffPage />} />
            <Route path="/clerk/bidders" element={<BidderListPage />} />
            <Route path="/clerk/bidders/add" element={<AddEditBidderPage />} />
            <Route path="/clerk/bidders/edit/:id" element={<AddEditBidderPage />} />
            <Route path="/clerk/bid-opening" element={<BidOpeningCommitteePage />} />
            <Route path="/clerk/bid-opening/add" element={<AddEditCommitteePage />} />
            <Route path="/clerk/bid-opening/edit/:id" element={<AddEditCommitteePage />} />
            <Route path="/clerk/export" element={<ExportPage />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}