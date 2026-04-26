import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Lock, Shield, Pencil, X, Save, CheckCircle,
  AlertTriangle, LogOut, Mail, Phone, EyeOff, Eye, Award
} from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
type Section = 'profile' | 'security' | 'account';

// Define the shape of our customer data based on what HomePage uses
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

  // ── Profile Form State ──
  const [profileEdit, setProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone || '',
  });

  // ── Security Form State ──
  const [secEdit, setSecEdit] = useState(false);
  const [secForm, setSecForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [secError, setSecError] = useState('');

  const flashSaved = (key: string) => {
    setSaved(key);
    setTimeout(() => setSaved(null), 2500);
  };

  const handleSaveProfile = () => {
    onUpdateUser({
      name: profileForm.name,
      email: profileForm.email,
      phone: profileForm.phone,
    });
    setProfileEdit(false);
    flashSaved('profile');
  };

  const handleSaveSecurity = async () => {
    setSecError('');
    if (!secForm.currentPassword) { setSecError('Enter your current password to confirm.'); return; }
    if (secForm.newPassword !== secForm.confirmPassword) { setSecError('New passwords do not match.'); return; }
    if (secForm.newPassword.length < 6) { setSecError('New password must be at least 6 characters.'); return; }
    
    try {
      // 1. Verify their current password is correct by attempting a silent login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: secForm.currentPassword
      });

      if (signInError) {
        setSecError('Incorrect current password.');
        return;
      }

      // 2. Actually update their password in the Supabase Vault
      const { error: updateError } = await supabase.auth.updateUser({
        password: secForm.newPassword
      });

      if (updateError) throw updateError;

      setSecEdit(false);
      setSecForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      flashSaved('security');
    } catch (error: any) {
      setSecError(error.message || 'Failed to update password.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
          onClick={e => e.stopPropagation()}
          className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* ── Header ── */}
          <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-lg font-black text-white">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">{currentUser.name}</h3>
                <p className="text-xs text-neutral-500">{currentUser.email}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded-xl transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* ── Tabs ── */}
          <div className="px-6 pt-4 pb-2">
            <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'security', label: 'Security', icon: Lock },
                { id: 'account', label: 'Account', icon: Shield },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id as Section)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                    activeSection === tab.id
                      ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-600/20'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <tab.icon size={14} /> {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Scrollable Content Area ── */}
          <div className="p-6 overflow-y-auto custom-scrollbar">
            
            {saved && (
              <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-700/40 text-emerald-400 text-xs px-3 py-2.5 rounded-xl mb-4">
                <CheckCircle size={14} /> Changes saved successfully!
              </div>
            )}

            {/* ════ PROFILE TAB ════ */}
            {activeSection === 'profile' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-neutral-200">Personal Information</h4>
                  {!profileEdit ? (
                    <button onClick={() => setProfileEdit(true)} className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1 font-semibold">
                      <Pencil size={12} /> Edit
                    </button>
                  ) : (
                    <button onClick={() => setProfileEdit(false)} className="text-xs text-neutral-500 hover:text-neutral-400 flex items-center gap-1">
                      <X size={12} /> Cancel
                    </button>
                  )}
                </div>

                <div className="space-y-4 bg-neutral-900/50 border border-neutral-800/60 rounded-xl p-4">
                  <FieldRow icon={User} label="Full Name" value={currentUser.name} editing={profileEdit}
                    input={<input type="text" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} className="input-style" />} />
                  
                  <FieldRow icon={Mail} label="Email Address" value={currentUser.email} editing={profileEdit}
                    input={<input type="email" value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} className="input-style" />} />
                  
                  <FieldRow icon={Phone} label="Phone Number" value={currentUser.phone || 'Not provided'} editing={profileEdit}
                    input={<input type="tel" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} placeholder="09XX-XXX-XXXX" className="input-style" />} />
                </div>

                {profileEdit && (
                  <button onClick={handleSaveProfile} className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-xl font-semibold transition-all">
                    <Save size={14} /> Save Profile
                  </button>
                )}
              </div>
            )}

            {/* ════ SECURITY TAB ════ */}
            {activeSection === 'security' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-neutral-200">Password Settings</h4>
                  {!secEdit ? (
                    <button onClick={() => setSecEdit(true)} className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1 font-semibold">
                      <Pencil size={12} /> Change
                    </button>
                  ) : (
                    <button onClick={() => { setSecEdit(false); setSecError(''); }} className="text-xs text-neutral-500 hover:text-neutral-400 flex items-center gap-1">
                      <X size={12} /> Cancel
                    </button>
                  )}
                </div>

                <div className="bg-neutral-900/50 border border-neutral-800/60 rounded-xl p-4">
                  {!secEdit ? (
                    <div className="flex items-center gap-3">
                      <Lock size={16} className="text-neutral-500" />
                      <div>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">Password</p>
                        <p className="text-sm text-neutral-300">••••••••</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <PasswordField label="Current Password" value={secForm.currentPassword} show={showPw.current}
                        onChange={v => setSecForm(f => ({ ...f, currentPassword: v }))} onToggle={() => setShowPw(s => ({ ...s, current: !s.current }))} />
                      <PasswordField label="New Password" value={secForm.newPassword} show={showPw.new}
                        onChange={v => setSecForm(f => ({ ...f, newPassword: v }))} onToggle={() => setShowPw(s => ({ ...s, new: !s.new }))} />
                      <PasswordField label="Confirm New Password" value={secForm.confirmPassword} show={showPw.confirm}
                        onChange={v => setSecForm(f => ({ ...f, confirmPassword: v }))} onToggle={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))} />
                      
                      {secError && (
                        <p className="flex items-center gap-1 text-[11px] text-rose-400 mt-2"><AlertTriangle size={12} /> {secError}</p>
                      )}
                    </div>
                  )}
                </div>

                {secEdit && (
                  <button onClick={handleSaveSecurity} className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-xl font-semibold transition-all">
                    <Save size={14} /> Update Password
                  </button>
                )}
              </div>
            )}

            {/* ════ ACCOUNT TAB ════ */}
            {activeSection === 'account' && (
              <div className="space-y-5">
                <div className="bg-neutral-900/50 border border-neutral-800/60 rounded-xl p-5">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                    <Award size={12} className="text-amber-400" /> Your Referral Code
                  </p>
                  <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                    <span className="flex-1 text-lg font-black text-emerald-400 font-mono tracking-widest text-center">{currentUser.referralCode}</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(currentUser.referralCode); flashSaved('account'); }}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-md transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-3 text-center">Share this code with friends. They can enter it during registration to get exclusive perks!</p>
                </div>

                <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-5 text-center">
                  <h4 className="text-sm font-bold text-neutral-200 mb-1">Sign Out</h4>
                  <p className="text-xs text-neutral-500 mb-4">Log out of your customer account.</p>
                  <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border border-rose-600/20 rounded-xl text-sm font-semibold transition-all">
                    <LogOut size={14} /> Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Internal CSS for inputs to keep JSX clean */}
      <style>{`
        .input-style { width: 100%; background: #171717; border: 1px solid #262626; border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: #f5f5f5; outline: none; transition: border-color 0.2s; }
        .input-style:focus { border-color: #059669; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #262626; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #404040; }
      `}</style>
    </AnimatePresence>
  );
}

// ── Reusable Mini-Components ──
function FieldRow({ icon: Icon, label, value, editing, input }: { icon: any, label: string, value: string, editing: boolean, input: any }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0 mt-0.5"><Icon size={14} className="text-neutral-400" /></div>
      <div className="flex-1">
        <p className="text-[10px] text-neutral-500 mb-1 font-semibold uppercase tracking-wider">{label}</p>
        {editing ? input : <p className="text-sm text-neutral-200 font-medium">{value}</p>}
      </div>
    </div>
  );
}

function PasswordField({ label, value, show, onChange, onToggle }: { label: string, value: string, show: boolean, onChange: (v: string) => void, onToggle: () => void }) {
  return (
    <div>
      <label className="block text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-1">{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} className="input-style pr-9" />
        <button type="button" onClick={onToggle} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"><EyeOff size={13} className={show ? 'hidden' : 'block'} /><Eye size={13} className={show ? 'block' : 'hidden'} /></button>
      </div>
    </div>
  );
}