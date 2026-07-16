import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DealerList from './pages/dealers/DealerList.jsx';
import DealerForm from './pages/dealers/DealerForm.jsx';
import DealerDetails from './pages/dealers/DealerDetails.jsx';
import OwnerList from './pages/owners/OwnerList.jsx';
import OwnerForm from './pages/owners/OwnerForm.jsx';
import OwnerDetails from './pages/owners/OwnerDetails.jsx';
import TenantList from './pages/tenants/TenantList.jsx';
import TenantForm from './pages/tenants/TenantForm.jsx';
import TenantDetails from './pages/tenants/TenantDetails.jsx';
import UserList from './pages/users/UserList.jsx';
import UserForm from './pages/users/UserForm.jsx';
import UserDetails from './pages/users/UserDetails.jsx';

// Placeholder page for sections not yet built
function PlaceholderPage({ title }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-10 py-14 shadow-sm max-w-sm w-full">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
          <span className="text-2xl">🚧</span>
        </div>
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        <p className="mt-1.5 text-sm text-gray-500">This section is under construction.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected admin shell */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="properties"   element={<PlaceholderPage title="Properties" />} />
            <Route path="projects"     element={<PlaceholderPage title="Projects" />} />

            {/* ── Users ── */}
            <Route path="users"          element={<UserList />} />
            <Route path="users/new"      element={<UserForm />} />
            <Route path="users/:id"      element={<UserDetails />} />
            <Route path="users/:id/edit" element={<UserForm />} />

            {/* ── Dealers ── */}
            <Route path="dealers"          element={<DealerList />} />
            <Route path="dealers/new"      element={<DealerForm />} />
            <Route path="dealers/:id"      element={<DealerDetails />} />
            <Route path="dealers/:id/edit" element={<DealerForm />} />

            {/* ── Owners ── */}
            <Route path="owners"          element={<OwnerList />} />
            <Route path="owners/new"      element={<OwnerForm />} />
            <Route path="owners/:id"      element={<OwnerDetails />} />
            <Route path="owners/:id/edit" element={<OwnerForm />} />

            {/* ── Tenants ── */}
            <Route path="tenants"          element={<TenantList />} />
            <Route path="tenants/new"      element={<TenantForm />} />
            <Route path="tenants/:id"      element={<TenantDetails />} />
            <Route path="tenants/:id/edit" element={<TenantForm />} />

            <Route path="verification"  element={<PlaceholderPage title="Verification Requests" />} />
            <Route path="legal"         element={<PlaceholderPage title="Legal Requests" />} />
            <Route path="rent"          element={<PlaceholderPage title="Rent" />} />
            <Route path="notifications" element={<PlaceholderPage title="Notifications" />} />
            <Route path="reports"       element={<PlaceholderPage title="Reports" />} />
            <Route path="settings"      element={<PlaceholderPage title="Settings" />} />
          </Route>

          {/* Catch-all */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
