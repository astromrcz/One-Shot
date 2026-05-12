import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, X, CheckCircle, ArrowRight,
  Phone, Calendar, Clock, User, AlertCircle, FileText, Shield,
  ImagePlus, Trash2, Wand2, Sparkles
} from 'lucide-react';
import { useAppContext, TATTOO_DEPOSIT } from '../context/AppContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { supabase } from '../../utils/supabase/client';

import tattooImg1 from '@/app/assets/4ecf05cd3c60cfbf6be0fc00794d2398915a7b40.png';
import tattooImg2 from '@/app/assets/afb5043a13bb3505979bbbad912e2d572ebed207.png';
import tattooImg3 from '@/app/assets/2f188da8dacd0f992505b4f11fbe67f8e9f7c369.png';
import tattooImg4 from '@/app/assets/fd6942fee056e3b615efe7cd116d0c2bba0f1f84.png';
import tattooImg5 from '@/app/assets/830c44fd25fb8f30ae66601d56b2e9f05cebeec7.png';
import gcashQrImg from '@/app/assets/GcashOneShot.jpg';

export const TATTOO_SLIDES = [
  { src: tattooImg1, caption: 'Black & Grey Masterwork' },
  { src: tattooImg2, caption: 'Precision Line Work' },
  { src: tattooImg3, caption: 'Fine Detail Artistry' },
  { src: tattooImg4, caption: 'In the Studio' },
  { src: tattooImg5, caption: 'Neck & Collar Piece' },
];

export const TATTOO_TIME_SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
export const PLACEMENTS = ['Wrist', 'Forearm', 'Upper Arm', 'Shoulder', 'Chest', 'Upper Back', 'Lower Back', 'Neck', 'Thigh', 'Leg', 'Ankle', 'Other'];
export const SIZES = ['Micro (under 1 in)', 'Small (1–2 in)', 'Medium (3–5 in)', 'Large (6+ in)', 'Full piece (custom quote)'];
export const COLOR_STYLES = ['Black & Grey', 'Traditional Color', 'Neo-Traditional', 'Watercolor', 'Fine Line / Blackwork', 'Geometric', 'Other'];

const AI_PROMPTS = [
  "Neo-traditional Tiger",
  "Fine-line Floral Sleeve",
  "Japanese Koi Fish",
  "Minimalist Geometric",
  "Watercolor Abstract"
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── 🚨 FIXED: Mini Calendar now accepts closedDates ────────────────────────────
export function MiniCalendar({ selectedDate, onSelect, closedDates }: { selectedDate: Date | null; onSelect: (d: Date) => void; closedDates: { date: string; reason: string }[] }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [viewDate, setViewDate] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; });

  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const cells: Array<{ day: number; current: boolean; date: Date }> = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, current: false, date: new Date(year, month - 1, prevDays - i) });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true, date: new Date(year, month, d) });
  const rem = 42 - cells.length;
  for (let d = 1; d <= rem; d++) cells.push({ day: d, current: false, date: new Date(year, month + 1, d) });

  const isSelected = (d: Date) => selectedDate ? (() => { const s = new Date(selectedDate); s.setHours(0,0,0,0); return s.getTime() === d.getTime(); })() : false;
  const isToday = (d: Date) => d.getTime() === today.getTime();
  const isPast = (d: Date) => d < today;

  return (
    <div className="bg-neutral-900 rounded-xl border border-neutral-700 p-3 select-none">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => { const d = new Date(viewDate); d.setMonth(d.getMonth() - 1); setViewDate(d); }} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800">
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs font-semibold text-white">{MONTHS[month]} {year}</span>
        <button type="button" onClick={() => { const d = new Date(viewDate); d.setMonth(d.getMonth() + 1); setViewDate(d); }} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800">
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS_OF_WEEK.map(d => <div key={d} className="text-center text-[9px] text-neutral-500 font-semibold py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map(({ day, current, date }, idx) => {
          const past = isPast(date), sel = isSelected(date), tod = isToday(date);
          const clickable = current && !past;
          
          // 🚨 CHECK IF CLOSED
          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          const closedInfo = current ? closedDates.find(cd => cd.date === dateStr) : null;

          return (
            <button key={idx} type="button" disabled={!clickable} onClick={() => clickable && onSelect(date)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-md text-[11px] transition-all
                ${!current ? 'opacity-20 cursor-default' : ''}
                ${past && current ? 'opacity-30 cursor-default text-neutral-600' : ''}
                ${sel && !closedInfo ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/50' : ''}
                ${sel && closedInfo ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50' : ''}
                ${!sel && closedInfo && clickable ? 'bg-rose-950/30 border border-rose-800/50 text-rose-400 hover:bg-rose-900/40' : ''}
                ${!sel && !closedInfo && tod ? 'border border-violet-500 text-violet-400' : ''}
                ${!sel && !closedInfo && clickable && !tod ? 'text-neutral-300 hover:bg-neutral-800 hover:text-white' : ''}
              `}>
              <span>{day}</span>
              {closedInfo && current && !past && (
                <span className="text-[7px] font-bold uppercase tracking-wider mt-0.5 leading-none">Closed</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Agreement text ─────────────────────────────────────────────
const AGREEMENT_TEXT = `SERVICE AGREEMENT — One Shot Bar & Billiards Tattoo Studio\n\n1. All tattoo services are final. No refunds once the service has begun.\n2. The ₱500 deposit is non-refundable but may be transferred to a rescheduled appointment within 7 days with prior notice.\n3. Clients must be at least 18 years of age. Valid ID may be required on the day of the appointment.\n4. One Shot Bar & Billiards reserves the right to decline service at management's discretion.\n5. Final pricing may vary based on design complexity, size, and session duration.\n6. Free touch-ups are included within 30 days for minor corrections at the artist's discretion.\n7. Please arrive 15 minutes before your scheduled appointment. A grace period of 15 minutes applies; late arrivals may result in rescheduling.\n8. One Shot Bar & Billiards is not liable for allergic reactions or complications arising from improper aftercare.`;
const CONSENT_TEXT = `INFORMED CONSENT — Tattoo Services\n\nBy checking this box, I confirm the following:\n\n1. I am at least 18 years of age and of sound mind.\n2. I am NOT currently pregnant or breastfeeding.\n3. I do not have any known blood-borne diseases, keloid-prone skin, or conditions that impair healing.\n4. I am NOT currently on blood-thinning medications (e.g., aspirin, warfarin) unless cleared by a physician.\n5. I am NOT intoxicated or under the influence of any substances.\n6. I understand that tattooing involves needles and permanent body modification, and carries inherent risks including (but not limited to) infection, scarring, and allergic reactions.\n7. I acknowledge that healing results vary per individual and proper aftercare is my responsibility.\n8. I release One Shot Bar & Billiards, its staff, and its tattoo artists from liability for complications resulting from failure to follow aftercare instructions.`;

export function TattooBookingFlow({ currentUserName, currentUserEmail, onCancel }: { currentUserName?: string, currentUserEmail?: string, onCancel: () => void }) {
  // 🚨 ADDED closedDates from context
  const { addTattooReservation, tattooArtists, closedDates } = useAppContext();
  
  const [modalStep, setModalStep] = useState(1);
  const [tattooDate, setTattooDate] = useState<Date | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [inspirationImages, setInspirationImages] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: currentUserName || '',
    email: currentUserEmail || '',
    phone: '',
    artistId: '',
    timeSlot: '14:00',
    placement: '',
    estimatedSize: '',
    colorStyle: '',
    designDescription: '',
  });

  const [agreementChecked, setAgreementChecked] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  const selectedArtist = tattooArtists.find(a => a.id === form.artistId);

  // 🚨 Check if selected date is closed
  const selectedDateStr = tattooDate 
    ? `${tattooDate.getFullYear()}-${String(tattooDate.getMonth() + 1).padStart(2, '0')}-${String(tattooDate.getDate()).padStart(2, '0')}` 
    : null;
  const selectedClosedDate = closedDates.find(cd => cd.date === selectedDateStr);

  const canProceedStep1 = !!tattooDate && !selectedClosedDate && !!form.artistId && !!form.name && !!form.phone && !!form.email;
  const canProceedStep2 = !!form.placement && !!form.estimatedSize && !!form.colorStyle && !!form.designDescription;
  const canProceedStep3 = agreementChecked && consentChecked;

  const processFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (inspirationImages.length + validFiles.length > 5) {
      alert('Maximum 5 inspiration images allowed.');
      return;
    }
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        if (result) setInspirationImages(prev => prev.length < 5 ? [...prev, result] : prev);
      };
      reader.readAsDataURL(file);
    });
  }, [inspirationImages.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const removeImage = (idx: number) => {
    setInspirationImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFinalSubmit = async () => {
    if (!selectedArtist || !tattooDate) return;
    
    const cleanRef = referenceNumber.replace(/\s/g, '');
    if (!referenceNumber || cleanRef.length !== 13) {
      setUploadError("Please enter a valid 13-digit GCash Reference Number.");
      return;
    }
    if (!receiptFile) {
      setUploadError("Please upload a screenshot of your GCash receipt.");
      return;
    }

    setConfirmingPayment(true);
    setUploadError('');

    try {
      const { data: existingRef } = await supabase
        .from('tattoo_reservations')
        .select('id')
        .eq('payment_reference', referenceNumber)
        .maybeSingle();

      if (existingRef) {
        throw new Error("This GCash reference number has already been used. Please provide a valid, unique receipt.");
      }

      let receiptUrl = '';
      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `tattoo-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { data, error } = await supabase.storage.from('receipts').upload(fileName, receiptFile);
        if (error) throw error;
        receiptUrl = supabase.storage.from('receipts').getPublicUrl(fileName).data.publicUrl;
      }

      const resDate = new Date(tattooDate);
      const [h, m] = form.timeSlot.split(':').map(Number);
      resDate.setHours(h, m, 0, 0);

      await addTattooReservation({
        customerName: form.name,
        contactNumber: form.phone,
        email: form.email,
        date: resDate,
        timeSlot: form.timeSlot,
        artistId: selectedArtist.id,
        artistName: selectedArtist.name,
        artistContact: selectedArtist.contactNumber,
        placement: form.placement,
        estimatedSize: form.estimatedSize,
        designDescription: form.designDescription,
        colorStyle: form.colorStyle,
        agreementSigned: agreementChecked,
        consentSigned: consentChecked,
        status: 'pending',
        depositAmount: TATTOO_DEPOSIT,
        depositPaid: true,
        inspirationImages: inspirationImages.length > 0 ? inspirationImages : undefined,
        paymentReference: referenceNumber,
        receiptUrl: receiptUrl,
      });

      setConfirmingPayment(false);
      setModalStep(5);
    } catch (err: any) {
      setUploadError(err.message || "Failed to process payment details.");
      setConfirmingPayment(false);
    }
  };

  if (modalStep === 5) {
    return (
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-auto">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
          className="w-16 h-16 rounded-full bg-violet-600/15 border border-violet-600/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-violet-400" />
        </motion.div>
        <h3 className="text-xl font-black text-white mb-2">Tattoo Session Booked!</h3>
        <p className="text-neutral-500 text-sm mb-5 leading-relaxed">
          Your appointment with <strong className="text-neutral-200">{selectedArtist?.name}</strong> on <strong className="text-neutral-200">{tattooDate?.toLocaleDateString('en-PH', { month: 'long', day: 'numeric' })}</strong> at <strong className="text-neutral-200">{form.timeSlot}</strong> is pending confirmation.
        </p>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-5 text-xs space-y-1.5 text-left">
          <div className="flex justify-between"><span className="text-neutral-500">Name</span><span className="text-neutral-200">{form.name}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Placement</span><span className="text-neutral-200">{form.placement}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Deposit</span><span className="text-violet-400 font-semibold">₱{TATTOO_DEPOSIT}.00 ✓</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Status</span><span className="text-amber-400">Pending Confirmation</span></div>
        </div>
        <button onClick={onCancel} className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl text-sm font-semibold transition-all">
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-2xl mx-auto shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-base font-bold text-white">Tattoo Reservation</h3>
          <p className="text-xs text-neutral-500">
            Step {modalStep} of 4 · {['', 'Schedule & Artist', 'Tattoo Details', 'Agreement & Consent', 'Deposit Payment'][modalStep]}
          </p>
        </div>
        <button onClick={onCancel} className="text-neutral-600 hover:text-neutral-300 transition-colors"><X size={18} /></button>
      </div>

      <div className="h-1 bg-neutral-800 flex-shrink-0">
        <div className="h-full bg-violet-600 transition-all duration-500" style={{ width: `${(modalStep / 4) * 100}%` }} />
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-h-[70vh]">
        {modalStep === 1 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Full Name <span className="text-rose-500">*</span></label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Juan dela Cruz"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Contact Number <span className="text-rose-500">*</span></label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="09XX-XXX-XXXX"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-violet-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Email Address <span className="text-rose-500">*</span></label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="juan@email.com"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-violet-500" />
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-2">Preferred Date <span className="text-rose-500">*</span></label>
              <MiniCalendar selectedDate={tattooDate} onSelect={setTattooDate} closedDates={closedDates} />
              
              {tattooDate && !selectedClosedDate && (
                <div className="mt-2 flex items-center gap-2 bg-violet-600/10 border border-violet-600/25 rounded-lg px-3 py-2">
                  <CheckCircle size={13} className="text-violet-400" />
                  <span className="text-xs text-violet-300">{tattooDate.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )}
              {tattooDate && selectedClosedDate && (
                <div className="mt-2 bg-rose-950/20 border border-rose-800/30 rounded-lg p-3 text-center flex flex-col items-center gap-2">
                   <AlertCircle size={16} className="text-rose-500" />
                   <p className="text-rose-400 text-xs font-bold">Store Closed</p>
                   <p className="text-neutral-300 text-[10px]">{selectedClosedDate.reason}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Preferred Time</label>
              <div className="grid grid-cols-4 gap-1.5">
                {TATTOO_TIME_SLOTS.map(t => (
                  <button type="button" key={t} onClick={() => setForm(f => ({ ...f, timeSlot: t }))}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all ${form.timeSlot === t ? 'bg-violet-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Select Tattoo Artist <span className="text-rose-500">*</span></label>
              <div className="space-y-2">
                {tattooArtists.map(artist => (
                  <button type="button" key={artist.id} disabled={!artist.isAvailableToday}
                    onClick={() => artist.isAvailableToday && setForm(f => ({ ...f, artistId: artist.id }))}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      !artist.isAvailableToday ? 'opacity-40 cursor-not-allowed border-neutral-800 bg-neutral-900/40' :
                      form.artistId === artist.id ? 'border-violet-500 bg-violet-600/10' :
                      'border-neutral-800 bg-neutral-900/60 hover:border-neutral-600'
                    }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${form.artistId === artist.id ? 'bg-violet-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}>
                      {artist.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-200">{artist.name}
                        {!artist.isAvailableToday && <span className="ml-2 text-[10px] text-neutral-600 font-normal">(Not available today)</span>}
                      </p>
                      <p className="text-[10px] text-neutral-500">{artist.specialty}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-neutral-500 flex items-center gap-1"><Phone size={9} />{artist.contactNumber}</p>
                      {form.artistId === artist.id && <CheckCircle size={14} className="text-violet-400 ml-auto mt-1" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {modalStep === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Placement Area <span className="text-rose-500">*</span></label>
                <select value={form.placement} onChange={e => setForm(f => ({ ...f, placement: e.target.value }))}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-violet-500 appearance-none">
                  <option value="" disabled>Select placement...</option>
                  {PLACEMENTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Estimated Size <span className="text-rose-500">*</span></label>
                <select value={form.estimatedSize} onChange={e => setForm(f => ({ ...f, estimatedSize: e.target.value }))}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-violet-500 appearance-none">
                  <option value="" disabled>Select size...</option>
                  {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Color Style <span className="text-rose-500">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_STYLES.map(cs => (
                  <button type="button" key={cs} onClick={() => setForm(f => ({ ...f, colorStyle: cs }))}
                    className={`py-2 px-3 rounded-lg text-xs font-medium text-left transition-all border ${form.colorStyle === cs ? 'bg-violet-600/20 border-violet-500 text-violet-300' : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:border-neutral-600'}`}>
                    {cs}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Design Description <span className="text-rose-500">*</span></label>
              <textarea value={form.designDescription} onChange={e => setForm(f => ({ ...f, designDescription: e.target.value }))}
                placeholder="Describe your tattoo idea in detail — subject, style, elements you want included..."
                rows={4}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-violet-500 resize-none" />
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1.5 flex items-center gap-1.5">
                <ImagePlus size={12} className="text-violet-400" />
                Inspiration Images <span className="text-neutral-600">(optional · max 5)</span>
              </label>
              <div
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  isDragOver ? 'border-violet-500 bg-violet-500/10' : 'border-neutral-700 hover:border-violet-600/60 hover:bg-violet-600/5'
                } ${inspirationImages.length >= 5 ? 'opacity-40 pointer-events-none' : ''}`}
              >
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => processFiles(e.target.files)} />
                <ImagePlus size={22} className={`mx-auto mb-2 ${isDragOver ? 'text-violet-400' : 'text-neutral-600'}`} />
                <p className="text-xs text-neutral-500">{isDragOver ? 'Drop images here' : 'Drag & drop or click to upload inspiration images'}</p>
                <p className="text-[10px] text-neutral-700 mt-1">JPG, PNG, WEBP · {inspirationImages.length}/5 uploaded</p>
              </div>

              {inspirationImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {inspirationImages.map((src, idx) => (
                    <div key={`insp-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border border-neutral-700">
                      <img src={src} alt={`Inspiration ${idx + 1}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={e => { e.stopPropagation(); removeImage(idx); }}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={14} className="text-rose-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-xs space-y-1.5">
              <p className="text-neutral-500 uppercase tracking-wider font-semibold mb-2">Session Summary</p>
              <div className="flex justify-between"><span className="text-neutral-500">Artist</span><span className="text-neutral-200">{selectedArtist?.name}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Date & Time</span><span className="text-neutral-200">{tattooDate?.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} · {form.timeSlot}</span></div>
            </div>
          </div>
        )}

        {modalStep === 3 && (
          <div className="space-y-5">
            <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-3 flex gap-2.5">
              <AlertCircle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300 leading-relaxed">Please read both forms carefully and check both boxes to proceed. These are required before your tattoo session.</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800 bg-neutral-900">
                <FileText size={14} className="text-violet-400" />
                <p className="text-xs font-semibold text-neutral-200">Service Agreement</p>
              </div>
              <div className="p-4 max-h-40 overflow-y-auto">
                <pre className="text-[10px] text-neutral-500 leading-relaxed whitespace-pre-wrap font-sans">{AGREEMENT_TEXT}</pre>
              </div>
              <div className="px-4 py-3 border-t border-neutral-800 bg-neutral-900/60">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border flex-shrink-0 transition-all ${agreementChecked ? 'bg-violet-600 border-violet-600' : 'border-neutral-600 bg-neutral-800 group-hover:border-violet-500'}`}
                    onClick={() => setAgreementChecked(p => !p)}>
                    {agreementChecked && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <span className="text-xs text-neutral-300 leading-relaxed" onClick={() => setAgreementChecked(p => !p)}>
                    I have read and agree to the <strong className="text-violet-400">Service Agreement</strong> for tattoo services at One Shot Bar & Billiards.
                  </span>
                </label>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800 bg-neutral-900">
                <Shield size={14} className="text-emerald-400" />
                <p className="text-xs font-semibold text-neutral-200">Informed Consent</p>
              </div>
              <div className="p-4 max-h-40 overflow-y-auto">
                <pre className="text-[10px] text-neutral-500 leading-relaxed whitespace-pre-wrap font-sans">{CONSENT_TEXT}</pre>
              </div>
              <div className="px-4 py-3 border-t border-neutral-800 bg-neutral-900/60">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border flex-shrink-0 transition-all ${consentChecked ? 'bg-emerald-600 border-emerald-600' : 'border-neutral-600 bg-neutral-800 group-hover:border-emerald-500'}`}
                    onClick={() => setConsentChecked(p => !p)}>
                    {consentChecked && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <span className="text-xs text-neutral-300 leading-relaxed" onClick={() => setConsentChecked(p => !p)}>
                    I provide my <strong className="text-emerald-400">informed consent</strong> to receive tattoo services. I confirm all statements above are true.
                  </span>
                </label>
              </div>
            </div>
            {!canProceedStep3 && <p className="text-[10px] text-neutral-600 text-center">Both checkboxes must be checked to proceed.</p>}
          </div>
        )}

        {modalStep === 4 && (
          <div className="space-y-5">
            <div className="bg-violet-950/30 border border-violet-800/30 rounded-xl p-4 text-center">
              <p className="text-xs text-violet-400 mb-1">Reservation Deposit</p>
              <p className="text-4xl font-black text-violet-300">₱{TATTOO_DEPOSIT}.00</p>
              <p className="text-xs text-neutral-600 mt-1">Transferable within 7 days · Non-refundable if cancelled within 24h</p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-xs space-y-1.5">
              <div className="flex justify-between"><span className="text-neutral-500">Customer</span><span className="text-neutral-200">{form.name}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Artist</span><span className="text-neutral-200">{selectedArtist?.name}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Date</span><span className="text-neutral-200">{tattooDate?.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Placement</span><span className="text-neutral-200">{form.placement}</span></div>
            </div>

            <div className="flex flex-col items-center gap-3 bg-blue-900/10 border border-blue-900/30 p-6 rounded-2xl">
              <div className="bg-white p-2 rounded-xl inline-block w-32 h-32 flex items-center justify-center shadow-lg">
                <img src={gcashQrImg} alt="GCash QR Code" className="w-full h-full object-contain rounded-lg" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-blue-400">ONE SHOT BAR & BILLIARDS</p>
                <p className="text-xs text-neutral-500">+63 917-123-4567</p>
              </div>
              <p className="text-xs text-neutral-500 text-center">Scan with your GCash app · Send exactly <span className="text-violet-400 font-semibold">₱{TATTOO_DEPOSIT}.00</span></p>
            </div>

            <div className="w-full space-y-3 pt-2 text-left border-t border-neutral-800">
              {uploadError && <div className="bg-rose-950/40 border border-rose-800/50 text-rose-400 text-xs px-3 py-2 rounded-lg">{uploadError}</div>}
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">GCash Reference Number <span className="text-rose-500">*</span></label>
                <input type="text" value={referenceNumber}
                  onChange={e => { 
                    const val = e.target.value;
                    if (val.replace(/\s/g, '').length <= 13) { setReferenceNumber(val); setUploadError(''); }
                  }}
                  placeholder="e.g. 10023948293"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Upload Screenshot <span className="text-rose-500">*</span></label>
                <input type="file" accept="image/*" onChange={e => { setReceiptFile(e.target.files?.[0] || null); setUploadError(''); }}
                  className="w-full text-xs text-neutral-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600/20 file:text-blue-400 hover:file:bg-blue-600/30 transition-all cursor-pointer" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-neutral-800 flex gap-3 flex-shrink-0 bg-neutral-950">
        {modalStep > 1 && (
          <button type="button" onClick={() => setModalStep(s => (s - 1) as any)} className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-xl transition-colors">
            Back
          </button>
        )}
        {modalStep < 4 && (
          <button type="button" onClick={() => setModalStep(s => (s + 1) as any)}
            disabled={(modalStep === 1 && !canProceedStep1) || (modalStep === 2 && !canProceedStep2) || (modalStep === 3 && !canProceedStep3)}
            className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
            Continue <ArrowRight size={14} />
          </button>
        )}
        {modalStep === 4 && (
          <button type="button" onClick={handleFinalSubmit} disabled={confirmingPayment || !referenceNumber}
            className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
            {confirmingPayment ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</> : <><CheckCircle size={15} /> I've Sent the Deposit</>}
          </button>
        )}
      </div>
    </div>
  );
}

// ── 🚨 Original Tattoo Section Component (Now just the Landing Page) ─────────
export function TattooSection({ currentUserName, currentUserEmail, onBookNow }: { currentUserName?: string; currentUserEmail?: string; onBookNow: () => void }) {
  const { tattooArtists } = useAppContext();

  // Carousel
  const [slideIdx, setSlideIdx] = useState(0);
  const [slideDir, setSlideDir] = useState<1|-1>(1);

  // AI Generator State
  const [aiMode, setAiMode] = useState<'concept' | 'placement'>('concept');
  const [aiReferenceImage, setAiReferenceImage] = useState<string | null>(null);
  const [aiGeneratedImage, setAiGeneratedImage] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiBodyPart, setAiBodyPart] = useState('');
  const [aiConsentChecked, setAiConsentChecked] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideDir(1);
      setSlideIdx(p => (p + 1) % TATTOO_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => { setSlideDir(1); setSlideIdx(p => (p + 1) % TATTOO_SLIDES.length); };
  const prevSlide = () => { setSlideDir(-1); setSlideIdx(p => (p - 1 + TATTOO_SLIDES.length) % TATTOO_SLIDES.length); };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-violet-400 text-xs uppercase tracking-[0.3em] font-semibold mb-2">One Shot Studio</p>
        <h2 className="text-3xl font-black text-white mb-3">Tattoo Services</h2>
        <p className="text-neutral-400 text-sm max-w-xl mx-auto leading-relaxed">
          Professional tattoo artists right here at One Shot Bar & Billiards. Book a consultation and bring your vision to life.
        </p>
      </div>

      {/* Carousel */}
      <div className="relative rounded-2xl overflow-hidden h-[400px] mb-10 group border border-neutral-800/60 shadow-2xl">
        <AnimatePresence mode="wait" custom={slideDir}>
          <motion.div
            key={slideIdx}
            custom={slideDir}
            initial={{ opacity: 0, x: slideDir * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: slideDir * -60 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <ImageWithFallback
              src={TATTOO_SLIDES[slideIdx].src}
              alt={TATTOO_SLIDES[slideIdx].caption}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-5">
              <p className="text-white text-sm font-semibold">{TATTOO_SLIDES[slideIdx].caption}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        <button onClick={prevSlide} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60">
          <ChevronLeft size={16} />
        </button>
        <button onClick={nextSlide} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60">
          <ChevronRight size={16} />
        </button>

        <div className="absolute bottom-4 right-4 flex gap-1.5">
          {TATTOO_SLIDES.map((_, i) => (
            <button key={i} onClick={() => { setSlideDir(i > slideIdx ? 1 : -1); setSlideIdx(i); }}
              className={`h-1.5 rounded-full transition-all ${i === slideIdx ? 'bg-violet-400 w-5' : 'bg-white/30 w-1.5 hover:bg-white/50'}`} />
          ))}
        </div>
      </div>

      {/* Info + Artists + CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="space-y-5">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <p className="text-violet-400 text-xs uppercase tracking-widest font-semibold mb-3">About the Studio</p>
            <p className="text-neutral-400 text-sm leading-relaxed mb-4">
              Our in-house tattoo studio at One Shot Bar & Billiards is operated by seasoned, passionate artists. Whether you want a small fine-line piece or a large-scale sleeve, we've got you covered.
            </p>
            <div className="space-y-2">
              {[
                { icon: Clock, text: 'Studio open: 10:00 AM – 9:00 PM daily' },
                { icon: Shield, text: 'Sterile, single-use equipment only' },
                { icon: FileText, text: '₱500 refundable deposit to book' },
                { icon: Phone, text: 'Walk-ins welcome when artists are free' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-xs text-neutral-400">
                  <Icon size={13} className="text-violet-400 flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onBookNow}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-900/40"
          >
            <Calendar size={15} />
            Book a Tattoo Session <ArrowRight size={14} />
          </button>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-4">Our Artists</p>
          <div className="space-y-3">
            {tattooArtists.map(artist => (
              <div key={artist.id} className="flex items-center gap-3 bg-neutral-950/60 border border-neutral-800/60 rounded-xl p-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 border ${artist.isAvailableToday ? 'bg-violet-600/20 border-violet-600/40 text-violet-300' : 'bg-neutral-800 border-neutral-700 text-neutral-600'}`}>
                  {artist.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-200">{artist.name}</p>
                  <p className="text-[10px] text-neutral-500 truncate">{artist.specialty}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1 ${artist.isAvailableToday ? 'bg-emerald-600/15 text-emerald-400' : 'bg-neutral-800 text-neutral-600'}`}>
                    {artist.isAvailableToday ? 'Available' : 'Unavailable'}
                  </div>
                  <p className="text-[10px] text-neutral-600 flex items-center gap-1 justify-end">
                    <Phone size={9} />{artist.contactNumber}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Browsable Past Work & AI Inspiration */}
      <div className="mt-6 mb-10 pt-10 border-t border-neutral-800/60">
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-1">Past Work Gallery</h3>
          <p className="text-sm text-neutral-400 mb-4">Browse our artists' recent sessions.</p>
          
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
            {TATTOO_SLIDES.map((s, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden flex-shrink-0 w-40 h-40 sm:w-48 sm:h-48 snap-center border border-neutral-800 group">
                <ImageWithFallback src={s.src} alt={s.caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-xs font-bold text-white">{s.caption}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Generator */}
        <div className="bg-neutral-900/50 border border-violet-500/20 rounded-2xl p-6 shadow-xl shadow-violet-900/5">
          <div className="text-center mb-8">
            <h4 className="text-lg font-bold text-violet-300 flex items-center justify-center gap-2 mb-1"><Wand2 size={18}/> AI Concept Generator</h4>
            <p className="text-xs text-neutral-400">Upload a reference, choose a style, and generate your concept before booking.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5"><ImagePlus size={14} className="text-violet-400"/> 1. Reference Photo <span className="text-neutral-500 font-normal">(Optional for Concepts)</span></p>
              
              <div className="aspect-square bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden flex items-center justify-center relative group shadow-inner">
                {aiReferenceImage ? (
                  <>
                    <img src={aiReferenceImage} className="w-full h-full object-cover" />
                    <button onClick={() => setAiReferenceImage(null)} className="absolute top-2 right-2 bg-rose-600/90 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm hover:bg-rose-500"><X size={14}/></button>
                  </>
                ) : (
                  <div className="text-center text-neutral-600 flex flex-col items-center">
                    <ImagePlus size={32} className="mb-2 opacity-30"/>
                    <span className="text-xs font-medium">No image selected</span>
                  </div>
                )}
              </div>
              
              <label className="block w-full text-center bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors border border-neutral-700">
                Choose File
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if(file) {
                    const reader = new FileReader();
                    reader.onload = (e) => setAiReferenceImage(e.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }} />
              </label>
            </div>

            <div className="space-y-3 flex flex-col">
              <p className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5"><Sparkles size={14} className="text-violet-400"/> 2. Generation Settings</p>
              
              <div className="flex p-1 bg-neutral-950 rounded-lg border border-neutral-800 shrink-0">
                <button onClick={() => setAiMode('concept')} className={`flex-1 text-[10px] font-semibold py-1.5 rounded-md transition-all ${aiMode === 'concept' ? 'bg-violet-600 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>New Concept Design</button>
                <button onClick={() => setAiMode('placement')} className={`flex-1 text-[10px] font-semibold py-1.5 rounded-md transition-all ${aiMode === 'placement' ? 'bg-violet-600 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>Visualize Placement</button>
              </div>

              <div className="aspect-square bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden flex items-center justify-center relative shadow-inner">
                {aiGeneratedImage ? (
                  <img src={aiGeneratedImage} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-neutral-600 flex flex-col items-center">
                    {isGenerating ? (
                      <>
                        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-3"/>
                        <span className="text-xs font-medium text-violet-400 animate-pulse">Generating art...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 size={32} className="mb-2 opacity-30"/>
                        <span className="text-xs font-medium">Awaiting prompt</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 mt-auto pt-2">
                {aiMode === 'concept' ? (
                  <>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Design Prompt:</p>
                    <input type="text" placeholder="Describe your idea..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} className="w-full text-xs bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-300 focus:border-violet-500 outline-none mb-2" />
                    <div className="flex flex-wrap gap-2">
                      {AI_PROMPTS.map(p => (
                        <button key={p} onClick={() => setAiPrompt(p)} 
                          className={`text-[10px] px-2.5 py-1.5 rounded-lg border transition-all ${
                            aiPrompt === p 
                              ? 'bg-violet-600/20 border-violet-500 text-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.15)]' 
                              : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-300'
                          }`}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Select Body Part:</p>
                    <select value={aiBodyPart} onChange={e => setAiBodyPart(e.target.value)} className="w-full text-xs bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-300 focus:border-violet-500 outline-none">
                      <option value="" disabled>Choose placement area...</option>
                      {PLACEMENTS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {!aiReferenceImage && <p className="text-[10px] text-rose-400 mt-1">⚠️ Reference photo is required to visualize placement.</p>}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-800/60 space-y-5">
            <label className="flex items-start gap-3 cursor-pointer group bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800 hover:border-violet-500/30 transition-colors">
              <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 transition-all ${aiConsentChecked ? 'bg-violet-600 border-violet-600' : 'border-neutral-600 bg-neutral-800 group-hover:border-violet-500'}`}
                onClick={() => setAiConsentChecked(p => !p)}>
                {aiConsentChecked && <CheckCircle size={10} className="text-white" />}
              </div>
              <span className="text-[11px] text-neutral-400 leading-relaxed" onClick={() => setAiConsentChecked(p => !p)}>
                I agree that uploaded reference photos are processed securely and confidentially to generate inspiration art. They will not be stored permanently or shared with third parties.
              </span>
            </label>

            <button
              disabled={!aiConsentChecked || isGenerating || (aiMode === 'concept' ? (!aiReferenceImage && !aiPrompt) : (!aiReferenceImage || !aiBodyPart))}
              onClick={() => {
                setIsGenerating(true);
                setTimeout(() => { 
                  setIsGenerating(false); 
                  setAiGeneratedImage('https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?auto=format&fit=crop&w=500&q=80'); 
                }, 2500);
              }}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-neutral-800 disabled:text-neutral-600 text-white py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {isGenerating ? 'Processing...' : aiMode === 'concept' ? 'Generate Concept Art' : 'Visualize'} <Sparkles size={16}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}