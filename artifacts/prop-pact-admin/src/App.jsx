import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';

// Page-level code splitting — each group loads only when its route is visited
const Login       = lazy(() => import('./pages/Login.jsx'));
const Dashboard   = lazy(() => import('./pages/Dashboard.jsx'));
const DealerList    = lazy(() => import('./pages/dealers/DealerList.jsx'));
const DealerForm    = lazy(() => import('./pages/dealers/DealerForm.jsx'));
const DealerDetails = lazy(() => import('./pages/dealers/DealerDetails.jsx'));
const OwnerList     = lazy(() => import('./pages/owners/OwnerList.jsx'));
const OwnerForm     = lazy(() => import('./pages/owners/OwnerForm.jsx'));
const OwnerDetails  = lazy(() => import('./pages/owners/OwnerDetails.jsx'));
const TenantList    = lazy(() => import('./pages/tenants/TenantList.jsx'));
const TenantForm    = lazy(() => import('./pages/tenants/TenantForm.jsx'));
const TenantDetails = lazy(() => import('./pages/tenants/TenantDetails.jsx'));
const UserList      = lazy(() => import('./pages/users/UserList.jsx'));
const UserForm      = lazy(() => import('./pages/users/UserForm.jsx'));
const UserDetails   = lazy(() => import('./pages/users/UserDetails.jsx'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
    </div>
  );
}

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
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
