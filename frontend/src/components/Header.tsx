import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Trophy, LogOut, User, Star, FileText, Shield } from 'lucide-react';
import { useAppStore } from '@/store';
import type { UserRole } from '@/types';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, userRole, logout } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const baseNavLinks = [
    { name: '首页', path: '/' },
    { name: '竞赛', path: '/hackathons' },
    { name: '排行榜', path: '/leaderboard' },
    { name: '观众', path: '/viewer-center' },
  ];

  const roleNavLinks: Partial<Record<UserRole, { name: string; path: string; icon: any }[]>> = {
    player: [
      { name: '选手中心', path: '/player-center', icon: User },
      { name: '我的提交', path: '/my-submissions', icon: FileText },
    ],
    expert: [
      { name: '专家评审', path: '/expert-review', icon: Star },
    ],
    admin: [
      { name: '管理员后台', path: '/admin-dashboard', icon: Shield },
    ],
  };

  const navLinks = [
    ...baseNavLinks,
    ...(roleNavLinks[userRole] || []),
  ];

  const getRoleBadge = () => {
    switch (userRole) {
      case 'player':
        return { label: '选手', color: 'bg-blue-500/20 text-blue-400' };
      case 'expert':
        return { label: '专家', color: 'bg-purple-500/20 text-purple-400' };
      case 'admin':
        return { label: '管理员', color: 'bg-red-500/20 text-red-400' };
      default:
        return null;
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg btn-gradient flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Hackathon</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-slate-300 hover:text-white transition-colors relative group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 glass-light rounded-full px-4 py-2">
                  <img
                    src={user?.avatar}
                    alt={user?.name}
                    className="w-8 h-8 rounded-full"
                  />
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{user?.name}</span>
                        {roleBadge && (
                          <span className={`px-2 py-0.5 rounded text-xs ${roleBadge.color}`}>
                            {roleBadge.label}
                          </span>
                        )}
                      </div>
                    </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>退出</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 rounded-lg btn-gradient text-white font-medium hover:opacity-90 transition-opacity"
                >
                  注册
                </Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden p-2 text-slate-300 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 glass rounded-xl p-4">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-slate-300 hover:text-white transition-colors py-2 flex items-center gap-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name === '专家评审' && <Star className="w-4 h-4" />}
                  {link.name === '我的提交' && <FileText className="w-4 h-4" />}
                  {link.name === '选手中心' && <User className="w-4 h-4" />}
                  {link.name === '管理员后台' && <Shield className="w-4 h-4" />}
                  <span>{link.name}</span>
                </Link>
              ))}
              {isAuthenticated ? (
                <div className="flex flex-col gap-3 pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-3">
                    <img
                      src={user?.avatar}
                      alt={user?.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {user?.name}
                        {roleBadge && (
                          <span className={`px-2 py-0.5 rounded text-xs ${roleBadge.color}`}>
                            {roleBadge.label}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-slate-400">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>退出</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pt-4 border-t border-slate-700">
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-2 py-2 text-slate-300 hover:text-white transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>登录</span>
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2 rounded-lg btn-gradient text-white font-medium text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    注册
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
