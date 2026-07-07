import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Users, Trophy, Calendar, ArrowRight, Code, Zap, Shield, Quote, Star, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/store';
import HackathonCard from '@/components/HackathonCard';
import slide0 from '@/picture/竞赛图片0.png';
import slide1 from '@/picture/竞赛图片1.png';
import slide2 from '@/picture/竞赛图片2.png';
import slide3 from '@/picture/竞赛图片3.png';
import slide4 from '@/picture/竞赛图片4.png';

const testimonials = [
  {
    name: '陈明远',
    role: '2025 AI创新大赛 冠军',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chen',
    content: '这个平台让我有机会与顶尖开发者同台竞技，专业评审和公平机制让每一份努力都得到了认可。',
  },
  {
    name: '林思琪',
    role: '连续参赛者',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lin',
    content: '从新手到获奖，平台提供了丰富的学习资源和社区支持，让我在竞赛中快速成长。',
  },
  {
    name: '王浩然',
    role: '技术评审专家',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wang',
    content: '作为评委，我见证了无数令人惊叹的创新项目。这个平台真正促进了技术的交流与进步。',
  },
];

const partners = [
  '阿里云', '腾讯云', '华为云', '字节跳动', '百度AI', '微软',
];

const heroSlides = [
  { src: slide0, alt: '竞赛横幅' },
  { src: slide1, alt: '竞赛图片 1' },
  { src: slide2, alt: '竞赛图片 2' },
  { src: slide3, alt: '竞赛图片 3' },
  { src: slide4, alt: '竞赛图片 4' },
];

export default function Home() {
  const { hackathons } = useAppStore();
  const featuredHackathons = hackathons.filter(h => h.status !== 'results_announced').slice(0, 3);

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    { icon: Users, label: '参赛选手', value: '10,000+' },
    { icon: Trophy, label: '举办竞赛', value: '500+' },
    { icon: Rocket, label: '优秀作品', value: '5,000+' },
    { icon: Calendar, label: '活跃社区', value: '50K+' },
  ];

  const features = [
    {
      icon: Zap,
      title: '快速入门',
      description: '简单注册，即刻参与各类精彩竞赛，开启你的创新之旅。',
    },
    {
      icon: Code,
      title: '技术交流',
      description: '与全球开发者交流分享，学习前沿技术，共同成长进步。',
    },
    {
      icon: Shield,
      title: '公平公正',
      description: '专业评审团队，透明评分机制，确保每一份努力都被看见。',
    },
  ];

  return (
    <div className="grid-bg">
      <section className="relative min-h-[600px] flex items-center overflow-hidden">
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {index === 0 ? (
              <div className="w-full h-full flex items-center justify-center bg-[#111827] relative">
                <div className="text-center max-w-2xl px-4 relative z-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700/50 mb-8">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs font-medium text-slate-300">2026 AI创新挑战赛即将开始</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                    探索技术创新的<span className="gradient-text">无限可能</span>
                  </h1>
                  <p className="text-sm text-slate-400 mb-10 max-w-lg mx-auto leading-relaxed">
                    加入全球最大的黑客松竞赛平台，与顶尖开发者一起，用代码改变世界。无论你是新手还是专家，这里都有属于你的舞台。
                  </p>
                  <Link
                    to="/hackathons"
                    className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium text-sm hover:opacity-90 transition-all shadow-lg shadow-blue-500/20"
                  >
                    浏览竞赛
                  </Link>
                </div>
              </div>
            ) : (
              <img
                src={slide.src}
                alt={slide.alt}
                className="w-full h-full object-contain"
              />
            )}
          </div>
        ))}

        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-cyan-600/10 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass-light flex items-center justify-center text-white hover:bg-white/10 transition-colors z-10"
          aria-label="上一张"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass-light flex items-center justify-center text-white hover:bg-white/10 transition-colors z-10"
          aria-label="下一张"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`切换到第${index + 1}张`}
            />
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="glass rounded-xl p-6 text-center card-hover"
              >
                <stat.icon className="w-10 h-10 mx-auto mb-4 text-blue-500" />
                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">
                为什么选择
                <span className="gradient-text"> Hackathon?</span>
              </h2>
              <p className="text-slate-400 mb-8">
                我们致力于打造最优质的竞赛体验，让每一位开发者都能充分发挥创造力，实现技术梦想。
              </p>
              <div className="space-y-6">
                {features.map((feature) => (
                  <div key={feature.title} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl btn-gradient flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                      <p className="text-slate-400 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-3xl blur-2xl" />
              <div className="relative glass rounded-3xl p-8">
                <div className="aspect-video rounded-2xl overflow-hidden mb-6">
                  <img
                    src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&h=675&fit=crop"
                    alt="Hackathon Event"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">2026 AI创新挑战赛</p>
                    <p className="text-slate-400 text-sm">8月1日 - 8月3日</p>
                  </div>
                  <Link
                    to="/hackathons/h1"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    了解详情
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">热门竞赛</h2>
              <p className="text-slate-400">参与最精彩的黑客松活动</p>
            </div>
            <Link
              to="/hackathons"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              查看全部
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredHackathons.map((hackathon) => (
              <HackathonCard key={hackathon.id} hackathon={hackathon} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-2">
              参赛者<span className="gradient-text">心声</span>
            </h2>
            <p className="text-slate-400">听听社区成员的真实评价</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="glass rounded-xl p-6 relative">
                <Quote className="w-8 h-8 text-blue-500/20 absolute top-4 right-4" />
                <div className="flex items-center gap-3 mb-4">
                  <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full bg-slate-700" />
                  <div>
                    <p className="text-white font-medium">{t.name}</p>
                    <p className="text-slate-500 text-sm">{t.role}</p>
                  </div>
                </div>
                <p className="text-slate-400 leading-relaxed">{t.content}</p>
                <div className="flex gap-1 mt-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">合作<span className="gradient-text">伙伴</span></h2>
            <p className="text-slate-400">与行业领先企业携手共建创新生态</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {partners.map((partner) => (
              <div
                key={partner}
                className="glass rounded-xl px-6 py-4 flex items-center gap-2 group hover:border-blue-500/30 transition-all"
              >
                <span className="text-lg font-semibold text-slate-300 group-hover:text-white transition-colors">{partner}</span>
                <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass rounded-3xl p-10 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              准备好开启你的
              <span className="gradient-text">创新之旅?</span>
            </h2>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
              加入我们的社区，与全球优秀开发者一起，在竞赛中成长，在创新中突破。
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-xl btn-gradient text-white font-semibold text-center hover:opacity-90 transition-all"
              >
                免费注册
              </Link>
              <Link
                to="/hackathons"
                className="w-full sm:w-auto px-8 py-4 rounded-xl border border-slate-600 text-white font-semibold text-center hover:bg-slate-800 transition-all"
              >
                浏览竞赛
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}