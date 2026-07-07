import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Loading from '@/components/ui/Loading';
import ProtectedRoute from './ProtectedRoute';

const Home = lazy(() => import('@/pages/competition/Home'));
const Hackathons = lazy(() => import('@/pages/competition/Hackathons'));
const HackathonDetail = lazy(() => import('@/pages/competition/HackathonDetail'));
const HackathonRegister = lazy(() => import('@/pages/competition/HackathonRegister'));
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const Leaderboard = lazy(() => import('@/pages/audience/Leaderboard'));
const ExpertReview = lazy(() => import('@/pages/admin/ExpertReview'));
const AdminScoring = lazy(() => import('@/pages/admin/AdminScoring'));
const MySubmissions = lazy(() => import('@/pages/player/MySubmissions'));
const PlayerCenter = lazy(() => import('@/pages/player/PlayerCenter'));
const ViewerCenter = lazy(() => import('@/pages/audience/ViewerCenter'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));

const AppRoutes = () => (
  <Suspense fallback={<Loading />}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/hackathons" element={<Hackathons />} />
        <Route path="/hackathons/:id" element={<HackathonDetail />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/viewer-center" element={<ViewerCenter />} />

        <Route
          path="/hackathons/:id/register"
          element={
            <ProtectedRoute>
              <HackathonRegister />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-submissions"
          element={
            <ProtectedRoute>
              <MySubmissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/player-center"
          element={
            <ProtectedRoute>
              <PlayerCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expert-review"
          element={
            <ProtectedRoute>
              <ExpertReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-scoring"
          element={
            <ProtectedRoute requireAdmin>
              <AdminScoring />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
