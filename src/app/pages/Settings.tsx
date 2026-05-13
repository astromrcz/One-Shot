import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  User, Lock, Mail, Phone, Eye, EyeOff,
  Save, CheckCircle, Pencil, X, Calendar, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import logoImg from '@/app/assets/40eb82831843e17a3c48a360fd80f0aaaa58ddc8.png';
import { supabase } from '../../utils/supabase/client';

type Section = 'profile' | 'security';

export function SettingsPage() {
  // 🚨 FIXED: Added staffUsers and updateStaffUser to interact with the database directly
  const { staffProfile, updateStaffProfile, staffLogout, staffUsers, updateStaffUser } = useAppContext();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [saved, setSaved] = useState<string | null>(null);

  // ── Profile Form ────────────────────────────────────────────
  const [profileEdit, setProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: staffProfile.fullName,
    email:    staffProfile.email,
    phone:    staffProfile.phone,
    role:     staffProfile.role,
  });

  // ── Security Form ───────────────────────────────────────────
  const [secEdit, setSecEdit] = useState(false);
  const [secForm, setSecForm] = useState({
    username:        staffProfile.username,
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
  });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [secError, setSecError] = useState('');

  // ── Save helpers ────────────────────────────────────────────
  const flashSaved = (key: string) => {
    setSaved(key);
    setTimeout(() => setSaved(null), 2500);
  };

  const handleSaveProfile = () => {
    updateStaffProfile({
      fullName: profileForm.fullName,
      email:    profileForm.email,
      phone:    profileForm.phone,
      role:     profileForm.role,
    });
    setProfileEdit(false);
    flashSaved('profile');
  };

  const handleSaveSecurity = async () => {
    setSecError('');
    
    // 1. Check if current password is provided
    if (!secForm.currentPassword) {
      setSecError('Current password is required to verify changes.');
      return;
    }

    if (secForm.newPassword && secForm.newPassword.length < 6) { 
      setSecError('New password must be at least 6 characters.'); 
      return; 
    }
    if (secForm.newPassword && secForm.newPassword !== secForm.confirmPassword) { 
      setSecError('New passwords do not match.'); 
      return; 
    }
    
    try {
      // 🚨 2. Verify current password directly against the staff_users table
      const { data: verifiedUser, error: verifyError } = await supabase
        .from('staff_users')
        .select('id')
        .eq('username', staffProfile.username)
        .eq('password', secForm.currentPassword)
        .maybeSingle();

      if (verifyError || !verifiedUser) {
        setSecError('Incorrect current password.');
        return;
      }

      // 🚨 3. Use updateStaffUser to actually change the password in the database!
      await updateStaffUser(verifiedUser.id, {
        username: secForm.username || staffProfile.username,
        ...(secForm.newPassword ? { password: secForm.newPassword } : {})
      });

      // 4. Update the local session profile (UI state)
      updateStaffProfile({
        username: secForm.username || staffProfile.username,
      });

      // (Optional) Update Supabase standard Auth in the background
      if (secForm.newPassword) {
        await supabase.auth.updateUser({ password: secForm.newPassword }).catch(() => {});
      }
      
      setSecEdit(false);
      setSecForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }));
      flashSaved('security');
    } catch (error: any) {
      setSecError(error.message || 'Failed to update security settings.');
    }
  };

  const tabs: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: 'profile',  label: 'Profile',  icon: User },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ── Header card ── */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="flex items-center gap-5 relative z-10">
          <img
            src={logoImg}
            alt="One Shot Bar & Billiards"
            className="w-16 h-16 object-contain rounded-2xl flex-shrink-0 bg-neutral-900 border border-neutral-800"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-neutral-100">{staffProfile.fullName}</h2>
              {staffProfile.isAdmin && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                  <ShieldCheck size={10} /> Admin
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-400 mt-1 capitalize">{staffProfile.role} · @{staffProfile.username}</p>
          </div>
        </div>

        {/* Decorative Background */}
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-emerald-900/10 to-transparent pointer-events-none" />
      </div>

      {saved && (
        <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-700/40 text-emerald-400 text-sm px-4 py-3 rounded-xl">
          <CheckCircle size={15} />
          Changes saved successfully!
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-2 border-b border-neutral-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all border-b-2 ${
              activeSection === tab.id
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════
          PROFILE TAB
      ════════════════════════════════════════════════════════ */}
      {activeSection === 'profile' && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-100">Personal Information</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Your display name, contact, and role details</p>
            </div>
            {!profileEdit ? (
              <button onClick={() => { setProfileEdit(true); setProfileForm({ fullName: staffProfile.fullName, email: staffProfile.email, phone: staffProfile.phone, role: staffProfile.role }); }}
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-3 py-1.5 rounded-lg transition-colors">
                <Pencil size={12} /> Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setProfileEdit(false)}
                  className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 px-3 py-1.5 rounded-lg transition-colors">
                  <X size={12} /> Cancel
                </button>
                {/* 🚨 FIXED typo here (handleProfileSave -> handleSaveProfile) */}
                <button onClick={handleSaveProfile} className="flex items-center gap-1.5 text-xs text-neutral-950 bg-emerald-400 hover:bg-emerald-300 px-4 py-1.5 rounded-lg font-bold transition-colors">
                  <Save size={12} /> Save
                </button>
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            <FieldRow icon={User} label="Full Name" value={staffProfile.fullName}
              editing={profileEdit}
              input={<input type="text" value={profileForm.fullName} onChange={e => setProfileForm(f => ({ ...f, fullName: e.target.value }))}
                className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-emerald-600/50 transition-colors" />}
            />

            <FieldRow icon={Mail} label="Email Address" value={staffProfile.email}
              editing={profileEdit}
              input={<input type="email" value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-emerald-600/50 transition-colors" />}
            />

            <FieldRow icon={Phone} label="Contact Number" value={staffProfile.phone || 'Not provided'}
              editing={profileEdit}
              input={<input type="tel" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-emerald-600/50 transition-colors" placeholder="09XXXXXXXXX" />}
            />

            <FieldRow icon={Calendar} label="Date Joined" value={new Date(staffProfile.joinedDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
              editing={false}
              input={null}
            />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          SECURITY TAB
      ════════════════════════════════════════════════════════ */}
      {activeSection === 'security' && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-100">Login Credentials</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Manage your username and password</p>
            </div>
            {!secEdit ? (
              <button onClick={() => { setSecEdit(true); setSecError(''); setSecForm(f => ({ ...f, username: staffProfile.username })); }}
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-3 py-1.5 rounded-lg transition-colors">
                <Pencil size={12} /> Edit Security
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => { setSecEdit(false); setSecError(''); }}
                  className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 px-3 py-1.5 rounded-lg transition-colors">
                  <X size={12} /> Cancel
                </button>
                <button onClick={handleSaveSecurity} className="flex items-center gap-1.5 text-xs text-neutral-950 bg-amber-500 hover:bg-amber-400 px-4 py-1.5 rounded-lg font-bold transition-colors">
                  <Save size={12} /> Save
                </button>
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            <FieldRow icon={User} label="Username" value={`@${staffProfile.username}`}
              editing={secEdit}
              input={
                <div className="relative max-w-md">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">@</span>
                  <input type="text" value={secForm.username} onChange={e => setSecForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, '') }))}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl pl-8 pr-4 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-amber-500/50 transition-colors" />
                </div>
              }
            />

            <FieldRow icon={Lock} label="Password" value="••••••••"
              editing={secEdit}
              input={
                <div className="max-w-md space-y-3 bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                  {/* 🚨 ADDED CURRENT PASSWORD FIELD */}
                  <div className="mb-4 pb-4 border-b border-neutral-800">
                    <PasswordField label="Current Password *" value={secForm.currentPassword} show={showPw.current} onChange={v => setSecForm(f => ({ ...f, currentPassword: v }))} onToggle={() => setShowPw(s => ({ ...s, current: !s.current }))} placeholder="Required to save changes" />
                  </div>
                  
                  <PasswordField label="New Password" value={secForm.newPassword} show={showPw.new} onChange={v => setSecForm(f => ({ ...f, newPassword: v }))} onToggle={() => setShowPw(s => ({ ...s, new: !s.new }))} placeholder="Leave blank to keep current" />
                  <PasswordField label="Confirm Password" value={secForm.confirmPassword} show={showPw.confirm} onChange={v => setSecForm(f => ({ ...f, confirmPassword: v }))} onToggle={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))} placeholder="Re-enter to confirm" />
                  
                  {secError && <p className="text-[11px] text-rose-400 pt-1">{secError}</p>}
                </div>
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reusable Mini-Components ──
function FieldRow({ icon: Icon, label, value, editing, input }: { icon: any, label: string, value: string, editing: boolean, input: any }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-neutral-400" />
      </div>
      <div className="flex-1 pt-1">
        <p className="text-[10px] text-neutral-500 mb-1 font-semibold uppercase tracking-wider">{label}</p>
        {editing && input ? input : <p className="text-sm text-neutral-200 font-medium">{value}</p>}
      </div>
    </div>
  );
}

function PasswordField({ label, value, show, onChange, onToggle, placeholder }: { label: string, value: string, show: boolean, onChange: (v: string) => void, onToggle: () => void, placeholder: string }) {
  return (
    <div>
      <label className="block text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-1.5">{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-neutral-950 border border-neutral-700 rounded-lg pl-3 pr-10 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500/50 transition-colors" placeholder={placeholder} />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}