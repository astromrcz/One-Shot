import { useState } from 'react';
import { useAppContext, StaffUser } from '../context/AppContext';
import { 
  Plus, X, User, Mail, Phone, RefreshCw, Pencil, CheckCircle, 
  ShieldCheck, Palette, BadgeDollarSign, Archive, ArchiveRestore, ChevronDown, ChevronUp,
  Lock, AlertTriangle
} from 'lucide-react';
import emailjs from '@emailjs/browser';
import { toast } from 'sonner';

const ROLES: { value: StaffUser['role']; label: string; color: string; icon: React.ReactNode }[] = [
  { value: 'admin',         label: 'Admin',         color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',      icon: <ShieldCheck size={11} /> },
  { value: 'manager',       label: 'Manager',       color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',   icon: <User size={11} /> },
  { value: 'tattoo-artist', label: 'Tattoo Artist', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20',     icon: <Palette size={11} /> },
];

type FormState = {
  username: string; fullName: string;
  email: string; role: StaffUser['role']; artistId: string; phone: string; isActive: boolean; isAdmin: boolean;
};
const blankForm: FormState = { username: '', fullName: '', email: '', role: 'manager', artistId: '', phone: '', isActive: true, isAdmin: false };

export function AdminUsers() {
  const { staffUsers, tattooArtists, addStaffUser, updateStaffUser, toggleStaffUserActive, resetStaffUserPassword, staffProfile, adminLogin } = useAppContext();
  
  // Modals & States
  const [showForm, setShowForm]     = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState<FormState>(blankForm);
  const [resetMsg, setResetMsg]     = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<'all' | StaffUser['role']>('all');
  const [showArchived, setShowArchived] = useState(false);

  // Loading & Security States
  const [isSaving, setIsSaving]           = useState(false);
  const [isResettingId, setIsResettingId] = useState<string | null>(null);
  const [restoringId, setRestoringId]     = useState<string | null>(null);
  const [archivingUser, setArchivingUser] = useState<StaffUser | null>(null);
  const [restoringUser, setRestoringUser] = useState<StaffUser | null>(null); // 🚨 Added restoring state
  const [archivePassword, setArchivePassword] = useState('');
  const [isArchiving, setIsArchiving]     = useState(false);

  const openAdd = () => { setEditingId(null); setForm(blankForm); setShowForm(true); };
  const openEdit = (u: StaffUser) => {
    setEditingId(u.id);
    setForm({ username: u.username, fullName: u.fullName, email: u.email, role: u.role, isAdmin: u.isAdmin, artistId: u.artistId ?? '', phone: u.phone, isActive: u.isActive });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.fullName || !form.email) return;
    
    setIsSaving(true);
    const payload = {
      ...form,
      artistId: form.role === 'tattoo-artist' && form.artistId ? form.artistId : undefined,
    };
    
    try {
      if (editingId) {
        await updateStaffUser(editingId, payload);
        toast.success("User Updated", { description: "Staff account changes saved." });
      } else {
        await addStaffUser({ ...payload, password: 'oneshotdefaultpw' });
        
        // 🚨 EMAIL NOTIFICATION FOR NEW ACCOUNTS 🚨
        try {
          await emailjs.send(
            'service_d5kmgtc',   
            'template_48a5pgd', // Replace with your exact Staff Welcome Email template ID
            {
              to_email: form.email,
              customer_name: form.fullName, // using customer_name var based on your other templates
              role: form.role,
              username: form.username,
              password: 'oneshotdefaultpw',
              login_link: `${window.location.origin}/staff/login`
            },
            'agtFkbRS7r_lgBWMV' 
          );
          toast.success("User Created & Email Sent", { description: "New staff account added. They have been emailed their login details." });
        } catch (emailErr) {
          console.error("Email failed to send", emailErr);
          toast.success("User Created", { description: "New staff account added, but welcome email failed to send." });
        }
      }
      setShowForm(false); setEditingId(null); setForm(blankForm);
    } catch (err) {
      toast.error("Database Error", { description: "Failed to save user data." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async (id: string, name: string) => {
    setIsResettingId(id);
    try {
      await resetStaffUserPassword(id);
      setResetMsg(`Password for "${name}" reset to: oneshotdefaultpw`);
      toast.success("Password Reset", { description: "Password returned to default." });
      setTimeout(() => setResetMsg(null), 5000);
    } catch(err) {
      toast.error("Database Error", { description: "Could not reset password." });
    } finally {
      setIsResettingId(null);
    }
  };

  // ── Archive & Restore Security ──────────────────────────────────────────────
  const handleArchiveClick = (u: StaffUser) => {
    if (u.isAdmin) {
      const activeAdmins = staffUsers.filter(su => su.isAdmin && su.isActive);
      if (activeAdmins.length <= 1) {
        toast.error("Action Denied", { description: "You must leave at least one Admin account active to prevent system lockout." });
        return;
      }
    }
    setArchivingUser(u);
    setArchivePassword('');
  };

  const handleRestoreClick = (u: StaffUser) => {
    setRestoringUser(u);
    setArchivePassword('');
  };

  const confirmArchiveOrRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUser = archivingUser || restoringUser;
    if (!targetUser) return;
    
    setIsArchiving(true);
    
    // Verify the current admin's password before executing
    const isValid = await adminLogin(staffProfile.username, archivePassword);
    if (!isValid) {
      toast.error("Authentication Failed", { description: "Incorrect admin password." });
      setIsArchiving(false);
      return;
    }

    try {
      await toggleStaffUserActive(targetUser.id);
      if (archivingUser) {
        toast.success("Account Archived", { description: `${targetUser.fullName}'s access has been revoked.` });
      } else {
        toast.success("Account Restored", { description: `${targetUser.fullName} is active again.` });
      }
      setArchivingUser(null);
      setRestoringUser(null);
    } catch (err) {
      toast.error("Database Error", { description: "Failed to process account action." });
    } finally {
      setIsArchiving(false);
    }
  };


  const filtered = staffUsers.filter(u => filterRole === 'all' || u.role === filterRole);
  const activeUsers = filtered.filter(u => u.isActive);
  const archivedUsers = filtered.filter(u => !u.isActive);
  const roleConfig = (role: StaffUser['role']) => ROLES.find(r => r.value === role) ?? ROLES[0];

  const renderUserCard = (u: StaffUser, isArchived: boolean) => {
    const rc = roleConfig(u.role);
    const linkedArtist = u.artistId ? tattooArtists.find(a => a.id === u.artistId) : null;
    return (
      <div key={u.id} className={`bg-neutral-950 border rounded-xl p-5 transition-colors ${!isArchived ? 'border-neutral-800' : 'border-neutral-800/50 opacity-60'}`}>
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-base font-black flex-shrink-0 border ${u.isAdmin ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : u.role === 'tattoo-artist' ? 'bg-pink-500/10 border-pink-500/20 text-pink-400' : 'bg-neutral-800 border-neutral-700 text-neutral-300'}`}>
            {u.fullName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-sm font-bold text-neutral-100">{u.fullName}</p>
              {u.isAdmin && (
                <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <ShieldCheck size={9} /> Admin
                </span>
              )}
              <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${rc.color}`}>
                {rc.icon} {rc.label}
              </span>
              {isArchived && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-500 border border-neutral-700">Archived</span>}
            </div>
            <div className="flex items-center gap-4 text-xs text-neutral-500 flex-wrap">
              <span className="flex items-center gap-1"><User size={10} /> @{u.username}</span>
              <span className="flex items-center gap-1"><Mail size={10} /> {u.email}</span>
              {u.phone && <span className="flex items-center gap-1"><Phone size={10} /> {u.phone}</span>}
            </div>
            {linkedArtist && (
              <p className="text-[10px] text-pink-400/70 mt-0.5 flex items-center gap-1">
                <Palette size={9} /> Linked: {linkedArtist.name} ({linkedArtist.specialty})
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* 🚨 HIDE EDIT/RESET ON ARCHIVED ACCOUNTS 🚨 */}
            {!isArchived && (
              <>
                <button onClick={() => openEdit(u)} title="Edit User" className="p-2 rounded-lg text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleReset(u.id, u.fullName)} disabled={isResettingId === u.id} title="Reset Password" className="p-2 rounded-lg text-neutral-500 hover:text-amber-400 hover:bg-amber-950/20 transition-colors disabled:opacity-50">
                  {isResettingId === u.id ? <RefreshCw size={14} className="animate-spin text-amber-500" /> : <RefreshCw size={14} />}
                </button>
              </>
            )}
            
            {/* Archive / Restore Toggle */}
            {isArchived ? (
              <button onClick={() => handleRestoreClick(u)} title="Restore Account" className="p-2 rounded-lg text-neutral-500 hover:text-emerald-400 hover:bg-emerald-950/20 transition-colors">
                 <ArchiveRestore size={16} />
              </button>
            ) : (
              <button onClick={() => handleArchiveClick(u)} title="Archive Account" className="p-2 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors">
                <Archive size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Users',     value: staffUsers.length,                                       color: 'text-white' },
          { label: 'Active',          value: staffUsers.filter(u => u.isActive).length,               color: 'text-emerald-400' },
          { label: 'Tattoo Artists',  value: staffUsers.filter(u => u.role === 'tattoo-artist').length, color: 'text-pink-400' },
          { label: 'Admins',          value: staffUsers.filter(u => u.isAdmin).length,                color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {resetMsg && (
        <div className="flex items-center gap-2.5 bg-emerald-950/40 border border-emerald-700/40 text-emerald-400 text-sm px-4 py-3 rounded-xl">
          <CheckCircle size={15} /> {resetMsg}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {[{ id: 'all', label: 'All' }, ...ROLES.map(r => ({ id: r.value, label: r.label }))].map(f => (
            <button key={f.id} onClick={() => setFilterRole(f.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filterRole === f.id ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:border-neutral-700'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white text-sm px-4 py-2 rounded-xl font-semibold transition-all shadow-lg shadow-amber-900/30">
          <Plus size={15} /> Add User
        </button>
      </div>

      <div className="space-y-3">
        {activeUsers.length === 0 ? (
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-12 text-center">
            <User size={32} className="mx-auto text-neutral-700 mb-3" />
            <p className="text-neutral-500">No active users found.</p>
          </div>
        ) : (
          activeUsers.map(u => renderUserCard(u, false))
        )}
      </div>

      {archivedUsers.length > 0 && (
        <div className="pt-6 mt-6 border-t border-neutral-800/60">
          <button 
            onClick={() => setShowArchived(p => !p)} 
            className="flex items-center gap-2 text-neutral-400 hover:text-neutral-200 transition-colors text-sm font-semibold mb-4"
          >
            {showArchived ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Archived Accounts ({archivedUsers.length})
          </button>
          
          {showArchived && (
            <div className="space-y-3">
              {archivedUsers.map(u => renderUserCard(u, true))}
            </div>
          )}
        </div>
      )}

      {/* Archive / Restore Confirmation Modal */}
      {(archivingUser || restoringUser) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className={`bg-neutral-950 border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${archivingUser ? 'border-rose-900/30' : 'border-emerald-900/30'}`}>
            <div className="p-6 text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 border ${
                archivingUser ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              }`}>
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-lg font-bold text-neutral-100 mb-2">
                {archivingUser ? 'Archive Account?' : 'Restore Account?'}
              </h2>
              <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
                {archivingUser 
                  ? <>You are about to archive <strong className="text-neutral-200">{archivingUser.fullName}</strong>. They will immediately lose access to the system. Enter your admin password to confirm.</>
                  : <>You are about to restore <strong className="text-neutral-200">{restoringUser?.fullName}</strong>. They will regain access to the system. Enter your admin password to confirm.</>
                }
              </p>
              
              <form onSubmit={confirmArchiveOrRestore}>
                <div className="relative mb-6 text-left">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Lock size={16} className="text-neutral-500" />
                  </div>
                  <input 
                    type="password" 
                    value={archivePassword}
                    onChange={e => setArchivePassword(e.target.value)}
                    required
                    autoFocus
                    placeholder="Your admin password"
                    className={`w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-sm text-neutral-200 focus:outline-none transition-colors placeholder-neutral-600 ${
                      archivingUser ? 'focus:border-rose-500/50' : 'focus:border-emerald-500/50'
                    }`}
                  />
                </div>
                
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => { setArchivingUser(null); setRestoringUser(null); }}
                    disabled={isArchiving}
                    className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-xl transition-colors font-semibold disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isArchiving || !archivePassword}
                    className={`flex-1 px-4 py-2.5 text-white text-sm rounded-xl transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 ${
                      archivingUser ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                    }`}
                  >
                    {isArchiving ? <RefreshCw size={16} className="animate-spin" /> : archivingUser ? "Archive User" : "Restore User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-amber-900/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center flex-none">
              <div>
                <h2 className="text-base font-bold text-neutral-100">{editingId ? 'Edit User' : 'Add Staff User'}</h2>
                <p className="text-xs text-neutral-500">Staff account details</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleSave} className="overflow-y-auto flex-1 p-6 space-y-4">
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block font-medium">Full Name *</label>
                <input type="text" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} required autoFocus
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-600/50 transition-colors placeholder-neutral-600" placeholder="e.g. Juan dela Cruz" />
              </div>
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block font-medium">Username *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">@</span>
                  <input type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g,'') }))} required
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-7 pr-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-600/50 transition-colors placeholder-neutral-600" placeholder="username" />
                </div>
              </div>
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block font-medium">Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-600/50 transition-colors placeholder-neutral-600" placeholder="user@oneshot.com" />
              </div>
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block font-medium">Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-600/50 transition-colors placeholder-neutral-600" placeholder="09XXXXXXXXX" />
              </div>

              {/* 🚨 STRICT ROLES DROPDOWN */}
              <div>
                <label className="text-xs text-neutral-400 mb-2 block font-medium">Role *</label>
                <select 
                  value={form.role} 
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as StaffUser['role'] }))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-600/50 transition-colors appearance-none cursor-pointer"
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Artist linkage */}
              {form.role === 'tattoo-artist' && (
                <div className="bg-pink-950/20 border border-pink-900/30 rounded-xl p-3">
                  <label className="text-xs text-neutral-400 mb-1.5 block font-medium">Link to Artist Profile</label>
                  <select value={form.artistId} onChange={e => setForm(f => ({ ...f, artistId: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-300 focus:outline-none focus:border-pink-600/50 appearance-none">
                    <option value="">— No link —</option>
                    {tattooArtists.filter(a => a.isActive).map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.specialty})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-neutral-600 mt-1.5">This artist will log in at /staff/login</p>
                </div>
              )}

              {/* Admin toggle - Only shows if role is explicitly Admin */}
              {form.role === 'admin' && (
                <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck size={16} className={form.isAdmin ? 'text-amber-400' : 'text-neutral-600'} />
                      <div>
                        <p className="text-sm font-semibold text-neutral-200">Admin Access Granted</p>
                        <p className="text-[11px] text-neutral-500">Can access the Admin Portal</p>
                      </div>
                    </div>
                    <div className={`w-11 h-6 rounded-full relative transition-colors flex-shrink-0 bg-amber-600`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform translate-x-5`} />
                    </div>
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-xl font-semibold transition-all py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSaving ? <RefreshCw size={14} className="animate-spin" /> : editingId ? <><Pencil size={14} /> Save Changes</> : <><Plus size={14} /> Create User</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}