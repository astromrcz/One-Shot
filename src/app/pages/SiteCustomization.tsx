import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Save, Image as ImageIcon, LayoutTemplate, MapPin, AlignLeft, ShieldAlert, X, Upload, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../utils/supabase/client';

export function SiteCustomization() {
  const { siteSettings, updateSiteSettings, staffProfile } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  
  // Password Modal States
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);  
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Staged Form State
  const [form, setForm] = useState({
    logoUrl: '',
    heroTitle: '',
    heroSubtitle: '',
    heroDescription: '',
    aboutStory: '',
    contactAddress: '',
    contactPhone: '',
    contactEmail: '',
    contactHours: '',
    heroSliderImages: [] as string[],
    promoImage: '',
    aboutImage: ''
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

  // 🚨 STAGE 1: Upload to Storage (Does NOT go live yet)
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
      toast.success("Image staged! Click Save Changes to apply.", { id: toastId });
    } catch (error: any) {
      toast.error("Failed to upload: " + error.message, { id: toastId });
    }
  };

  const handleSliderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    if (form.heroSliderImages.length + files.length > 10) {
      toast.error("You can only have a maximum of 10 slider images.");
      return;
    }

    const toastId = toast.loading('Uploading images...');
    try {
      const newUrls: string[] = [];
      for (const file of files) {
        const url = await uploadDirectToStorage(file);
        newUrls.push(url);
      }
      setForm(f => ({ ...f, heroSliderImages: [...f.heroSliderImages, ...newUrls] }));
      toast.success("Images staged! Click Save Changes to apply.", { id: toastId });
    } catch (error: any) {
      toast.error("Failed to upload: " + error.message, { id: toastId });
    }
  };

  // 🚨 STAGE 2: Secure Password Verification & Database Save
  const handleConfirmSave = async () => {
    if (!adminPassword) {
      setPasswordError("Password is required.");
      return;
    }

    setLoading(true);
    try {
      const loginIdentifier = staffProfile?.email || staffProfile?.username;
      
      // Verifies the typed password against the secure Database Hash!
      const { data: user } = await supabase.rpc('verify_staff_login', { 
          p_username: loginIdentifier, 
          p_password: adminPassword 
      });

      if (!user) {
        setPasswordError("Incorrect admin password.");
        setLoading(false);
        return;
      }

      await updateSiteSettings(form);
      toast.success('Site settings updated successfully!');
      setShowPasswordConfirm(false);
      setAdminPassword('');
      setPasswordError('');
    } catch (error) {
      toast.error('Failed to update site settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Site Customization</h2>
          <p className="text-sm text-neutral-400">Update your public facing homepage content.</p>
        </div>
        <button 
          onClick={() => setShowPasswordConfirm(true)} 
          className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-amber-900/20"
        >
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">

        {/* 🚨 RESTORED: BRAND LOGO */}
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
              ) : (
                <ImageIcon className="text-neutral-600" size={32} />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-neutral-400 mb-3">Upload a transparent PNG for best results. This replaces the logo in the header and footer.</p>
              <label className="inline-flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors">
                <Upload size={14} /> Choose Logo Image
                <input type="file" accept="image/png, image/jpeg" onChange={e => handleSingleImageUpload(e, 'logoUrl')} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* HERO SLIDER (Max 10) */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 uppercase tracking-wider">
              <ImageIcon size={16} /> HomePage Slider Images ({form.heroSliderImages.length}/10)
            </h3>
            {form.heroSliderImages.length < 10 && (
              <label className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-500 border border-amber-600/30 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors">
                Upload Photos
                <input type="file" accept="image/*" multiple onChange={handleSliderUpload} className="hidden" />
              </label>
            )}
          </div>
          <p className="text-xs text-neutral-500 mb-4">Upload up to 10 images. They will automatically cycle on the homepage. Click the red X to remove an image.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-neutral-900/50 border border-neutral-800 border-dashed rounded-xl p-4 min-h-[120px]">
             {form.heroSliderImages.map((url, idx) => (
                <div key={idx} className="relative aspect-video bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden group">
                  <img src={url} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setForm(f => ({ ...f, heroSliderImages: f.heroSliderImages.filter((_, i) => i !== idx) }))} 
                    className="absolute top-1.5 right-1.5 bg-rose-600 text-white p-1 rounded-md opacity-0 md:group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X size={12}/>
                  </button>
                </div>
             ))}
             {form.heroSliderImages.length === 0 && (
               <div className="col-span-full py-6 flex flex-col items-center justify-center text-neutral-600 text-xs">
                 <ImageIcon size={24} className="mb-2 opacity-50" />
                 No images uploaded. The default system images will be shown.
               </div>
             )}
          </div>
        </div>

        {/* PROMO & ABOUT IMAGES */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2 mb-4 uppercase tracking-wider"><ImageIcon size={16} /> Content Images</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Promo Image */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <p className="text-xs font-semibold text-neutral-300">Promo Banner</p>
                <label className="text-[10px] uppercase tracking-wider font-bold text-sky-400 hover:text-sky-300 cursor-pointer">
                  Upload <input type="file" accept="image/*" onChange={e => handleSingleImageUpload(e, 'promoImage')} className="hidden" />
                </label>
              </div>
              <div className="relative aspect-[21/9] bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden flex items-center justify-center group">
                {form.promoImage ? (
                  <>
                    <img src={form.promoImage} className="w-full h-full object-cover" />
                    <button onClick={() => setForm(f => ({...f, promoImage: ''}))} className="absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-lg opacity-0 md:group-hover:opacity-100 transition-opacity shadow-lg"><X size={14}/></button>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-neutral-600"><ImageIcon size={24} className="mb-1" /><span className="text-[10px]">Default active</span></div>
                )}
              </div>
            </div>
            
            {/* About Image */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <p className="text-xs font-semibold text-neutral-300">About Us Story</p>
                <label className="text-[10px] uppercase tracking-wider font-bold text-sky-400 hover:text-sky-300 cursor-pointer">
                  Upload <input type="file" accept="image/*" onChange={e => handleSingleImageUpload(e, 'aboutImage')} className="hidden" />
                </label>
              </div>
              <div className="relative aspect-[21/9] bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden flex items-center justify-center group">
                {form.aboutImage ? (
                  <>
                    <img src={form.aboutImage} className="w-full h-full object-cover" />
                    <button onClick={() => setForm(f => ({...f, aboutImage: ''}))} className="absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-lg opacity-0 md:group-hover:opacity-100 transition-opacity shadow-lg"><X size={14}/></button>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-neutral-600"><ImageIcon size={24} className="mb-1" /><span className="text-[10px]">Default active</span></div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* HERO TEXT SECTION */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-4 uppercase tracking-wider"><LayoutTemplate size={16} /> Hero Text Content</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5 font-semibold">Hero Title</label>
                <input type="text" value={form.heroTitle} onChange={e => setForm({...form, heroTitle: e.target.value})} placeholder="e.g. One Shot" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5 font-semibold">Hero Subtitle</label>
                <input type="text" value={form.heroSubtitle} onChange={e => setForm({...form, heroSubtitle: e.target.value})} placeholder="e.g. Bar & Billiards" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1.5 font-semibold">Hero Description</label>
              <textarea value={form.heroDescription} onChange={e => setForm({...form, heroDescription: e.target.value})} rows={2} placeholder="Your premier billiard destination..." className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 resize-none" />
            </div>
          </div>
        </div>

        {/* ABOUT TEXT SECTION */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2 mb-4 uppercase tracking-wider"><AlignLeft size={16} /> About Us Story</h3>
          <div>
            <label className="block text-xs text-neutral-500 mb-1.5 font-semibold">Our Story (Use line breaks for paragraphs)</label>
            <textarea value={form.aboutStory} onChange={e => setForm({...form, aboutStory: e.target.value})} rows={6} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 resize-none" />
          </div>
        </div>

        {/* CONTACT TEXT SECTION */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-violet-400 flex items-center gap-2 mb-4 uppercase tracking-wider"><MapPin size={16} /> Contact Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-500 mb-1.5 font-semibold">Address</label>
              <textarea value={form.contactAddress} onChange={e => setForm({...form, contactAddress: e.target.value})} rows={2} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1.5 font-semibold">Operating Hours</label>
              <textarea value={form.contactHours} onChange={e => setForm({...form, contactHours: e.target.value})} rows={2} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1.5 font-semibold">Phone / Viber</label>
              <textarea value={form.contactPhone} onChange={e => setForm({...form, contactPhone: e.target.value})} rows={2} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1.5 font-semibold">Email Address</label>
              <input type="text" value={form.contactEmail} onChange={e => setForm({...form, contactEmail: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500" />
            </div>
          </div>
        </div>

      </div>

      {/* PASSWORD CONFIRMATION MODAL */}
      {showPasswordConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert size={20} className="text-amber-500" />
              <h3 className="text-lg font-bold text-white">Confirm Changes</h3>
            </div>
            <p className="text-xs text-neutral-400 mb-5">Please enter your admin password to apply these updates to the live website.</p>
            
            {passwordError && <p className="text-xs text-rose-400 mb-3 bg-rose-950/40 border border-rose-800/50 p-2 rounded-lg">{passwordError}</p>}
            
            <input 
              type="password" 
              value={adminPassword} 
              onChange={e => { setAdminPassword(e.target.value); setPasswordError(''); }} 
              placeholder="Enter Admin Password" 
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white mb-5 focus:outline-none focus:border-amber-500" 
            />
            
            <div className="flex gap-2">
              <button onClick={() => { setShowPasswordConfirm(false); setAdminPassword(''); setPasswordError(''); }} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-2.5 rounded-lg text-xs font-semibold transition-colors">Cancel</button>
              <button onClick={handleConfirmSave} disabled={loading} className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-lg text-xs font-semibold transition-colors flex justify-center items-center">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}