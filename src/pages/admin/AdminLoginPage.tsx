import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { ShieldCheck, Lock, Mail, ArrowRight, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAdmin();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@shanmukha.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/fas');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const success = login(email, password);
      setIsLoading(false);
      if (success) {
        navigate('/admin/fas');
      } else {
        setError('Invalid credentials. Use admin@shanmukha.com / admin123');
      }
    }, 400);
  };

  const handleFillDemo = () => {
    setEmail('admin@shanmukha.com');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 flex flex-col justify-center items-center p-4">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white shadow-xl shadow-emerald-900/40 mb-4 ring-4 ring-emerald-500/20">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SHANMUKHA AGRITEC</h1>
          <p className="text-xs uppercase tracking-widest font-semibold text-emerald-400 mt-1">
            Head Office Field Intelligence Portal
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-100 p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Enterprise Sign In</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized supervisory access for Field Operations & Agronomy Leadership.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Head Office Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@shanmukha.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all font-medium text-slate-900"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase">Password</label>
                <span className="text-[11px] text-emerald-600 font-semibold cursor-pointer hover:underline" onClick={handleFillDemo}>
                  Demo auto-fill
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all font-medium text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Access Command Center</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Pill */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Official Demo Credentials
            </div>
            <div className="flex justify-between items-center font-mono text-[11px] pt-1 border-t border-slate-200">
              <span className="text-slate-500 font-sans">Email:</span>
              <strong className="text-slate-800">admin@shanmukha.com</strong>
            </div>
            <div className="flex justify-between items-center font-mono text-[11px]">
              <span className="text-slate-500 font-sans">Password:</span>
              <strong className="text-slate-800">admin123</strong>
            </div>
          </div>
        </div>

        {/* Switcher back to Mobile App */}
        <div className="text-center mt-6">
          <Link
            to="/mobile"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-emerald-300 hover:text-white text-xs font-semibold backdrop-blur-sm transition-all border border-white/10"
          >
            <Smartphone className="w-4 h-4" />
            Switch to Field Assistant Mobile Demo
          </Link>
        </div>
      </div>
    </div>
  );
};
