import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2, UserCheck, UserCircle, ShieldCheck, Star } from 'lucide-react';
import { useAppStore } from '@/store';
import loginBg from '@/picture/登录.jpg';

const DEMO_ACCOUNTS = [
  { label: '选手账号', email: 'zhangyu@example.com', password: 'demo123', icon: UserCheck, color: 'blue' },
  { label: '选手账号 (钱子云)', email: 'qianziyun@example.com', password: 'demo123', icon: UserCircle, color: 'cyan' },
  { label: '专家账号', email: 'zhang@expert.com', password: 'expert123', icon: Star, color: 'purple' },
  { label: '管理员账号', email: 'admin@hackathon.com', password: 'admin123', icon: ShieldCheck, color: 'yellow' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAppStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const success = login(email, password);
      setLoading(false);
      if (!success) {
        setError('邮箱或密码错误，请重试');
      }
    }, 600);
  };

  const handleDemoLogin = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setTimeout(() => {
      setLoading(true);
      setTimeout(() => {
        login(demoEmail, demoPassword);
        setLoading(false);
      }, 400);
    }, 100);
  };

  return (
    <div className="min-h-screen flex items-center py-12 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${loginBg})` }} />
      <div className="absolute inset-0 bg-black/60" />
      <div className="w-full max-w-md ml-[55%]">
        <div className="glass rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl btn-gradient flex items-center justify-center">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">欢迎回来</h1>
            <p className="text-slate-400">登录你的账户，继续探索</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 text-red-400 text-center flex items-center justify-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">邮箱地址</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl btn-gradient text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-400">
              还没有账户?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors">
                立即注册
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-slate-900 text-slate-500">快捷登录演示账号</span>
              </div>
            </div>
            <div className="grid gap-3">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.label}
                  onClick={() => handleDemoLogin(account.email, account.password)}
                  disabled={loading}
                  className={`flex items-center gap-3 p-3 rounded-xl border border-slate-700 hover:border-${account.color}-500/50 bg-slate-800/50 hover:bg-slate-800 transition-all text-left disabled:opacity-50 group`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-${account.color}-500/20 flex items-center justify-center group-hover:bg-${account.color}-500/30 transition-colors`}>
                    <account.icon className={`w-5 h-5 text-${account.color}-500`} />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{account.label}</p>
                    <p className="text-slate-500 text-xs">{account.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
