import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Lock, Pencil, X, Save, CheckCircle,
  EyeOff, Eye, LogOut, Mail, Phone
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

  const [profileEdit, setProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone || '',
  });

  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [secError, setSecError] = useState('');

  const handleProfileSave = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        email: profileForm.email !== currentUser.email ? profileForm.email : undefined,
        data: {
          full_name: profileForm.name,
          phone: profileForm.phone,
        }
      });
      if (error) throw error;
      onUpdateUser({ name: profileForm.name, email: profileForm.email, phone: profileForm.phone });
      setProfileEdit(false);
      setSaved('Profile updated successfully!');
      setTimeout(() => setSaved(null), 3000);
    } catch (error: any) {
      alert(error.message || 'Failed to update profile.');
    }
  };

  const handlePasswordSave = async () => {
    setSecError('');
    if (!pwForm.new || !pwForm.confirm) return setSecError('Please fill in all fields.');
    if (pwForm.new !== pwForm.confirm) return setSecError('New passwords do not match.');
    if (pwForm.new.length < 6) return setSecError('Password must be at least 6 characters.');

    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.new });
      if (error) throw error;
      setPwForm({ current: '', new: '', confirm: '' });
      setSaved('Password updated successfully!');
      setTimeout(() => setSaved(null), 3000);
    } catch (error: any) {
      setSecError(error.message || 'Failed to update password.');
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
          <button onClick={onClose} className="md:hidden absolute top-4 right-4 p-2 bg-neutral-900 rounded-full text-neutral-400"><X size={16}/></button>

          <div className="w-full md:w-64 bg-neutral-900/50 border-b md:border-b-0 md:border-r border-neutral-800 flex-shrink-0 flex flex-col p-4 md:p-6">
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
            <button onClick={onClose} className="hidden md:flex absolute top-6 right-6 p-2 text-neutral-500 hover:text-white bg-neutral-900 rounded-full transition-colors"><X size={16}/></button>

            {saved && (
              <div className="mb-6 flex items-center gap-2 bg-emerald-950/40 border border-emerald-700/40 text-emerald-400 text-sm px-4 py-3 rounded-xl animate-in fade-in slide-in-from-top-2">
                <CheckCircle size={16} /> {saved}
              </div>
            )}

            {/* ════ PROFILE TAB ════ */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <User size={16} className="text-emerald-500" /> Personal Info
                    </h4>
                    <p className="text-xs text-neutral-500 mt-1">Manage your public identity.</p>
                  </div>
                  {!profileEdit ? (
                    <button onClick={() => setProfileEdit(true)} className="flex items-center gap-1.5 text-xs text-emerald-400 hover:bg-emerald-950/30 px-3 py-1.5 rounded-full transition-colors border border-emerald-900/50">
                      <Pencil size={12} /> Edit
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setProfileEdit(false)} className="text-xs text-neutral-400 hover:text-white px-2 py-1 transition-colors">Cancel</button>
                      <button onClick={handleProfileSave} className="flex items-center gap-1.5 text-xs text-neutral-950 bg-emerald-400 hover:bg-emerald-300 px-3 py-1.5 rounded-full font-bold transition-colors">
                        <Save size={12} /> Save
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6 max-w-lg">
                  <FieldRow icon={User} label="Full Name" value={currentUser.name} editing={profileEdit} input={<input type="text" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} className="input-field" />} />
                  <FieldRow icon={Mail} label="Email Address" value={currentUser.email} editing={profileEdit} input={<input type="email" value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} className="input-field" />} />
                  <FieldRow icon={Phone} label="Contact Number" value={currentUser.phone || 'Not provided'} editing={profileEdit} input={<input type="tel" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} className="input-field" placeholder="09XXXXXXXXX" />} />
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
                  {secError && <div className="text-xs text-rose-400 bg-rose-950/30 p-3 rounded-lg border border-rose-900/50">{secError}</div>}
                  <PasswordField label="New Password" value={pwForm.new} show={showPw.new} onChange={v => setPwForm(f => ({ ...f, new: v }))} onToggle={() => setShowPw(s => ({ ...s, new: !s.new }))} />
                  <PasswordField label="Confirm Password" value={pwForm.confirm} show={showPw.confirm} onChange={v => setPwForm(f => ({ ...f, confirm: v }))} onToggle={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))} />
                  <button onClick={handlePasswordSave} disabled={!pwForm.new || !pwForm.confirm} className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors mt-2">
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
        <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 pr-10 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors" placeholder="••••••••" />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}