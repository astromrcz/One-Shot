import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Save, Image as ImageIcon, LayoutTemplate, MapPin, AlignLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../utils/supabase/client';

export function SiteCustomization() {
  const { siteSettings, updateSiteSettings } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const [form, setForm] = useState({
    heroTitle: '',
    heroSubtitle: '',
    heroDescription: '',
    aboutStory: '',
    contactAddress: '',
    contactPhone: '',
    contactEmail: '',
    contactHours: '',
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
      });
    }
  }, [siteSettings]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateSiteSettings(form);
      toast.success('Site settings updated successfully!');
    } catch (error) {
      toast.error('Failed to update site settings.');
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Site Customization</h2>
          <p className="text-sm text-neutral-400">Update your public facing homepage content.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
          Save Changes
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
    </div>
  );
}