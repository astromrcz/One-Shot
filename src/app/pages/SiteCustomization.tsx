import { useState, useEffect } from 'react';
import { useAppContext, Announcement, AnnouncementType } from '../context/AppContext';
import { 
  Save, Image as ImageIcon, LayoutTemplate, MapPin, AlignLeft, 
  ShieldAlert, X, Upload, CheckCircle, RefreshCw, Plus, 
  Megaphone, ToggleRight, ToggleLeft, Pencil, Trash2, Info, 
  AlertTriangle, Star, Calendar 
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '../../utils/supabase/client';

const TYPE_CONFIG: Record<AnnouncementType, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  info:    { label: 'Info',    color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: Info },
  warning: { label: 'Warning', color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: AlertTriangle },
  promo:   { label: 'Promo',   color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  icon: Star },
  event:   { label: 'Event',   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Calendar },
};

type AnnFormState = { title: string; content: string; type: AnnouncementType; isActive: boolean; hasExpiry: boolean; expiresAt: string; };
const annBlank: AnnFormState = { title: '', content: '', type: 'info', isActive: true, hasExpiry: false, expiresAt: '' };

export function SiteCustomization() {
  const { 
    siteSettings, updateSiteSettings, staffProfile,
    announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement, toggleAnnouncement 
  } = useAppContext();

  // --- ANNOUNCEMENT STATES ---
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [annForm, setAnnForm] = useState<AnnFormState>(annBlank);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // --- SITE SETTINGS STATES ---
  const [loading, setLoading] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);  
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [form, setForm] = useState({
    logoUrl: '', heroTitle: '', heroSubtitle: '', heroDescription: '',
    aboutStory: '', contactAddress: '', contactPhone: '', contactEmail: '',
    contactHours: '', heroSliderImages: [] as string[], promoImage: '', aboutImage: ''
  });

  useEffect(() => {
    if (siteSettings) {
      setForm({
        logoUrl: siteSettings.logoUrl || '',
        heroTitle: siteSettings.heroTitle || '',
        heroSubtitle: siteSettings.heroSubtitle || '',
        heroDescription: siteSettings.heroDescription || '',
        aboutStory: siteSettings.aboutStory || '',
        contactAddress: siteSettings.contactAddress || '',
        contactPhone: siteSettings.contactPhone || '',
        contactEmail: siteSettings.contactEmail || '',
        contactHours: siteSettings.contactHours || '',
        heroSliderImages: siteSettings.heroSliderImages || [],
        promoImage: siteSettings.promoImage || '',
        aboutImage: siteSettings.aboutImage || ''
      });
    }
  }, [siteSettings]);

  // --- ANNOUNCEMENT HANDLERS ---
  const openAnnAdd = () => { setEditingAnnId(null); setAnnForm(annBlank); setShowAnnForm(true); };
  const openAnnEdit = (a: Announcement) => {
    setEditingAnnId(a.id);
    setAnnForm({ 
        title: a.title, content: a.content, type: a.type, isActive: a.isActive, 
        hasExpiry: !!a.expiresAt, 
        expiresAt: a.expiresAt ? new Date(a.expiresAt).toISOString().slice(0,16) : '' 
    });
    setShowAnnForm(true);
  };

  const handleAnnSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { 
        title: annForm.title, content: annForm.content, type: annForm.type, 
        isActive: annForm.isActive, 
        expiresAt: annForm.hasExpiry && annForm.expiresAt ? new Date(annForm.expiresAt) : undefined 
    };
    if (editingAnnId) { await updateAnnouncement(editingAnnId, payload); toast.success('Announcement updated!'); }
    else { await addAnnouncement(payload); toast.success('Announcement posted!'); }
    setLoading(false);
    setShowAnnForm(false);
  };

  // --- SITE SETTINGS IMAGE HANDLERS ---
  const uploadDirectToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `custom-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { error } = await supabase.storage.from('site_assets').upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from('site_assets').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSingleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof form) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading('Uploading image...');
    try {
      const url = await uploadDirectToStorage(file);
      setForm(f => ({ ...f, [field]: url }));
      toast.success("Staged! Click Save Changes below.", { id: toastId });
    } catch (error: any) { toast.error("Upload failed: " + error.message, { id: toastId }); }
  };

  const handleSliderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (form.heroSliderImages.length + files.length > 10) { toast.error("Maximum 10 images allowed."); return; }
    const toastId = toast.loading('Uploading images...');
    try {
      const newUrls: string[] = [];
      for (const file of files) {
        const url = await uploadDirectToStorage(file);
        newUrls.push(url);
      }
      setForm(f => ({ ...f, heroSliderImages: [...f.heroSliderImages, ...newUrls] }));
      toast.success("Images staged!", { id: toastId });
    } catch (error: any) { toast.error("Upload failed.", { id: toastId }); }
  };

  const handleConfirmSave = async () => {
    if (!adminPassword) { setPasswordError("Password is required."); return; }
    setLoading(true);
    try {
      const loginIdentifier = staffProfile?.email || staffProfile?.username;
      const { data: user } = await supabase.rpc('verify_staff_login', { p_username: loginIdentifier, p_password: adminPassword });
      if (!user) { setPasswordError("Incorrect admin password."); setLoading(false); return; }
      await updateSiteSettings(form);
      toast.success('Site settings updated successfully!');
      setShowPasswordConfirm(false); setAdminPassword(''); setPasswordError('');
    } catch { toast.error('Failed to update settings.'); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-10 max-w-5xl pb-20">
      
      {/* SECTION 1: ANNOUNCEMENTS (TOP) */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Megaphone className="text-amber-500" size={20} /> Live Announcements
                </h2>
                <p className="text-sm text-neutral-400">Manage the scrolling text alerts on the homepage.</p>
            </div>
            <button onClick={openAnnAdd} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white text-xs px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-amber-900/30">
                <Plus size={14} /> New Announcement
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.length === 0 ? (
                <div className="col-span-full bg-neutral-900/50 border border-neutral-800 border-dashed rounded-2xl p-10 text-center">
                    <Megaphone size={30} className="mx-auto text-neutral-700 mb-3" />
                    <p className="text-neutral-500 text-sm">No active announcements.</p>
                </div>
            ) : announcements.map(a => {
                const cfg = TYPE_CONFIG[a.type];
                const Icon = cfg.icon;
                const isExpired = a.expiresAt && new Date() > new Date(a.expiresAt);
                return (
                    <div key={a.id} className={`bg-neutral-950 border rounded-2xl p-4 flex items-start gap-4 transition-all ${a.isActive && !isExpired ? cfg.border : 'border-neutral-800 opacity-60'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}>
                            <Icon size={16} className={cfg.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-bold text-neutral-100 truncate">{a.title}</p>
                                {isExpired && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase">Expired</span>}
                            </div>
                            <p className="text-xs text-neutral-500 line-clamp-2 mb-2">{a.content}</p>
                            <div className="flex items-center gap-2">
                                <button onClick={() => openAnnEdit(a)} className="p-1.5 text-neutral-500 hover:text-white bg-neutral-900 rounded-lg transition-colors"><Pencil size={12} /></button>
                                <button onClick={() => toggleAnnouncement(a.id)} className={`p-1.5 rounded-lg transition-colors ${a.isActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-neutral-500 bg-neutral-900'}`}>
                                    {a.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                                </button>
                                {deleteConfirm === a.id ? (
                                    <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                                        <button onClick={() => { deleteAnnouncement(a.id); setDeleteConfirm(null); toast.error('Deleted'); }} className="px-2 py-1 text-[9px] bg-rose-600 text-white rounded-md font-bold">Confirm</button>
                                        <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-[9px] bg-neutral-800 text-neutral-400 rounded-md">Cancel</button>
                                    </div>
                                ) : (
                                    <button onClick={() => setDeleteConfirm(a.id)} className="p-1.5 text-neutral-500 hover:text-rose-400 bg-neutral-900 rounded-lg transition-colors"><Trash2 size={12} /></button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </section>

      <hr className="border-neutral-800" />

      {/* SECTION 2: SITE CONTENT */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-xl font-bold text-white">General Site Content</h2>
                <p className="text-sm text-neutral-400">Update logo, images, and static text sections.</p>
            </div>
            <button onClick={() => setShowPasswordConfirm(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20">
                <Save size={16} /> Save Website Changes
            </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
            {/* BRAND LOGO */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-4 uppercase tracking-wider"><ImageIcon size={16} /> Brand Logo</h3>
                <div className="flex items-center gap-6">
                    <div className="relative w-24 h-24 bg-neutral-900 border border-neutral-700 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 group">
                        {form.logoUrl ? (
                            <>
                                <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                                <button onClick={() => setForm(f => ({...f, logoUrl: ''}))} className="absolute inset-0 bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X size={24} />
                                </button>
                            </>
                        ) : ( <ImageIcon className="text-neutral-600" size={32} /> )}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-neutral-400 mb-3">Transparent PNG recommended. This updates header/footer logo.</p>
                        <label className="inline-flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors">
                            <Upload size={14} /> Upload New Logo
                            <input type="file" accept="image/png, image/jpeg" onChange={e => handleSingleImageUpload(e, 'logoUrl')} className="hidden" />
                        </label>
                    </div>
                </div>
            </div>

            {/* SLIDER IMAGES */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 uppercase tracking-wider">HomePage Slider ({form.heroSliderImages.length}/10)</h3>
                    {form.heroSliderImages.length < 10 && (
                        <label className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-500 border border-amber-600/30 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors">
                            Add Photos <input type="file" accept="image/*" multiple onChange={handleSliderUpload} className="hidden" />
                        </label>
                    )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-neutral-900/50 border border-neutral-800 border-dashed rounded-xl p-4 min-h-[120px]">
                    {form.heroSliderImages.map((url, idx) => (
                        <div key={idx} className="relative aspect-video bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden group">
                            <img src={url} className="w-full h-full object-cover" />
                            <button onClick={() => setForm(f => ({ ...f, heroSliderImages: f.heroSliderImages.filter((_, i) => i !== idx) }))} className="absolute top-1.5 right-1.5 bg-rose-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                <X size={12}/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* TEXT FIELDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 uppercase tracking-wider"><LayoutTemplate size={16} /> Hero Text</h3>
                    <input type="text" value={form.heroTitle} onChange={e => setForm({...form, heroTitle: e.target.value})} placeholder="Hero Title" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                    <input type="text" value={form.heroSubtitle} onChange={e => setForm({...form, heroSubtitle: e.target.value})} placeholder="Hero Subtitle" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
                    <textarea value={form.heroDescription} onChange={e => setForm({...form, heroDescription: e.target.value})} rows={2} placeholder="Hero Description" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none" />
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-violet-400 flex items-center gap-2 uppercase tracking-wider"><MapPin size={16} /> Contact & Hours</h3>
                    <input type="text" value={form.contactEmail} onChange={e => setForm({...form, contactEmail: e.target.value})} placeholder="Email" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500" />
                    <textarea value={form.contactPhone} onChange={e => setForm({...form, contactPhone: e.target.value})} placeholder="Phone Numbers" rows={1} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500 resize-none" />
                    <textarea value={form.contactHours} onChange={e => setForm({...form, contactHours: e.target.value})} placeholder="Hours" rows={1} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500 resize-none" />
                </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2 mb-4 uppercase tracking-wider"><AlignLeft size={16} /> About Our Story</h3>
                <textarea value={form.aboutStory} onChange={e => setForm({...form, aboutStory: e.target.value})} rows={5} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-sky-500 resize-none" />
            </div>
        </div>
      </section>

      {/* ANNOUNCEMENT MODAL */}
      {showAnnForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-neutral-950 border border-amber-900/30 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[92vh]">
                <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center flex-none">
                    <h2 className="text-base font-bold text-neutral-100">{editingAnnId ? 'Edit Announcement' : 'New Announcement'}</h2>
                    <button onClick={() => setShowAnnForm(false)} className="p-2 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg"><X size={16} /></button>
                </div>
                <form onSubmit={handleAnnSave} className="overflow-y-auto flex-1 p-6 space-y-4">
                    <input type="text" value={annForm.title} onChange={e => setAnnForm(f=>({...f, title: e.target.value}))} required className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-amber-500 outline-none" placeholder="Title" />
                    <textarea value={annForm.content} onChange={e => setAnnForm(f=>({...f, content: e.target.value}))} required rows={3} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:border-amber-500 outline-none resize-none" placeholder="Details..." />
                    
                    <div className="grid grid-cols-2 gap-2">
                        {(Object.entries(TYPE_CONFIG) as [AnnouncementType, typeof TYPE_CONFIG[AnnouncementType]][]).map(([t, cfg]) => (
                            <button key={t} type="button" onClick={() => setAnnForm(f=>({...f, type: t}))} className={`flex items-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${annForm.type === t ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}>
                                <cfg.icon size={12} /> {cfg.label}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={annForm.hasExpiry} onChange={e => setAnnForm(f=>({...f, hasExpiry: e.target.checked}))} className="rounded border-neutral-700 bg-neutral-900 text-amber-500" />
                            <span className="text-xs text-neutral-400">Set expiry date</span>
                        </label>
                        {annForm.hasExpiry && (
                            <input type="datetime-local" value={annForm.expiresAt} onChange={e => setAnnForm(f=>({...f, expiresAt: e.target.value}))} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white" />
                        )}
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={annForm.isActive} onChange={e => setAnnForm(f=>({...f, isActive: e.target.checked}))} className="rounded border-neutral-700 bg-neutral-900 text-emerald-500" />
                            <span className="text-xs text-neutral-400">Publish immediately</span>
                        </label>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-xl font-bold py-3 flex justify-center items-center gap-2 transition-all">
                        {loading ? <RefreshCw size={14} className="animate-spin" /> : editingAnnId ? 'Update Announcement' : 'Post Announcement'}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* PASSWORD MODAL (RESTORED) */}
      {showPasswordConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert size={20} className="text-amber-500" />
              <h3 className="text-lg font-bold text-white">Confirm Changes</h3>
            </div>
            <p className="text-xs text-neutral-400 mb-5">Admin password required to update live website content.</p>
            {passwordError && <p className="text-xs text-rose-400 mb-3 bg-rose-950/40 border border-rose-800/50 p-2 rounded-lg">{passwordError}</p>}
            <input type="password" value={adminPassword} onChange={e => { setAdminPassword(e.target.value); setPasswordError(''); }} placeholder="Enter Admin Password" 
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white mb-5 focus:outline-none focus:border-amber-500" />
            <div className="flex gap-2">
              <button onClick={() => setShowPasswordConfirm(false)} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-2.5 rounded-lg text-xs font-semibold">Cancel</button>
              <button onClick={handleConfirmSave} disabled={loading} className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-lg text-xs font-bold flex justify-center items-center">
                {loading ? <RefreshCw size={14} className="animate-spin" /> : 'Confirm Save'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}