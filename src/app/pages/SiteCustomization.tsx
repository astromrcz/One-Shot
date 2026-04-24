import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Save, Image as ImageIcon, LayoutTemplate, MapPin, AlignLeft, ShieldAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../utils/supabase/client';

export function SiteCustomization() {
  const { siteSettings, updateSiteSettings, staffProfile, staffUsers } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Password Modal States
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [form, setForm] = useState({
    heroTitle: '',
    heroSubtitle: '',
    heroDescription: '',
    aboutStory: '',
    contactAddress: '',
    contactPhone: '',
    contactEmail: '',
    contactHours: '',
    heroSliderImages: [] as string[],
  });

  useEffect(() => {
    if (siteSettings) {
      setForm({
        heroTitle: siteSettings.heroTitle || '',
        heroSubtitle: siteSettings.heroSubtitle || '',
        heroDescription: siteSettings.heroDescription || '',
        aboutStory: siteSettings.aboutStory || '',
        contactAddress: siteSettings.contactAddress || '',
        contactPhone: siteSettings.contactPhone || '',
        contactEmail: siteSettings.contactEmail || '',
        contactHours: siteSettings.contactHours || '',
        heroSliderImages: siteSettings.heroSliderImages || [],
      });
    }
  }, [siteSettings]);

  const handleConfirmSave = async () => {
    // 1. Verify Password
    const user = staffUsers.find(u => u.username === staffProfile.username);
    if (!user || user.password !== adminPassword) {
      setPasswordError("Incorrect admin password.");
      return;
    }

    // 2. Save if password matches
    setLoading(true);
    try {
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
        const fileExt = file.name.split('.').pop();
        const fileName = `slider-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error } = await supabase.storage.from('site_assets').upload(fileName, file);
        if (error) throw error;
        const { data } = supabase.storage.from('site_assets').getPublicUrl(fileName);
        newUrls.push(data.publicUrl);
      }
      setForm(f => ({ ...f, heroSliderImages: [...f.heroSliderImages, ...newUrls] }));
      toast.success("Images uploaded successfully!", { id: toastId });
    } catch (error: any) {
      toast.error("Failed to upload: " + error.message, { id: toastId });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage.from('site_assets').upload(fileName, file);
      if (error) throw error;
      
      const { data } = supabase.storage.from('site_assets').getPublicUrl(fileName);
      await updateSiteSettings({ logoUrl: data.publicUrl });
      toast.success("Logo updated successfully!");
    } catch (error: any) {
      toast.error("Failed to upload logo: " + error.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleGenericUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof typeof siteSettings) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading(`Uploading ${fieldName}...`);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${fieldName}-${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage.from('site_assets').upload(fileName, file);
      if (error) throw error;
      
      const { data } = supabase.storage.from('site_assets').getPublicUrl(fileName);
      await updateSiteSettings({ [fieldName]: data.publicUrl });
      toast.success("Image updated successfully!", { id: toastId });
    } catch (error: any) {
      toast.error("Failed to upload image: " + error.message, { id: toastId });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Site Customization</h2>
          <p className="text-sm text-neutral-400">Update your public facing homepage content.</p>
        </div>
        <button 
          onClick={() => setShowPasswordConfirm(true)} 
          className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors"
        >
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Logo Section */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-4 uppercase tracking-wider"><ImageIcon size={16} /> Brand Logo</h3>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-neutral-900 border border-neutral-700 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
              {siteSettings?.logoUrl ? (
                <img src={siteSettings.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <ImageIcon className="text-neutral-600" size={32} />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-neutral-400 mb-3">Upload a transparent PNG for best results. This will replace the logo in the header and footer.</p>
              <input 
                type="file" 
                accept="image/png, image/jpeg" 
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-neutral-800 file:text-neutral-300 hover:file:bg-neutral-700 cursor-pointer"
              />
              {uploadingLogo && <p className="text-xs text-amber-500 mt-2 animate-pulse">Uploading...</p>}
            </div>
          </div>
        </div>

        {/* 🚨 NEW COMPACT HERO SLIDER (Max 10) 🚨 */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 uppercase tracking-wider">
              <ImageIcon size={16} /> Hero Slider Images ({form.heroSliderImages.length}/10)
            </h3>
            {form.heroSliderImages.length < 10 && (
              <label className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-500 border border-amber-600/30 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors">
                Upload Photos
                <input type="file" accept="image/*" multiple onChange={handleSliderUpload} className="hidden" />
              </label>
            )}
          </div>
          <p className="text-xs text-neutral-500 mb-4">Upload up to 10 images. They will automatically cycle on the homepage. Click the red X to remove an image.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-neutral-900/50 border border-neutral-800 border-dashed rounded-xl p-4">
             {form.heroSliderImages.map((url, idx) => (
                <div key={idx} className="relative aspect-video bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden group">
                  <img src={url} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setForm(f => ({ ...f, heroSliderImages: f.heroSliderImages.filter((_, i) => i !== idx) }))} 
                    className="absolute top-1.5 right-1.5 bg-rose-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12}/>
                  </button>
                </div>
             ))}
             {form.heroSliderImages.length === 0 && (
               <div className="col-span-full py-4 flex items-center justify-center text-neutral-600 text-xs">No images uploaded. The default system images will be shown.</div>
             )}
          </div>
        </div>

        {/* Content Images */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2 mb-4 uppercase tracking-wider"><ImageIcon size={16} /> Content Images</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-neutral-300">Promo Banner</p>
              <div className="aspect-[21/9] bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden flex items-center justify-center">
                {siteSettings?.promoImage ? <img src={siteSettings.promoImage} className="w-full h-full object-cover" /> : <ImageIcon className="text-neutral-600" size={24} />}
              </div>
              <input type="file" accept="image/*" onChange={e => handleGenericUpload(e, 'promoImage')} className="text-[10px] w-full text-neutral-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-neutral-800 file:text-neutral-300 hover:file:bg-neutral-700 cursor-pointer" />
            </div>
            
            <div className="space-y-3">
              <p className="text-xs font-semibold text-neutral-300">About Us Story</p>
              <div className="aspect-[21/9] bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden flex items-center justify-center">
                {siteSettings?.aboutImage ? <img src={siteSettings.aboutImage} className="w-full h-full object-cover" /> : <ImageIcon className="text-neutral-600" size={24} />}
              </div>
              <input type="file" accept="image/*" onChange={e => handleGenericUpload(e, 'aboutImage')} className="text-[10px] w-full text-neutral-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-neutral-800 file:text-neutral-300 hover:file:bg-neutral-700 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-4 uppercase tracking-wider"><LayoutTemplate size={16} /> Hero Section</h3>
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

        {/* About Section */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2 mb-4 uppercase tracking-wider"><AlignLeft size={16} /> About Us Story</h3>
          <div>
            <label className="block text-xs text-neutral-500 mb-1.5 font-semibold">Our Story (Use line breaks for paragraphs)</label>
            <textarea value={form.aboutStory} onChange={e => setForm({...form, aboutStory: e.target.value})} rows={6} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 resize-none" />
          </div>
        </div>

        {/* Contact Section */}
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