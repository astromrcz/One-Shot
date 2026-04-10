import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppContext } from '../context/AppContext';
import { Palette, Eye, EyeOff, Lock, User, AlertTriangle } from 'lucide-react';
import logoImg from '@/app/assets/40eb82831843e17a3c48a360fd80f0aaaa58ddc8.png';

export function ArtistLogin() {
  const { artistLogin } = useAppContext();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const ok = artistLogin(username, password);
      if (ok) {
        navigate('/artist', { replace: true });
      } else {
        setError('Invalid credentials or account is not a Tattoo Artist.');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logoImg} alt="One Shot" className="h-14 mx-auto mb-3 object-contain" />
          <div className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 px-3 py-1.5 rounded-full mb-2">
            <Palette size={13} className="text-pink-400" />
            <span className="text-xs font-semibold text-pink-400 uppercase tracking-wider">Artist Portal</span>
          </div>
          <p className="text-neutral-500 text-sm">Sign in to manage your reservations</p>
        </div>

        {/* Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-neutral-400 mb-1.5 block font-medium">Username</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text" value={username} onChange={e => setUsername(e.target.value)} required autoFocus
                  placeholder="Your artist username"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-pink-600/50 focus:ring-1 focus:ring-pink-600/20 transition-colors placeholder-neutral-600"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-neutral-400 mb-1.5 block font-medium">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="Password"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-10 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-pink-600/50 focus:ring-1 focus:ring-pink-600/20 transition-colors placeholder-neutral-600"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-rose-950/30 border border-rose-800/40 text-rose-400 text-xs px-3 py-2.5 rounded-xl">
                <AlertTriangle size={13} /> {error}
              </div>
            )}

            <button type="submit" disabled={loading || !username || !password}
              className="w-full bg-pink-700 hover:bg-pink-600 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-900/30">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
                : <><Palette size={15} /> Sign In to Artist Portal</>
              }
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-neutral-800 text-center">
            <p className="text-xs text-neutral-600">Demo: <span className="text-neutral-400 font-mono">kiko / kiko123</span> or <span className="text-neutral-400 font-mono">mika / mika123</span></p>
          </div>
        </div>

        <p className="text-center text-xs text-neutral-700 mt-5">
          Not an artist?{' '}
          <button onClick={() => navigate('/staff/login')} className="text-neutral-500 hover:text-neutral-300 transition-colors">Staff Login</button>
          {' '}·{' '}
          <button onClick={() => navigate('/')} className="text-neutral-500 hover:text-neutral-300 transition-colors">Home</button>
        </p>
      </div>
    </div>
  );
}
