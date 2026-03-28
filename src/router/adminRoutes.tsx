import { Navigate, Outlet, Route } from 'react-router-dom';
import AdminRoute from '@/components/AdminRoute';
import UserManagement from '@/pages/Admin/UserManagement';
import ModelManagement from '@/pages/Admin/ModelManagement';

export function getAdminRoutes() {
  return (
    <Route
      path="admin"
      element={
        <AdminRoute>
          <Outlet />
        </AdminRoute>
      }
    >
      <Route index element={<Navigate to="users" replace />} />
      <Route path="users" element={<UserManagement />} />
      <Route path="models" element={<ModelManagement />} />
    </Route>
  );
}
