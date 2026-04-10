import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppContext } from '../context/AppContext';
import { Lock, User, Eye, EyeOff, LogIn, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import logoImg from '@/app/assets/40eb82831843e17a3c48a360fd80f0aaaa58ddc8.png';

export function StaffLogin() {
  const { staffLogin } = useAppContext();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', showPw: false, error: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!form.username || !form.password) {
      setForm(f => ({ ...f, error: 'Please enter your username and password.' }));
      return;
    }
    setLoading(true);
    // Simulate a brief auth delay for realism
    setTimeout(() => {
      const success = staffLogin(form.username, form.password);
      if (!success) {
        setForm(f => ({ ...f, error: 'Invalid credentials. Please try again.', password: '' }));
        setLoading(false);
        return;
      }
      navigate('/staff');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/50">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Homepage
        </button>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-neutral-600 uppercase tracking-widest font-semibold">Staff Portal</span>
        </div>
      </div>

      {/* Center content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo & Branding */}
          <div className="text-center mb-8">
            <div className="relative inline-flex mb-5">
              <img
                src={logoImg}
                alt="One Shot Bar & Billiards"
                className="w-28 h-28 object-contain rounded-3xl"
              />
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-neutral-800 border-2 border-neutral-950 flex items-center justify-center">
                <Shield size={13} className="text-emerald-400" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">One Shot Bar</h1>
            <p className="text-neutral-500 text-sm mt-1">&amp; Billiards · Staff Management Portal</p>
          </div>

          {/* Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-7 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-base font-bold text-white">Sign In to Dashboard</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Authorized personnel only</p>
            </div>

            {form.error && (
              <div className="flex items-center gap-2.5 bg-rose-950/50 border border-rose-800/50 text-rose-400 text-xs px-3.5 py-3 rounded-xl mb-5">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{form.error}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5 font-medium">Username</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                  <input
                    type="text"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value, error: '' }))}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="w-full bg-neutral-800 border border-neutral-700 text-sm text-white placeholder-neutral-600 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-emerald-600/70 focus:ring-1 focus:ring-emerald-600/20 transition-all"
                    placeholder="Enter username"
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5 font-medium">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                  <input
                    type={form.showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value, error: '' }))}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="w-full bg-neutral-800 border border-neutral-700 text-sm text-white placeholder-neutral-600 pl-10 pr-11 py-3 rounded-xl focus:outline-none focus:border-emerald-600/70 focus:ring-1 focus:ring-emerald-600/20 transition-all"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, showPw: !f.showPw }))}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                    tabIndex={-1}
                  >
                    {form.showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <LogIn size={15} />
                  Sign In
                </>
              )}
            </button>

            {/* Hint */}
            <div className="mt-5 bg-neutral-800/50 rounded-xl p-3 border border-neutral-700/50">
              <p className="text-[11px] text-neutral-600 text-center leading-relaxed">
                Demo credentials:&nbsp;
                <span className="text-neutral-400 font-medium">admin</span>
                &nbsp;/&nbsp;
                <span className="text-neutral-400 font-medium">admin123</span>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-neutral-700 mt-6">
            One Shot Bar &amp; Billiards Management System · Staff Portal
          </p>
        </div>
      </div>
    </div>
  );
}