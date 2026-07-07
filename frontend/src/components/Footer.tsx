import { Link } from 'react-router-dom';
import { Trophy, Github, Twitter, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg btn-gradient flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Hackathon</span>
            </Link>
            <p className="text-slate-400 mb-4 max-w-md">
              全球领先的黑客松竞赛平台，汇聚顶尖开发者，共同探索技术创新的无限可能。
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full glass-light flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full glass-light flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full glass-light flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full glass-light flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">快速链接</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-slate-400 hover:text-white transition-colors">
                  首页
                </Link>
              </li>
              <li>
                <Link to="/hackathons" className="text-slate-400 hover:text-white transition-colors">
                  竞赛列表
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-slate-400 hover:text-white transition-colors">
                  排行榜
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">支持</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  帮助中心
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  常见问题
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  联系我们
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  隐私政策
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-slate-500">
          <p>&copy; 2026 Hackathon Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}