import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Lock, X, CheckCircle,
  EyeOff, Eye, LogOut, Mail, Phone, AlertTriangle, Check
} from 'lucide-react';
import { supabase } from '../../utils/supabase/client';

type Section = 'profile' | 'security';

export type CustomerUser = {
  name: string;
  email: string;
  phone?: string;
  referralCode: string;
};

interface CustomerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CustomerUser;
  onUpdateUser: (updates: Partial<CustomerUser>) => void;
  onLogout: () => void;
}

export function CustomerSettingsModal({
  isOpen, onClose, currentUser, onUpdateUser, onLogout
}: CustomerSettingsModalProps) {
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [saved, setSaved] = useState<string | null>(null);

  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [secError, setSecError] = useState('');

  // ── Inline Profile Update Handler ──
  const updateProfileField = async (field: 'name' | 'phone', value: string) => {
    const { error } = await supabase.auth.updateUser({
      data: {
        ...(field === 'name' ? { full_name: value } : {}),
        ...(field === 'phone' ? { phone: value } : {}),
      }
    });
    
    if (error) throw error;
    
    onUpdateUser({ 
      ...currentUser,
      ...(field === 'name' ? { name: value } : {}),
      ...(field === 'phone' ? { phone: value } : {}),
    });
    
    setSaved(`${field === 'name' ? 'Name' : 'Contact number'} updated successfully!`);
    setTimeout(() => setSaved(null), 3000);
  };

  const handlePasswordSave = async () => {
    setSecError('');
    if (!pwForm.current || !pwForm.new || !pwForm.confirm) return setSecError('Please fill in all fields.');
    if (pwForm.new !== pwForm.confirm) return setSecError('New passwords do not match.');
    if (pwForm.new.length < 6) return setSecError('Password must be at least 6 characters.');

    try {
      // 1. Verify Current Password First
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: pwForm.current,
      });
      if (signInError) throw new Error("Incorrect current password.");

      // 2. Update to New Password
      const { error: updateError } = await supabase.auth.updateUser({ password: pwForm.new });
      if (updateError) throw updateError;
      
      setPwForm({ current: '', new: '', confirm: '' });
      
      // 🚨 Trigger the custom success screen 🚨
      setSaved('password_changed'); 
    } catch (error: any) {
      setSecError(error.message || 'Failed to update password.');
    }
  };

  const handleForgotPassword = async () => {
    try {
      await supabase.auth.resetPasswordForEmail(currentUser.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setSaved('Reset link sent to your email! Please check your inbox.');
      setTimeout(() => setSaved(null), 4000);
    } catch (err: any) {
      setSecError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
        >
          <button onClick={onClose} className="md:hidden absolute top-4 right-4 p-2 bg-neutral-900 rounded-full text-neutral-400 z-50"><X size={16}/></button>

          <div className="w-full md:w-64 bg-neutral-900/50 border-b md:border-b-0 md:border-r border-neutral-800 flex-shrink-0 flex flex-col p-4 md:p-6 relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                <span className="text-emerald-400 font-black text-lg">{currentUser.name.charAt(0)}</span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-neutral-100 truncate">{currentUser.name}</p>
                <p className="text-xs text-neutral-500 truncate">Customer Portal</p>
              </div>
            </div>
            
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'security', label: 'Security', icon: Lock },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id as Section)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap md:whitespace-normal flex-shrink-0 md:flex-shrink ${
                    activeSection === tab.id
                      ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-600/30'
                      : 'text-neutral-400 hover:bg-neutral-800 border border-transparent'
                  }`}
                >
                  <tab.icon size={16} className={activeSection === tab.id ? 'text-emerald-400' : 'text-neutral-500'} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-auto hidden md:block pt-6 border-t border-neutral-800">
              <button onClick={onLogout} className="flex items-center gap-3 text-sm text-neutral-500 hover:text-rose-400 transition-colors w-full px-4 py-2">
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>

          <div className="flex-1 bg-neutral-950 overflow-y-auto p-4 md:p-8 relative">
            <button onClick={onClose} className="hidden md:flex absolute top-6 right-6 p-2 text-neutral-500 hover:text-white bg-neutral-900 rounded-full transition-colors z-50"><X size={16}/></button>

            {/* 🚨 THE "PASSWORD CHANGED" SUCCESS OVERLAY 🚨 */}
            <AnimatePresence>
              {saved === 'password_changed' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 z-50 bg-neutral-950 flex flex-col items-center justify-center p-8 text-center rounded-r-2xl"
                >
                  <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">Password Changed!</h3>
                  <p className="text-neutral-400 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                    Your password has been successfully updated. For security reasons, you have been signed out and need to log back in.
                  </p>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      onClose();
                      window.location.hash = 'login';
                      window.location.reload();
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20"
                  >
                    Back to Home & Login
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Normal Saved Toast */}
            {saved && saved !== 'password_changed' && (
              <div className="mb-6 flex items-center gap-2 bg-emerald-950/40 border border-emerald-700/40 text-emerald-400 text-sm px-4 py-3 rounded-xl animate-in fade-in slide-in-from-top-2">
                <CheckCircle size={16} /> {saved}
              </div>
            )}

            {/* ════ PROFILE TAB ════ */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <div className="border-b border-neutral-800 pb-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <User size={16} className="text-emerald-500" /> Personal Info
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1">Manage your public identity.</p>
                </div>

                <div className="space-y-6 max-w-lg">
                  <EditableFieldRow 
                    icon={User} 
                    label="Full Name" 
                    initialValue={currentUser.name} 
                    onSave={(val) => updateProfileField('name', val)}
                    validator={(val) => val.trim().length === 0 ? "Name cannot be empty." : null}
                  />
                  
                  <StaticFieldRow 
                    icon={Mail} 
                    label="Email Address" 
                    value={currentUser.email} 
                    hint="Email cannot be changed."
                  />
                  
                  <EditableFieldRow 
                    icon={Phone} 
                    label="Contact Number" 
                    initialValue={currentUser.phone || ''} 
                    type="tel"
                    placeholder="09XXXXXXXXX"
                    onSave={(val) => updateProfileField('phone', val)}
                    validator={(val) => {
                      if (val.trim() === '') return null; // allow empty
                      const cleanPhone = val.replace(/\D/g, '');
                      if (!/^09\d{9}$/.test(cleanPhone)) return 'Must be exactly 11 digits starting with 09.';
                      return null;
                    }}
                  />
                </div>
                
                <div className="pt-6 border-t border-neutral-800 md:hidden">
                  <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-rose-950/40 text-rose-500 border border-neutral-800 hover:border-rose-900/50 py-3 rounded-xl text-sm font-semibold transition-colors">
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* ════ SECURITY TAB ════ */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <div className="border-b border-neutral-800 pb-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Lock size={16} className="text-amber-500" /> Security
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1">Keep your account safe.</p>
                </div>

                <div className="max-w-md space-y-4">
                  {secError && <div className="text-xs text-rose-400 bg-rose-950/30 p-3 rounded-lg border border-rose-900/50 flex items-center gap-2"><AlertTriangle size={14}/> {secError}</div>}
                  
                  <PasswordField label="Current Password" value={pwForm.current} show={showPw.current} onChange={v => setPwForm(f => ({ ...f, current: v }))} onToggle={() => setShowPw(s => ({ ...s, current: !s.current }))} />
                  
                  <div className="flex justify-end mt-1 mb-4">
                    <button type="button" onClick={handleForgotPassword} className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                      Forgot current password?
                    </button>
                  </div>

                  <PasswordField label="New Password" value={pwForm.new} show={showPw.new} onChange={v => setPwForm(f => ({ ...f, new: v }))} onToggle={() => setShowPw(s => ({ ...s, new: !s.new }))} />
                  <PasswordField label="Confirm New Password" value={pwForm.confirm} show={showPw.confirm} onChange={v => setPwForm(f => ({ ...f, confirm: v }))} onToggle={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))} />
                  
                  <button onClick={handlePasswordSave} disabled={!pwForm.current || !pwForm.new || !pwForm.confirm} className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors mt-2">
                    Update Password
                  </button>
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Reusable Mini-Components ──

function EditableFieldRow({ icon: Icon, label, initialValue, onSave, validator, type = 'text', placeholder = '' }: { 
  icon: any, label: string, initialValue: string, onSave: (val: string) => Promise<void>, validator?: (val: string) => string | null, type?: string, placeholder?: string 
}) {
  const [val, setVal] = useState(initialValue);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync if prop changes externally
  useEffect(() => { setVal(initialValue); }, [initialValue]);

  const hasChanged = val !== initialValue;

  const handleCancel = () => {
    setVal(initialValue);
    setError('');
  };

  const handleSave = async () => {
    if (validator) {
      const errMsg = validator(val);
      if (errMsg) {
        setError(errMsg);
        return;
      }
    }
    setError('');
    setSaving(true);
    try {
      await onSave(val);
    } catch (err: any) {
      setError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={14} className="text-neutral-400" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] text-neutral-500 mb-1 font-semibold uppercase tracking-wider">{label}</p>
        <div className="relative flex items-center">
          <input
            type={type}
            value={val}
            onChange={e => {
              let newVal = e.target.value;
              if (type === 'tel') {
                newVal = newVal.replace(/\D/g, '');
                if (newVal.length > 11) return;
              }
              setVal(newVal);
              setError('');
            }}
            placeholder={placeholder}
            className={`w-full bg-neutral-900 border rounded-lg px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none transition-colors ${hasChanged ? 'pr-20' : ''} ${error ? 'border-rose-500 focus:border-rose-500' : 'border-neutral-700 focus:border-emerald-500'}`}
          />
          {hasChanged && (
            <div className="absolute right-1.5 flex items-center gap-0.5 bg-neutral-900 pl-2">
              <button onClick={handleCancel} disabled={saving} className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded-md transition-colors" title="Cancel">
                <X size={14} />
              </button>
              <button onClick={handleSave} disabled={saving} className="p-1.5 text-neutral-500 hover:text-emerald-400 hover:bg-neutral-800 rounded-md transition-colors" title="Save">
                {saving ? <div className="w-3.5 h-3.5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /> : <Check size={14} />}
              </button>
            </div>
          )}
        </div>
        {error && <p className="text-[10px] text-rose-400 mt-1.5">{error}</p>}
      </div>
    </div>
  );
}

function StaticFieldRow({ icon: Icon, label, value, hint }: { icon: any, label: string, value: string, hint?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={14} className="text-neutral-400" />
      </div>
      <div className="flex-1">
        <p className="text-[10px] text-neutral-500 mb-1 font-semibold uppercase tracking-wider">{label}</p>
        <input
          type="text"
          value={value}
          disabled
          className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-neutral-500 cursor-not-allowed"
        />
        {hint && <p className="text-[10px] text-neutral-600 mt-1.5">{hint}</p>}
      </div>
    </div>
  );
}

function PasswordField({ label, value, show, onChange, onToggle }: { label: string, value: string, show: boolean, onChange: (v: string) => void, onToggle: () => void }) {
  return (
    <div>
      <label className="block text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-1">{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 pr-10 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition-colors" placeholder="••••••••" />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}