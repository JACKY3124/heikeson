import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Loading from '@/components/ui/Loading';

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
      {/* 公开路由 - 无 Layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* 带 Layout 的路由 */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/hackathons" element={<Hackathons />} />
        <Route path="/hackathons/:id" element={<HackathonDetail />} />
        <Route path="/hackathons/:id/register" element={<HackathonRegister />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/expert-review" element={<ExpertReview />} />
        <Route path="/admin-scoring" element={<AdminScoring />} />
        <Route path="/my-submissions" element={<MySubmissions />} />
        <Route path="/player-center" element={<PlayerCenter />} />
        <Route path="/viewer-center" element={<ViewerCenter />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Route>

      {/* 404 重定向 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
