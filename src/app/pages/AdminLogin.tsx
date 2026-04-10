import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppContext } from '../context/AppContext';
import { Lock, User, Eye, EyeOff, LogIn, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import logoImg from '@/app/assets/40eb82831843e17a3c48a360fd80f0aaaa58ddc8.png';

export function AdminLogin() {
  const { adminLogin } = useAppContext();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '', showPw: false, error: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!form.username || !form.password) {
      setForm(f => ({ ...f, error: 'Please enter your credentials.' }));
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const ok = adminLogin(form.username, form.password);
      if (!ok) {
        setForm(f => ({ ...f, error: 'Invalid admin credentials.', password: '' }));
        setLoading(false);
        return;
      }
      navigate('/admin');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-amber-900/20">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
          <ArrowLeft size={14} /> Back to Homepage
        </button>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[10px] text-amber-600/80 uppercase tracking-widest font-semibold">Admin Portal</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="relative inline-flex mb-5">
              <img src={logoImg} alt="One Shot Bar" className="w-28 h-28 object-contain rounded-3xl" />
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-amber-900/40 border-2 border-neutral-950 flex items-center justify-center">
                <ShieldCheck size={13} className="text-amber-400" />
              </div>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">One Shot Bar</h1>
            <p className="text-neutral-500 text-sm mt-1">Administrator Portal</p>
          </div>

          <div className="bg-neutral-900 border border-amber-900/30 rounded-2xl p-7 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-base font-bold text-white">Admin Sign In</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Restricted to authorized administrators only</p>
            </div>

            {form.error && (
              <div className="flex items-center gap-2.5 bg-rose-950/50 border border-rose-800/50 text-rose-400 text-xs px-3.5 py-3 rounded-xl mb-5">
                <AlertCircle size={14} className="flex-shrink-0" />
                {form.error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5 font-medium">Username</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                  <input
                    type="text" value={form.username} autoFocus
                    onChange={e => setForm(f => ({ ...f, username: e.target.value, error: '' }))}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="w-full bg-neutral-800 border border-neutral-700 text-sm text-white placeholder-neutral-600 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-amber-600/70 focus:ring-1 focus:ring-amber-600/20 transition-all"
                    placeholder="Admin username"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5 font-medium">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                  <input
                    type={form.showPw ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value, error: '' }))}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="w-full bg-neutral-800 border border-neutral-700 text-sm text-white placeholder-neutral-600 pl-10 pr-11 py-3 rounded-xl focus:outline-none focus:border-amber-600/70 focus:ring-1 focus:ring-amber-600/20 transition-all"
                    placeholder="••••••••"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setForm(f => ({ ...f, showPw: !f.showPw }))}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors">
                    {form.showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading}
              className="mt-6 w-full bg-amber-600 hover:bg-amber-500 disabled:bg-amber-900 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-950">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Authenticating...</>
              ) : (
                <><LogIn size={15} /> Sign In to Admin Panel</>
              )}
            </button>

            <div className="mt-5 bg-amber-950/20 rounded-xl p-3 border border-amber-900/20">
              <p className="text-[11px] text-amber-700/80 text-center leading-relaxed">
                Demo:&nbsp;<span className="text-amber-500 font-medium">admin</span>&nbsp;/&nbsp;<span className="text-amber-500 font-medium">admin123</span>
              </p>
            </div>
          </div>

          <div className="mt-4 text-center">
            <button onClick={() => navigate('/staff/login')} className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
              Staff Login →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
