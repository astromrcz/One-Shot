import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../utils/supabase/client';
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import logoImg from '@/app/assets/40eb82831843e17a3c48a360fd80f0aaaa58ddc8.png';

export function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Supabase automatically parses the recovery token from the URL when this page loads.
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Just in case, ensure no residual session conflicts
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    if (password !== confirm) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    
    // Updates the password for the user recovered via the emailed link
    const { error: updateError } = await supabase.auth.updateUser({ password });
    
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      // Force sign out so they can log in freshly on the homepage
      await supabase.auth.signOut();
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Password Reset!</h2>
          <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
            Your password has been successfully updated. You can now use your new password to log into your account.
          </p>
          <button
            onClick={() => navigate('/#login', { replace: true })}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 flex justify-center items-center gap-2"
          >
            Go to Login <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <img src={logoImg} alt="One Shot Bar" className="w-14 h-14 object-contain mx-auto mb-4 rounded-2xl border border-neutral-800" />
        <h1 className="text-2xl font-black text-white tracking-tight">Create New Password</h1>
        <p className="text-neutral-500 text-sm mt-1">Please enter your new secure password below.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        {error && (
          <div className="bg-rose-950/40 border border-rose-800/50 text-rose-400 text-xs px-4 py-3 rounded-xl flex items-start gap-2">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5 font-medium uppercase tracking-wider">New Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"><Lock size={15} /></span>
              <input
                type={showPw ? 'text' : 'password'} value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-10 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5 font-medium uppercase tracking-wider">Confirm Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"><Lock size={15} /></span>
              <input
                type={showPw ? 'text' : 'password'} value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(''); }}
                placeholder="••••••••"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-10 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !password || !confirm}
          className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
        >
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}