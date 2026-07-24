import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/layouts/MainLayout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import AllLinks from '@/pages/AllLinks';
import Favorites from '@/pages/Favorites';
import Collections from '@/pages/Collections';
import GraphPage from '@/pages/GraphPage';
import ReadLater from '@/pages/ReadLater';
import Archive from '@/pages/Archive';
import Trash from '@/pages/Trash';
import Settings from '@/pages/Settings';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="links" element={<AllLinks />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="collections" element={<Collections />} />
        <Route path="collections/:id" element={<AllLinks />} />
        <Route path="graph" element={<GraphPage />} />
        <Route path="read-later" element={<ReadLater />} />
        <Route path="archive" element={<Archive />} />
        <Route path="trash" element={<Trash />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
