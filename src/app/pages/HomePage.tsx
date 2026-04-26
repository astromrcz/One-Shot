import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { addMinutes, differenceInSeconds, format, isToday } from 'date-fns';
import { supabase } from '../../utils/supabase/client';
import {
  ChevronLeft, ChevronRight, X, Star, Phone, MapPin,
  Clock, LogIn, UserPlus, Eye, EyeOff,
  Calendar, CheckCircle, ArrowRight,
  Megaphone, Info, Shield, Award, Mail, Tag, AlertTriangle
} from 'lucide-react';
import { useAppContext, generateReferralCode } from '../context/AppContext';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { TattooSection } from '../components/TattooSection';

import { CustomerSettingsModal } from '../components/CustomerSettingsModal';

import logoImg from '@/app/assets/40eb82831843e17a3c48a360fd80f0aaaa58ddc8.png';
import heroImg1 from '@/app/assets/15fb8dcab89448c8f2ad20fb9946631b1c246968.png';
import heroImg2 from '@/app/assets/f80be24577ead53e120a2e3792c660d627f94c6f.png';
import heroImg3 from '@/app/assets/622002b1a57eb609a09cacd650764fb95c911672.png';
import heroImg4 from '@/app/assets/759b04149309a4f38a99d59a2ef822b4e59fd5d3.png';
import heroImg5 from '@/app/assets/0784e9fa4728a17ea332ccf7dd013e304884f734.png';
import gcashQrImg from '@/app/assets/GcashOneShot.jpg';
import { toast } from 'sonner';

const ANNOUNCEMENTS = [
  "🎱 Welcome to One Shot Bar & Billiards! Book your favorite table now!",
  "📍 Visit us at Autobase OAX, San Juan, Cainta, Rizal · Mon–Sat 12PM–3AM · Sun 5PM–3AM",
  "💸 Happy Hour: 6PM – 8PM – Get 20% off walk-in rates every weekday!",
  "📅 Reserve in advance and secure your preferred date & time slot!",
  "🏆 Tournament Night every Saturday! Cash prizes await champions!",
  "🎉 FREE pool lessons every Sunday evening — visit us at Autobase OAX!",
  "☎️ For inquiries: 0917-123-4567 | oneshot.billiards@gmail.com",
];

const TIME_SLOTS = [
  '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
];

const formatTime = (time24: string) => {
  const [h, m] = time24.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${m} ${ampm}`;
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

type Section = 'home' | 'reservations' | 'rates' | 'about' | 'contacts' | 'reviews' | 'feedback' | 'tattoo';

const QR_GCASH = [
  [1,1,1,0,1,0,1,0,0,1,1,1,1,0,1,1,1],
  [1,0,1,0,1,1,0,1,0,0,1,0,1,0,1,0,1],
  [1,0,1,0,0,0,1,1,0,1,0,1,1,0,1,0,1],
  [1,0,1,0,1,1,0,0,1,1,1,0,1,0,1,0,1],
  [1,1,1,0,0,1,1,0,1,0,0,1,1,1,1,1,1],
  [0,0,0,0,1,0,1,0,0,1,0,0,0,0,0,0,0],
  [1,1,0,1,0,0,1,1,1,0,1,0,1,0,1,1,0],
  [0,1,0,0,1,0,0,0,1,0,0,1,0,1,1,0,1],
  [1,0,1,1,0,1,1,0,1,0,1,0,1,1,0,1,0],
  [0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,1,0],
  [1,1,1,0,1,0,1,1,0,1,1,0,1,1,1,0,1],
  [1,0,1,0,0,1,0,1,0,0,0,1,0,1,0,1,0],
  [1,0,1,0,1,0,1,0,1,1,0,0,1,0,1,0,1],
  [1,0,1,0,0,1,0,1,0,0,1,0,0,0,1,1,0],
  [1,1,1,0,1,1,1,0,1,1,0,1,1,0,1,1,1],
  [0,0,0,0,1,0,0,1,0,0,1,0,0,1,0,1,0],
  [1,0,1,1,0,1,1,0,1,0,0,1,0,0,1,0,1],
];

function QRDisplay({ pattern, color }: { pattern: number[][], color: string }) {
  return (
    <div className="bg-white p-3 rounded-xl inline-block">
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${pattern[0].length}, 1fr)`, gap: '1px', width: 136, height: 136 }}>
        {pattern.flatMap((row, ri) =>
          row.map((cell, ci) => (
            <div
              key={`${ri}-${ci}`}
              style={{ backgroundColor: cell ? color : 'white', borderRadius: 1 }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function MiniCalendar({
  selectedDate, onSelect, reservedDates, closedDates
}: {
  selectedDate: Date | null;
  onSelect: (d: Date) => void;
  reservedDates: Date[];
  closedDates: { date: string; reason: string }[];
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: Array<{ day: number; currentMonth: boolean; date: Date }> = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, daysInPrevMonth - i);
    cells.push({ day: daysInPrevMonth - i, currentMonth: false, date: d });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, currentMonth: true, date: new Date(year, month, d) });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, currentMonth: false, date: new Date(year, month + 1, d) });
  }

  const isReserved = (date: Date) =>
    reservedDates.some(rd => {
      const d = new Date(rd);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === date.getTime();
    });

  const isPast = (date: Date) => date < today;
  const isSelected = (date: Date) =>
    selectedDate ? date.getTime() === (() => { const s = new Date(selectedDate); s.setHours(0,0,0,0); return s.getTime(); })() : false;
  const isToday = (date: Date) => date.getTime() === today.getTime();

  const prevMonth = () => { const d = new Date(viewDate); d.setMonth(d.getMonth() - 1); setViewDate(d); };
  const nextMonth = () => { const d = new Date(viewDate); d.setMonth(d.getMonth() + 1); setViewDate(d); };

  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-700 p-4 select-none">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-white">{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="text-center text-[10px] text-neutral-500 font-semibold uppercase tracking-wider py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map(({ day, currentMonth, date }, idx) => {
          const past = isPast(date);
          const selected = isSelected(date);
          const today_ = isToday(date);
          const reserved = isReserved(date) && currentMonth;
          const clickable = currentMonth && !past;
          
          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          const closedInfo = currentMonth ? closedDates.find(cd => cd.date === dateStr) : null;

          return (
            <button
              key={idx} disabled={!clickable} onClick={() => clickable && onSelect(date)}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all
                ${!currentMonth ? 'opacity-20 cursor-default' : ''}
                ${past && currentMonth ? 'opacity-30 cursor-default text-neutral-600' : ''}
                ${selected && !closedInfo ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' : ''}
                ${selected && closedInfo ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50' : ''}
                ${!selected && closedInfo && clickable ? 'bg-rose-950/30 border border-rose-800/50 text-rose-400 hover:bg-rose-900/40' : ''}
                ${!selected && !closedInfo && today_ ? 'border border-emerald-500 text-emerald-400' : ''}
                ${!selected && !closedInfo && clickable && !today_ ? 'text-neutral-300 hover:bg-neutral-800 hover:text-white' : ''}
              `}
            >
              <span>{day}</span>
              {reserved && !selected && !closedInfo && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-400" />}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3 text-[10px] text-neutral-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Has reservations</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Selected</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Closed</span>
      </div>
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { tables, queue, reservations, addReservation, feedback, addFeedback, applyPromoCode, rates, closedDates, staffUsers, adminLogin, staffLogin, artistLogin, cancelReservation, siteSettings } = useAppContext();
  
  // Safe fallbacks in case settings haven't loaded
  const displayLogo = siteSettings?.logoUrl || logoImg;
  
   // 🚨 Dynamically map up to 10 images!
  const dynamicHeroSlides = siteSettings?.heroSliderImages && siteSettings.heroSliderImages.length > 0
    ? siteSettings.heroSliderImages.map(url => ({ src: url, alt: 'One Shot Bar & Billiards' }))
    : [
        { src: heroImg1, alt: 'One Shot Bar & Billiards – All It Takes Is One Shot' },
        { src: heroImg2, alt: 'One Shot Bar and Billiards' },
        { src: heroImg3, alt: 'One Shot Billiards Hall' },
        { src: heroImg4, alt: 'Tournament Play' },
        { src: heroImg5, alt: 'Precision Billiards' },
      ];

  const [guestEmail, setGuestEmail] = useState(() => localStorage.getItem('oneshot_guest_email') || '');
  const [announcementIdx, setAnnouncementIdx] = useState(0);
  const [announcementDir, setAnnouncementDir] = useState<1 | -1>(1);
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);
  const [heroSlideDir, setHeroSlideDir] = useState<1 | -1>(1);
  const [now, setNow] = useState(new Date());
  const [activeSection, setActiveSection] = useState<Section>('home');

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showForgotPwModal, setShowForgotPwModal] = useState(false); 
  const [showUpdatePwModal, setShowUpdatePwModal] = useState(false);

  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; phone: string; referralCode: string } | null>(null);

  const [loginForm, setLoginForm] = useState({ email: '', password: '', showPw: false, error: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', referralCode: '', showPw: false, error: '' });
  const [registerSuccessMsg, setRegisterSuccessMsg] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const [forgotPwEmail, setForgotPwEmail] = useState('');
  const [isResettingPw, setIsResettingPw] = useState(false);
  const [forgotPwMsg, setForgotPwMsg] = useState('');
  const [updatePwForm, setUpdatePwForm] = useState({ password: '', confirm: '', error: '', loading: false, success: '' });

  const [reservationStep, setReservationStep] = useState<0 | 1 | 2 | 3>(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null); 
  const [resForm, setResForm] = useState({ name: '', email: '', phone: '', pax: 2, timeSlot: '18:00', duration: 2 });
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [resError, setResError] = useState(''); // NEW ERROR STATE

  const [cancelModal, setCancelModal] = useState({ isOpen: false, id: '', category: 'Standard Cancellation', reason: '', loading: false });

  const handleCustomerCancel = async () => {
    if (!cancelModal.reason.trim()) {
      toast.error("Please provide a brief reason for cancellation.");
      return;
    }
    setCancelModal(prev => ({ ...prev, loading: true }));
    try {
      const finalReason = `[${cancelModal.category}] ${cancelModal.reason}`;
      await cancelReservation(cancelModal.id, finalReason);
      toast.success("Reservation cancelled.");
      setCancelModal({ isOpen: false, id: '', category: 'Standard Cancellation', reason: '', loading: false });
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel reservation.");
      setCancelModal(prev => ({ ...prev, loading: false }));
    }
  };

  const [referenceNumber, setReferenceNumber] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent: number } | null>(null);
  const [promoError, setPromoError] = useState('');

  const [fbForm, setFbForm] = useState({ name: '', rating: 5, comment: '' });
  const [fbSent, setFbSent] = useState(false);
  const [simpleFeedbackForm, setSimpleFeedbackForm] = useState({ name: '', type: '', contact: '', message: '' });
  const [simpleFeedbackSent, setSimpleFeedbackSent] = useState(false);

  const selectedDateStr = selectedDate 
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` 
    : null;
  const selectedClosedDate = closedDates.find(cd => cd.date === selectedDateStr);

  const slotCounts = reservations.reduce((acc, r) => {
    // PROTECT: Skip cancelled, or missing time slots/dates
    if (r.status === 'cancelled' || !r.timeSlot || !r.date) return acc; 
    
    try {
      const rDateStr = format(new Date(r.date), 'yyyy-MM-dd');
      if (rDateStr === selectedDateStr) {
        const startHour = parseInt(r.timeSlot.split(':')[0]);
        const duration = r.durationHours || 1; // Fallback if duration is missing
        for (let i = 0; i < duration; i++) {
          const hourStr = `${String(startHour + i).padStart(2, '0')}:00`;
          acc[hourStr] = (acc[hourStr] || 0) + 1;
        }
      }
    } catch (e) {
      // Ignore old reservations with completely broken date formats
    }
    return acc;
  }, {} as Record<string, number>);

  const baseAmount = resForm.duration * (rates?.hourlyRate || 250);
  const discountAmount = appliedPromo ? Math.floor(baseAmount * appliedPromo.discountPercent / 100) : 0;
  const totalAmount = baseAmount - discountAmount;
  const downPayment = Math.ceil(totalAmount * ((rates?.downPaymentPercent || 25) / 100));

  useEffect(() => {
    const interval = setInterval(() => { setAnnouncementDir(1); setAnnouncementIdx(prev => (prev + 1) % ANNOUNCEMENTS.length); }, 4500);
    return () => clearInterval(interval);
  }, []);

  // 🚨 Automatically adjust the timer to match the number of images!
  useEffect(() => {
    const slideCount = dynamicHeroSlides.length;
    const interval = setInterval(() => { setHeroSlideDir(1); setHeroSlideIdx(prev => (prev + 1) % slideCount); }, 5000);
    return () => clearInterval(interval);
  }, [siteSettings?.heroSliderImages]); 

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

 useEffect(() => {
    if (currentUser) setResForm(f => ({ ...f, name: currentUser.name, email: currentUser.email, phone: currentUser.phone || '' }));
  }, [currentUser]);

  useEffect(() => {
    // 1. Automatically check Supabase for a saved session when the app opens
    const restoreSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const name = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User';
        const phone = session.user.user_metadata?.phone || '';
        const referralCode = session.user.user_metadata?.referral_code || generateReferralCode(name);
        setCurrentUser({ name, email: session.user.email!, phone, referralCode });
      }
    };
    restoreSession();

    // 2. Handle password recovery routing
    if (window.location.hash.includes('type=recovery')) {
      setShowForgotPwModal(false);
      setShowLoginModal(false);
      setShowUpdatePwModal(true);
      window.history.replaceState(null, '', window.location.pathname);
    }

    // 3. Listen for changes (like logging out in another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowForgotPwModal(false);
        setShowLoginModal(false);
        setShowUpdatePwModal(true);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleUpdateCustomerProfile = (updates: Partial<{name: string, email: string, phone?: string}>) => {
    if (!currentUser) return;
    setCurrentUser(prev => prev ? { ...prev, ...updates } as any : null);
    setResForm(f => ({ ...f, name: updates.name || f.name, email: updates.email || f.email, phone: updates.phone || f.phone }));
  };

  const handleLoginSubmit = async () => {
    if (!loginForm.email || !loginForm.password) {
      setLoginForm(f => ({ ...f, error: 'Please fill all fields.' }));
      return;
    }
    setIsLoggingIn(true);
    setLoginForm(f => ({ ...f, error: '' }));

    // 1. FIREWALL: Does this email belong to a Staff/Admin account?
    const isStaffIdentity = staffUsers.find(u => u.email === loginForm.email || u.username === loginForm.email);

    if (isStaffIdentity) {
      const role = isStaffIdentity.role?.toLowerCase();
      const username = isStaffIdentity.username;
      const displayName = isStaffIdentity.fullName || username;
      let success = false;

      // 🚨 The secure fetch bypass in AppContext handles the actual password verification now!
      if (role === 'admin' || isStaffIdentity.isAdmin) {
        success = await adminLogin(username, loginForm.password);
        if (success) { toast.success(`Welcome back, ${displayName}!`); navigate('/admin'); return; }
      } else if (role === 'artist' || role === 'tattoo-artist') {
        success = await artistLogin(username, loginForm.password);
        if (success) { toast.success(`Welcome back, ${displayName}!`); navigate('/artist'); return; }
      } else {
        success = await staffLogin(username, loginForm.password);
        if (success) { toast.success(`Welcome back, ${displayName}!`); navigate('/staff'); return; }
      }

      // If success is false, the database rejected the password!
      setLoginForm(f => ({ ...f, error: 'Invalid admin/staff password.' }));
      setIsLoggingIn(false);
      return; 
    }

    // 2. CUSTOMER AUTH FLOW
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: loginForm.email, 
        password: loginForm.password 
      });
      
      if (error) throw error;

      const name = data.user.user_metadata?.full_name || loginForm.email.split('@')[0];
      const phone = data.user.user_metadata?.phone || '';
      const referralCode = data.user.user_metadata?.referral_code || generateReferralCode(name);

      setCurrentUser({ name, email: loginForm.email, phone, referralCode });
      toast.success(`Welcome back, ${name}!`);
      setShowLoginModal(false);
      setLoginForm({ email: '', password: '', showPw: false, error: '' });
      
    } catch (err: any) {
      if (err.message.includes('Email not confirmed')) {
        setLoginForm(f => ({ ...f, error: 'Please verify your email address before logging in.' }));
      } else {
        setLoginForm(f => ({ ...f, error: 'Invalid email or password. Please try again.' }));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCustomerLogout = async () => {
    try {
      setCurrentUser(null); // Instantly clear the UI
      await supabase.auth.signOut(); // Securely tell the database to destroy the session
      toast.info("Logged out", { description: "You have been securely signed out." });
    } catch (error) {
      toast.error("Logout failed", { description: "Please try again." });
    }
  };

  const handleRegisterSubmit = async () => {
    if (!registerForm.name || !registerForm.email || !registerForm.phone || !registerForm.password) {
      setRegisterForm(f => ({ ...f, error: 'Please fill all required fields.' }));
      return;
    }
    
    // Validate Phone for Registration
    const cleanPhone = registerForm.phone.replace(/\D/g, '');
    if (!/^09\d{9}$/.test(cleanPhone)) {
      setRegisterForm(f => ({ ...f, error: 'Contact number must be exactly 11 digits and start with 09.' }));
      return;
    }

    if (registerForm.password !== registerForm.confirm) {
      setRegisterForm(f => ({ ...f, error: 'Passwords do not match.' }));
      return;
    }

    setIsRegistering(true);
    setRegisterForm(f => ({ ...f, error: '' }));

    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerForm.email,
        password: registerForm.password,
        options: {
          data: {
            full_name: registerForm.name,
            phone: registerForm.phone,
            referral_code: registerForm.referralCode || generateReferralCode(registerForm.name)
          },
          emailRedirectTo: window.location.origin
        }
      });
      if (error) throw error;

      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setRegisterForm(f => ({ ...f, error: 'This email is already registered. Please log in.' }));
      } else {
        setRegisterSuccessMsg('Registration successful! Please check your email to verify your account before logging in.');
        setRegisterForm({ name: '', email: '', phone: '', password: '', confirm: '', referralCode: '', showPw: false, error: '' });
      }
    } catch (err: any) {
      setRegisterForm(f => ({ ...f, error: err.message || 'Failed to register. Please try again.' }));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleForgotPasswordSubmit = async () => {
    if (!forgotPwEmail) return;
    setIsResettingPw(true);
    setForgotPwMsg('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPwEmail, {
        redirectTo: window.location.origin, 
      });
      if (error) throw error;
      setForgotPwMsg('Success! Check your email for the password reset link.');
    } catch (err: any) {
      setForgotPwMsg(`Error: ${err.message}`);
    } finally {
      setIsResettingPw(false);
    }
  };

  const handleUpdatePasswordSubmit = async () => {
    if (!updatePwForm.password || updatePwForm.password !== updatePwForm.confirm) {
      setUpdatePwForm(f => ({ ...f, error: 'Passwords do not match.' }));
      return;
    }
    setUpdatePwForm(f => ({ ...f, loading: true, error: '' }));
    
    const { error } = await supabase.auth.updateUser({ password: updatePwForm.password });
    
    if (error) {
      setUpdatePwForm(f => ({ ...f, error: error.message, loading: false }));
    } else {
      setUpdatePwForm(f => ({ ...f, success: 'Password updated! Redirecting to login...', loading: false }));
      setTimeout(() => {
        setShowUpdatePwModal(false);
        supabase.auth.signOut();
        setShowLoginModal(true);
      }, 2500);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    const promo = await applyPromoCode(promoCodeInput.trim());
    if (promo) {
      setAppliedPromo({ code: promo.code, discountPercent: promo.discountPercent });
      setPromoError('');
    } else {
      setPromoError('Invalid or expired promo code.');
      setAppliedPromo(null);
    }
  };

  const handleRemovePromo = () => { setAppliedPromo(null); setPromoCodeInput(''); setPromoError(''); };
  
  const handleReservationSubmit = async () => { 
    if (!resForm.name || !resForm.email || !resForm.phone || !selectedDate || !resForm.timeSlot) {
      setResError('Please fill all required details.');
      return; 
    }
    
    // Validate Phone for Reservation
    const cleanPhone = resForm.phone.replace(/\D/g, '');
    if (!/^09\d{9}$/.test(cleanPhone)) {
      setResError('Contact number must be exactly 11 digits and start with 09 (e.g., 09123456789).');
      return;
    }

    // 🚨 FAST-FAIL DURATION CHECK 🚨
    // Ensures a 3-hour booking doesn't bleed into an hour that is already full!
    const targetStartHour = parseInt(resForm.timeSlot.split(':')[0]);
    for (let i = 0; i < resForm.duration; i++) {
      const hourStr = `${String(targetStartHour + i).padStart(2, '0')}:00`;
      if ((slotCounts[hourStr] || 0) >= 5) {
        setResError(`Cannot book for ${resForm.duration} hours. The ${hourStr} slot is fully booked. Please adjust your duration or time.`);
        return;
      }
    }

    setResError('');
    setReservationStep(2); 
  };

  const handlePaymentConfirm = async () => {
    const cleanRef = referenceNumber.replace(/\s/g, ''); // Remove spaces for validation
    
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
      // --- 🚨 GCASH DUPLICATE REFERENCE FIX 🚨 ---
      const { data: existingRef } = await supabase
        .from('reservations')
        .select('id')
        .eq('payment_reference', referenceNumber)
        .maybeSingle();

      if (existingRef) {
        throw new Error("This GCash reference number has already been used. Please provide a valid, unique receipt.");
      }
      // ------------------------------------------------------------

      // --- 🚨 RACE CONDITION FIX: LIVE DATABASE DOUBLE-CHECK 🚨 ---
      const dateStart = new Date(selectedDate!);
      dateStart.setHours(0,0,0,0);
      const dateEnd = new Date(selectedDate!);
      dateEnd.setHours(23,59,59,999);

      // Fetch the absolute latest active reservations for this day directly from the DB
      const { data: latestReservations, error: fetchError } = await supabase
        .from('reservations')
        .select('time_slot, duration_hours')
        .neq('status', 'cancelled')
        .gte('date', dateStart.toISOString())
        .lte('date', dateEnd.toISOString());

      if (fetchError) throw fetchError;

      const targetStartHour = parseInt(resForm.timeSlot.split(':')[0]);
      
      // Verify every hour of the requested duration against live DB data
      for (let i = 0; i < resForm.duration; i++) {
         const checkHour = targetStartHour + i;
         let countForThisHour = 0;
         
         (latestReservations || []).forEach(r => {
            if (!r.time_slot) return;
            const rStartHour = parseInt(r.time_slot.split(':')[0]);
            const rEndHour = rStartHour + (r.duration_hours || 1);
            if (checkHour >= rStartHour && checkHour < rEndHour) {
               countForThisHour++;
            }
         });

         // If the exact hour they want hit 5 tables while they were paying...
         if (countForThisHour >= 5) {
             throw new Error(`We're sorry! The ${checkHour}:00 slot was just taken by someone else while you were completing payment. Please close this modal and select a different time.`);
         }
      }
      // ------------------------------------------------------------

      let receiptUrl = '';
      
      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { data, error } = await supabase.storage.from('receipts').upload(fileName, receiptFile);
        if (error) throw error;
        receiptUrl = supabase.storage.from('receipts').getPublicUrl(fileName).data.publicUrl;
      }

      const reservationDate = new Date(selectedDate!);
      const [hours, minutes] = resForm.timeSlot.split(':').map(Number);
      reservationDate.setHours(hours, minutes, 0, 0);

      // Await the reservation to ensure database insertion succeeds
      await addReservation({
        customerName: resForm.name, contactNumber: resForm.phone, email: resForm.email,
        date: reservationDate, timeSlot: resForm.timeSlot, durationHours: resForm.duration,
        partySize: resForm.pax, status: 'pending', totalAmount, downPaymentAmount: downPayment,
        downPaymentPaid: true, balancePaid: false, promoCode: appliedPromo?.code,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        paymentReference: referenceNumber,
        receiptUrl: receiptUrl,
      });

      if (!currentUser && resForm.email) {
        localStorage.setItem('oneshot_guest_email', resForm.email);
        setGuestEmail(resForm.email);
      }

      setConfirmingPayment(false); 
      setReservationStep(3);
    } catch (err: any) {
      setUploadError(err.message || "Failed to process payment details.");
      setConfirmingPayment(false);
    }
  };

  const closeReservation = () => {
    setReservationStep(0); setSelectedDate(null);
    // Notice how phone correctly resets back to the current user's actual phone now
    setResForm({ name: currentUser?.name || '', email: currentUser?.email || '', phone: currentUser?.phone || '', pax: 2, timeSlot: '18:00', duration: 2 });
    setPromoCodeInput(''); setAppliedPromo(null); setPromoError('');
    setReferenceNumber(''); setReceiptFile(null); setUploadError('');
    setResError('');
  };

  const handleSimpleFeedbackSubmit = async () => {
    if (!simpleFeedbackForm.name || !simpleFeedbackForm.type || !simpleFeedbackForm.contact) return;
    
    try {
      // 🚨 ACTUALLY SAVE TO SUPABASE!
      await addFeedback({
        customerName: simpleFeedbackForm.name,
        contactNumber: simpleFeedbackForm.contact,
        rating: 5, // Default rating for general messages
        comment: `[${simpleFeedbackForm.type.toUpperCase()}] ${simpleFeedbackForm.message}`,
        status: 'new'
      });
      
      setSimpleFeedbackSent(true);
      setTimeout(() => { 
        setSimpleFeedbackSent(false); 
        setSimpleFeedbackForm({ name: '', type: '', contact: '', message: '' }); 
      }, 3000);
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    }
  };

  const prevHeroSlide = () => { setHeroSlideDir(-1); setHeroSlideIdx(p => (p - 1 + dynamicHeroSlides.length) % dynamicHeroSlides.length); };
  const nextHeroSlide = () => { setHeroSlideDir(1); setHeroSlideIdx(p => (p + 1) % dynamicHeroSlides.length); };

  const getTableTimerInfo = (tableId: string) => {
    const t = tables.find(tb => tb.id === tableId);
    if (!t || t.status !== 'occupied' || !t.session) return null;
    const endTime = addMinutes(new Date(t.session.startTime), t.session.durationMinutes);
    const secsLeft = differenceInSeconds(endTime, now);
    const isOvertime = secsLeft < 0;
    const absSecs = Math.abs(secsLeft);
    const mins = Math.floor(absSecs / 60);
    const secs = absSecs % 60;
    return { formatted: `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`, isOvertime, isAlert: !isOvertime && secsLeft <= 900, customerName: t.session.customerName };
  };

  const getNextResForTable = (tableId: string) => {
    return reservations.filter(r => r.tableId === tableId && (r.status === 'pending' || r.status === 'confirmed') && isToday(new Date(r.date)) && new Date(r.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] || null;
  };

  const reservedDates = reservations.filter(r => r.status !== 'cancelled').map(r => new Date(r.date));
  const navSections: { id: Section; label: string }[] = [{ id: 'home', label: 'Home' }, { id: 'reservations', label: 'Reservations' }, { id: 'rates', label: 'Rates' }, { id: 'tattoo', label: 'Tattoo Studio' }, { id: 'about', label: 'About Us' }, { id: 'reviews', label: 'Feedback' }];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* ── Top Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/60 flex items-center overflow-hidden">
        <div className="h-full flex items-center px-5 pr-12 bg-emerald-700 flex-shrink-0 relative z-10" style={{ clipPath: 'polygon(0 0, 100% 0, 82% 100%, 0 100%)', minWidth: 220 }}>
          <div className="flex items-center gap-2.5">
            <img src={displayLogo} alt="One Shot Bar & Billiards" className="h-9 w-9 object-contain rounded-lg flex-shrink-0" />
            <div>
              <p className="text-white font-black text-sm tracking-tight leading-tight">ONE SHOT</p>
              <p className="text-emerald-200 text-[9px] uppercase tracking-[0.2em] font-semibold">Bar & Billiards</p>
            </div>
          </div>
        </div>

        {/* Rotating Announcements */}
        <div className="flex-1 flex items-center justify-center overflow-hidden px-4">
          <div className="flex items-center gap-2 max-w-lg w-full">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center">
              <Megaphone size={10} className="text-emerald-400" />
            </div>
            <div className="flex-1 overflow-hidden text-center">
              <AnimatePresence mode="wait">
                <motion.p key={announcementIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }} className="text-xs text-neutral-300 truncate">
                  {ANNOUNCEMENTS[announcementIdx]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-2 pr-4 flex-shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <button onClick={() => setShowProfileModal(true)} className="flex items-center gap-2 bg-emerald-600/10 border border-emerald-600/25 rounded-full px-3 py-1.5 hover:bg-emerald-600/20 transition-colors">
                <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-[9px] font-black text-white">{currentUser.name[0]}</div>
                <span className="text-xs text-emerald-300 font-medium hidden sm:block">{currentUser.name}</span>
              </button>
              <button onClick={handleCustomerLogout} className="text-[10px] text-neutral-500 hover:text-neutral-300 px-2 py-1.5 transition-colors">
                Logout
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => setShowLoginModal(true)} className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/50 px-3 py-1.5 rounded-full transition-all">
                <LogIn size={12} /> <span className="hidden sm:inline">Login</span>
              </button>
              <button onClick={() => setShowRegisterModal(true)} className="flex items-center gap-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-full transition-all">
                <UserPlus size={12} /> <span className="hidden sm:inline">Register</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Section Navigation ── */}
      <nav className="fixed top-16 left-0 right-0 z-40 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800/60 flex items-center justify-center gap-1 px-4 overflow-x-auto">
        {navSections.map(({ id, label }) => (
          <button key={id} onClick={() => setActiveSection(id)} className={`relative px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all ${activeSection === id ? 'text-emerald-400' : 'text-neutral-500 hover:text-neutral-300'}`}>
            {label}
            {activeSection === id && <motion.span layoutId="navUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full" />}
          </button>
        ))}
      </nav>

      {/* ── Main Content ── */}
      <main className={`flex-1 ${activeSection === 'home' ? 'pt-0' : 'pt-[104px]'}`}>
        <AnimatePresence mode="wait">
          {/* ════ HOME SECTION ════ */}
          {activeSection === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {/* Hero Slideshow */}
              <div className="relative h-[70vh] min-h-[480px] overflow-hidden group">
                <AnimatePresence mode="wait" custom={heroSlideDir}>
                  <motion.div key={heroSlideIdx} custom={heroSlideDir} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }} className="absolute inset-0">
                    {/* 🚨 FIXED: Now uses dynamicHeroSlides 🚨 */}
                    <img src={dynamicHeroSlides[heroSlideIdx].src} alt={dynamicHeroSlides[heroSlideIdx].alt} className="w-full h-full object-cover" />
                  </motion.div>
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/55 to-transparent" />
                <button onClick={prevHeroSlide} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-10"><ChevronLeft size={18} /></button>
                <button onClick={nextHeroSlide} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-10"><ChevronRight size={18} /></button>

                <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 px-6 text-center z-10">
                  <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }} className="flex flex-col items-center">
                    <p className="text-emerald-400 text-xs uppercase tracking-[0.3em] font-semibold mb-3">Welcome to</p>
                    <h1 className="text-5xl md:text-6xl font-black text-white mb-2 tracking-tight">{siteSettings?.heroTitle || 'One Shot'}</h1>
                    <p className="text-emerald-300 text-xl font-light mb-5">{siteSettings?.heroSubtitle || 'Bar & Billiards'}</p>

                    <p className="text-neutral-400 text-sm max-w-md mx-auto mb-7 leading-relaxed">
                      {siteSettings?.heroDescription || 'Your premier billiard destination at Autobase OAX, Cainta, Rizal. 10 world class tables, refreshing drinks, and an unbeatable atmosphere.'}
                    </p>

                    <div className="flex flex-wrap justify-center gap-3 mb-6">
                      <button onClick={() => setActiveSection('reservations')} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-full text-sm font-semibold transition-all shadow-lg shadow-emerald-900/40 hover:shadow-emerald-800/60"><Calendar size={15} /> Book a Table</button>
                      <button onClick={() => setActiveSection('about')} className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-6 py-3 rounded-full text-sm font-semibold transition-all border border-neutral-700"><Info size={15} /> Learn More</button>
                    </div>

                    <div className="flex gap-2">
                      {/* 🚨 FIXED: Now uses dynamicHeroSlides 🚨 */}
                      {dynamicHeroSlides.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => { setHeroSlideDir(i > heroSlideIdx ? 1 : -1); setHeroSlideIdx(i); }}
                          className={`h-1.5 rounded-full transition-all ${i === heroSlideIdx ? 'bg-emerald-400 w-5' : 'bg-white/35 w-1.5 hover:bg-white/60'}`}
                        />
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="bg-neutral-900 border-y border-neutral-800">
                <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-neutral-800">
                  {[
                    { value: '10', label: 'Billiard Tables', color: 'text-emerald-400' },
                    { value: `₱${rates?.hourlyRate || 250}`, label: 'Per Hour', color: 'text-amber-400' },
                    { value: '15+', label: 'Hours Open Daily', color: 'text-sky-400' },
                    { value: 'A+', label: 'Top Tier Facility', color: 'text-rose-400' },
                  ].map(({ value, label, color }) => (
                    <div key={label} className="p-6 text-center">
                      <p className={`text-3xl font-black ${color} mb-1`}>{value}</p>
                      <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Features */}
              <div className="max-w-5xl mx-auto px-6 py-16">
                <h2 className="text-center text-2xl font-bold text-white mb-10">Why Choose One Shot?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { icon: Award, title: 'Premium Tables', desc: '10 tournament-grade billiard tables maintained to the highest standard.', color: 'emerald' },
                    { icon: Clock, title: 'Extended Hours', desc: 'Mon–Sat 12:00 PM – 3:00 AM · Sun 5:00 PM – 3:00 AM. Game night starts here!', color: 'amber' },
                    { icon: Shield, title: 'Safe & Secure', desc: 'Clean, safe, and well-lit environment for players of all skill levels.', color: 'sky' },
                  ].map(({ icon: Icon, title, desc, color }) => (
                    <div key={title} className={`bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-${color}-600/40 transition-all group`}>
                      <div className={`w-10 h-10 rounded-xl bg-${color}-600/15 border border-${color}-600/25 flex items-center justify-center mb-4 group-hover:bg-${color}-600/25 transition-colors`}>
                        <Icon size={18} className={`text-${color}-400`} />
                      </div>
                      <h3 className="text-white font-semibold mb-2">{title}</h3>
                      <p className="text-neutral-500 text-sm leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Second Image */}
              <div className="relative h-72 overflow-hidden">
                <ImageWithFallback
                  src={siteSettings?.promoImage || "https://images.unsplash.com/photo-1741397112651-ee14e18f6b41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaWxsaWFyZHMlMjBoYWxsJTIwaW50ZXJpb3IlMjBuZW9uJTIwbGlnaHRzfGVufDF8fHx8MTc3NDk1MTMxNXww&ixlib=rb-4.1.0&q=80&w=1080"}
                  alt="One Shot Billiards Hall"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-neutral-950/60 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-white text-2xl font-black mb-3">Ready for a Game?</p>
                    <button
                      onClick={() => setActiveSection('reservations')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full text-sm font-semibold transition-all inline-flex items-center gap-2"
                    >
                      Reserve Now <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════ RESERVATIONS SECTION ════ */}
          {activeSection === 'reservations' && (
            <motion.div key="reservations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="max-w-6xl mx-auto px-6 py-10">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-white mb-2">Make a Reservation</h2>
                <p className="text-neutral-400 text-sm">Select your preferred date on the calendar, fill in your details, and secure your spot with a {rates?.downPaymentPercent || 25}% down payment.</p>
              </div>

              {/* Layout wrapper for Main Content (Left) and Sidebar (Right) */}
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* --- MAIN CONTENT AREA (LEFT) --- */}
                <div className="flex-1 min-w-0 space-y-10">
                  
                  {/* Live Status Overview (Now 2 columns instead of 3) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Table Status Card */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-neutral-300 flex items-center gap-2"><Clock size={14} className="text-neutral-500" /> Live Table Status</h2>
                      </div>
                      <div className="space-y-1 max-h-56 overflow-y-auto">
                        {tables.map(t => {
                          if (!t.isActive) {
                            return (
                              <div key={t.id} className="flex items-center gap-2 rounded-lg px-3 py-2 border text-xs transition-all bg-neutral-950/40 border-neutral-800/30 opacity-60">
                                <span className="w-2 h-2 rounded-full flex-none bg-neutral-600" />
                                <span className="font-semibold text-neutral-500 w-14 flex-none line-through">{t.name}</span>
                                <span className="font-semibold uppercase text-[10px] tracking-wider text-neutral-500">Unavailable</span>
                              </div>
                            );
                          }
                          
                          const timerInfo = getTableTimerInfo(t.id);
                          const nextRes = getNextResForTable(t.id);
                          const dotColor = timerInfo?.isOvertime ? 'bg-rose-500 animate-pulse' : t.status === 'occupied' ? 'bg-amber-500' : t.status === 'reserved' ? 'bg-blue-500' : 'bg-emerald-500';
                          
                          return (
                            <div key={t.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 border text-xs transition-all ${timerInfo?.isOvertime ? 'bg-rose-950/30 border-rose-800/40' : t.status === 'available' ? 'bg-neutral-950/50 border-neutral-800/30' : 'bg-neutral-950 border-neutral-800/50'}`}>
                              <span className={`w-2 h-2 rounded-full flex-none ${dotColor}`} />
                              <span className="font-semibold text-neutral-300 w-14 flex-none">{t.name}</span>
                              <div className="flex-1 min-w-0 flex items-center gap-2">
                                {timerInfo ? (
                                  <>
                                    <span className={`font-semibold uppercase text-[10px] tracking-wider ${timerInfo.isOvertime ? 'text-rose-500' : 'text-amber-500'}`}>
                                      {timerInfo.isOvertime ? 'OVERTIME' : 'IN USE'}
                                    </span>
                                    <span className={`font-mono font-black ${timerInfo.isOvertime ? 'text-rose-400' : 'text-amber-500'}`}>
                                      {timerInfo.formatted}
                                    </span>
                                  </>
                                ) : (
                                  <span className={`font-semibold uppercase text-[10px] tracking-wider ${t.status === 'available' ? 'text-emerald-500' : t.status === 'reserved' ? 'text-blue-400' : 'text-amber-500'}`}>{t.status}</span>
                                )}
                              </div>
                              {nextRes && <span className="text-[10px] text-neutral-500 flex-none truncate max-w-[105px]">→ {nextRes.customerName.split(' ')[0]} @ {formatTime(nextRes.timeSlot)}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Walk-in Queue Card */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-1">
                        <h2 className="text-sm font-semibold text-neutral-300">Walk-in Queue Snapshot</h2>
                        <span className="bg-neutral-800 text-neutral-300 text-[10px] font-bold px-2 py-0.5 rounded-full">{queue.filter(q => q.status === 'waiting').length} Waiting</span>
                      </div>
                      {queue.filter(q => q.status === 'waiting').length === 0 ? (
                        <div className="flex items-center justify-center h-24 border border-dashed border-neutral-800 rounded-lg"><p className="text-xs text-neutral-500">No customers currently waiting.</p></div>
                      ) : (
                        <div className="space-y-2">
                          {queue.filter(q => q.status === 'waiting').slice(0, 4).map((q, i) => (
                            <div key={q.id} className="flex items-center gap-2.5 text-sm bg-neutral-950 border border-neutral-800/50 rounded-lg px-3 py-2">
                              <span className="w-5 h-5 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-400">{i + 1}</span>
                              <span className="text-neutral-300 font-medium flex-1 truncate">{q.customerName}</span>
                              <span className="text-xs text-neutral-500">{q.partySize} pax</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booking Steps */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    
                    {/* Step 1 */}
                    <div>
                      <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-3">Step 1 — Pick a Date</p>
                      <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} reservedDates={reservedDates} closedDates={closedDates} />
                      {selectedDate && !selectedClosedDate && (
                        <>
                          <div className="mt-3 bg-emerald-600/10 border border-emerald-600/25 rounded-xl p-3 flex items-center gap-2">
                            <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                            <span className="text-xs text-emerald-300">Selected: <strong>{selectedDate.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
                          </div>
                          
                          <div className="mt-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
                                <Clock size={14} className="text-emerald-500" /> Slot Availability
                              </h3>
                              <span className="text-[9px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Max 5 / hour</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                              {TIME_SLOTS.map(t => {
                                const isHappyHour = t >= (rates?.happyHourStart || '18:00') && t < (rates?.happyHourEnd || '19:00');
                                const bufferHours = 1; 
                                const isPastTime = isToday(selectedDate!) && parseInt(t.split(':')[0]) <= now.getHours() + bufferHours;
                                if (isHappyHour || isPastTime) return null; 
                                
                                const count = slotCounts[t] || 0;
                                const isFull = count >= 5;
                                
                                return (
                                  <div key={t} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
                                    isFull ? 'bg-rose-950/20 border-rose-800/30' : 
                                    count > 0 ? 'bg-emerald-950/20 border-emerald-800/30' : 
                                    'bg-neutral-950 border-neutral-800/50'
                                  }`}>
                                    <span className={isFull ? 'text-rose-400 font-semibold' : 'text-neutral-300'}>{formatTime(t)}</span>
                                    <span className={`font-mono font-bold ${isFull ? 'text-rose-500' : count > 0 ? 'text-emerald-400' : 'text-neutral-600'}`}>
                                      {count}/5
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Step 2 */}
                    <div>
                      {/* Title is now OUTSIDE the box to align perfectly with Step 1 */}
                      <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-3">Step 2 — Your Details</p>
                      
                      {!selectedDate ? (
                        <div className="bg-neutral-900 border border-dashed border-neutral-700 rounded-2xl p-10 text-center flex flex-col items-center gap-3">
                          <Calendar size={32} className="text-neutral-600" />
                          <p className="text-neutral-500 text-sm">Please select a date from the calendar to continue your reservation.</p>
                        </div>
                      ) : selectedClosedDate ? (
                        <div className="bg-rose-950/20 border border-rose-800/30 rounded-2xl p-8 text-center flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-rose-900/30 rounded-full flex items-center justify-center">
                            <AlertTriangle size={32} className="text-rose-500" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-rose-400 mb-2">Store Closed</h3>
                            <p className="text-sm text-neutral-300 leading-relaxed mb-4">
                              We are currently closed on {selectedDate.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}.
                            </p>
                            <div className="bg-rose-950/40 border border-rose-800/50 rounded-xl p-4 text-left">
                              <p className="text-[10px] text-rose-500 uppercase tracking-widest font-semibold mb-1">Reason for closure</p>
                              <p className="text-sm text-neutral-200">{selectedClosedDate.reason}</p>
                            </div>
                          </div>
                          <p className="text-xs text-neutral-500 mt-2">Please select a different date from the calendar to make your reservation.</p>
                        </div>
                      ) : (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
                          <div>
                            <label className="block text-xs text-neutral-400 mb-1.5">Full Name <span className="text-rose-500">*</span></label>
                            <input type="text" value={resForm.name} onChange={e => setResForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100" />
                          </div>
                          <div>
                            <label className="block text-xs text-neutral-400 mb-1.5">Email Address <span className="text-rose-500">*</span></label>
                            <input type="email" value={resForm.email} onChange={e => setResForm(f => ({ ...f, email: e.target.value }))} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100" />
                          </div>
                          <div>
                            <label className="block text-xs text-neutral-400 mb-1.5">Contact Number <span className="text-rose-500">*</span></label>
                            <input 
                              type="tel" 
                              value={resForm.phone} 
                              onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (val.length <= 11) setResForm(f => ({ ...f, phone: val }));
                                setResError(''); 
                              }} 
                              placeholder="09XXXXXXXXX"
                              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600" 
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-neutral-400 mb-1.5">No. of Persons</label>
                              <input type="number" min={1} max={20} value={resForm.pax} onChange={e => setResForm(f => ({ ...f, pax: parseInt(e.target.value) || 1 }))} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100" />
                            </div>
                            <div>
                              <label className="block text-xs text-neutral-400 mb-1.5">Duration (hours)</label>
                              <select value={resForm.duration} onChange={e => setResForm(f => ({ ...f, duration: parseInt(e.target.value) }))} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100">
                                {[1, 2, 3, 4, 5, 6].map(h => <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''}</option>)}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-neutral-400 mb-1.5">Preferred Time</label>
                            <div className="grid grid-cols-4 gap-1.5">
                              {TIME_SLOTS.map(t => {
                                const isHappyHour = t >= (rates?.happyHourStart || '18:00') && t < (rates?.happyHourEnd || '19:00');
                                const count = slotCounts[t] || 0;
                                const isFull = count >= 5;
                                const bufferHours = 1;
                                const isPastTime = isToday(selectedDate!) && parseInt(t.split(':')[0]) <= now.getHours() + bufferHours;
                                const disabled = isHappyHour || isFull || isPastTime;

                                return (
                                  <button 
                                    key={t} 
                                    disabled={disabled} 
                                    onClick={() => setResForm(f => ({ ...f, timeSlot: t }))} 
                                    className={`relative py-2 rounded-lg text-xs font-semibold transition-all overflow-hidden ${
                                      isHappyHour 
                                        ? 'bg-neutral-800/50 text-neutral-600 border border-neutral-800/50 cursor-not-allowed' 
                                        : isPastTime
                                        ? 'bg-neutral-900/30 text-neutral-600/50 border border-neutral-800/30 cursor-not-allowed'
                                        : isFull
                                        ? 'bg-rose-950/30 text-rose-500/50 border border-rose-900/30 cursor-not-allowed'
                                        : resForm.timeSlot === t 
                                        ? 'bg-emerald-600 text-white' 
                                        : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200'
                                    }`}
                                  >
                                    {formatTime(t)}
                                    {isFull && !isPastTime && !isHappyHour && <span className="absolute inset-0 flex items-center justify-center bg-rose-950/80 text-rose-500 text-[9px] uppercase tracking-widest backdrop-blur-[1px]">Full</span>}
                                    {isPastTime && <span className="absolute inset-0 flex items-center justify-center bg-neutral-950/80 text-neutral-500 text-[9px] uppercase tracking-widest backdrop-blur-[1px]">Unavailable</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-neutral-400 mb-1.5">Promo Code <span className="text-neutral-600">(optional)</span></label>
                            {appliedPromo ? (
                              <div className="flex items-center gap-2 bg-emerald-600/10 border border-emerald-600/30 rounded-lg px-3 py-2">
                                <span className="text-xs text-emerald-300 font-semibold flex-1">{appliedPromo.code} — {appliedPromo.discountPercent}% off applied!</span>
                                <button onClick={handleRemovePromo} className="text-neutral-500 hover:text-rose-400 transition-colors"><X size={13} /></button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <input type="text" value={promoCodeInput} onChange={e => { setPromoCodeInput(e.target.value.toUpperCase()); setPromoError(''); }} className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100" />
                                <button onClick={handleApplyPromo} className="px-4 py-2 bg-emerald-600/20 text-emerald-400 rounded-lg text-xs font-semibold">Apply</button>
                              </div>
                            )}
                          </div>
                          
                          <div className="bg-neutral-800/60 rounded-xl p-4 border border-neutral-700/50 mt-4">
                            <p className="text-xs text-neutral-500 mb-2 uppercase tracking-wider font-semibold">Booking Summary</p>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between"><span className="text-neutral-400">Total Amount</span><span className="text-white font-semibold">₱{totalAmount}.00</span></div>
                              <div className="flex justify-between"><span className="text-amber-400">Down Payment ({rates?.downPaymentPercent || 25}%)</span><span className="text-amber-300 font-semibold">₱{downPayment}.00</span></div>
                            </div>
                            
                            {/* 🚨 NEW: Non-Refundable Warning 🚨 */}
                            <div className="mt-3 pt-3 border-t border-neutral-700/50 flex gap-2 items-start">
                              <AlertTriangle size={12} className="text-rose-400 mt-0.5 flex-none" />
                              <p className="text-[10px] text-neutral-400 leading-tight">
                                <strong className="text-rose-400">Strict Policy:</strong> All down payments are final and <strong className="text-white">non-refundable</strong> in the event of cancellation or no-show. Rescheduling requires management approval.
                              </p>
                            </div>
                          </div>

                          {resError && (
                            <div className="bg-rose-950/40 border border-rose-800/50 text-rose-400 text-xs px-3 py-2 rounded-lg mt-3">
                              {resError}
                            </div>
                          )}

                          <button onClick={handleReservationSubmit} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 text-white py-3 rounded-xl text-sm font-semibold">
                            Proceed to Payment
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* --- RIGHT SIDEBAR (MY BOOKINGS) --- */}
                <div className="w-full lg:w-[320px] flex-none">
                  {/* Sticky wrapper so it stays in view when scrolling down the form */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col sticky top-24">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-neutral-300 flex items-center gap-2"><Calendar size={14} className="text-blue-500" /> My Bookings</h2>
                    </div>
                    
                    {(() => {
                      const myEmail = currentUser?.email || guestEmail;
                      const myReservations = myEmail ? reservations.filter(r => r.email === myEmail).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];
                      
                      if (!myEmail) {
                        return (
                          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-neutral-800 rounded-lg p-5 text-center mt-2">
                            <p className="text-xs text-neutral-500 mb-3">Log in or register to view your cross-device booking history.</p>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setShowLoginModal(true)} className="text-xs bg-neutral-800 text-neutral-300 hover:text-white px-4 py-2 rounded-lg font-semibold hover:bg-neutral-700 transition-colors">
                                Login
                              </button>
                              <button onClick={() => setShowRegisterModal(true)} className="text-xs bg-emerald-600/20 text-emerald-400 px-4 py-2 rounded-lg font-semibold hover:bg-emerald-600/30 transition-colors">
                                Register
                              </button>
                            </div>
                          </div>
                        );
                      }
                      if (myReservations.length === 0) {
                        return <div className="flex-1 flex items-center justify-center border border-dashed border-neutral-800 rounded-lg h-24 mt-2"><p className="text-xs text-neutral-500">No recent reservations.</p></div>;
                      }
                      return (
                        <div className="space-y-2 overflow-y-auto max-h-[60vh] pr-1 mt-2">
                          {myReservations.map(r => {
                            // 🚨 TIME CHECK: Is this reservation from yesterday or earlier?
                            const rDate = new Date(r.date);
                            rDate.setHours(0,0,0,0);
                            const today = new Date();
                            today.setHours(0,0,0,0);
                            
                            const isPastDate = rDate.getTime() < today.getTime();
                            
                            // If it's a past date and not cancelled, force the display to show 'completed'
                            const displayStatus = (isPastDate && r.status !== 'cancelled') ? 'completed' : r.status;

                            return (
                              <div key={r.id} className="bg-neutral-950 border border-neutral-800/50 rounded-lg p-3 text-xs">
                                <div className="flex justify-between items-start mb-1.5">
                                  <span className="font-semibold text-neutral-200">{format(new Date(r.date), 'MMM d, yyyy')}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                    displayStatus === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' :
                                    displayStatus === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                                    displayStatus === 'completed' ? 'bg-neutral-800 text-neutral-400' :
                                    'bg-rose-500/10 text-rose-400'
                                  }`}>{displayStatus}</span>
                                </div>
                                <div className="flex justify-between text-neutral-500 text-[11px]">
                                  <span>{formatTime(r.timeSlot || '00:00')} ({r.durationHours} hrs)</span>
                                  <span>₱{r.totalAmount}</span>
                                </div>
                                
                                {/* 🚨 CANCEL BUTTON LOGIC 🚨 */}
                                {/* Only show Cancel if it's an active status AND NOT a past date! */}
                                {!isPastDate && (r.status === 'pending' || r.status === 'confirmed') && (
                                  <button
                                    onClick={() => setCancelModal({ isOpen: true, id: r.id, category: 'Standard Cancellation', reason: '', loading: false })}
                                    className="w-full mt-2.5 py-1.5 rounded-md bg-rose-950/20 text-rose-400 hover:bg-rose-900/40 border border-rose-900/30 hover:border-rose-700/50 text-[10px] font-bold transition-colors uppercase tracking-wider"
                                  >
                                    Cancel Booking
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* ════ RATES SECTION ════ */}
          {activeSection === 'rates' && (
            <motion.div
              key="rates"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto px-6 py-10"
            >
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-white mb-2">Table Rates</h2>
                <p className="text-neutral-400 text-sm">Transparent and affordable pricing for everyone.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {[
                  {
                    name: 'Standard Play',
                    rate: `₱${rates?.hourlyRate || 250}`,
                    unit: '/ hour',
                    desc: 'Walk-in regular play on any available table.',
                    features: ['First-Come First-Served', 'Any available table', 'Cue sticks included', 'Timer monitored'],
                    badge: null,
                    color: 'neutral',
                  },
                  {
                    name: 'Reserved Table',
                    rate: `₱${rates?.hourlyRate || 250}`,
                    unit: '/ hour',
                    desc: 'Book a specific time slot and table in advance.',
                    features: ['Guaranteed table slot', `${rates?.downPaymentPercent || 25}% down payment`, 'Priority seating', 'Advance booking'],
                    badge: 'Popular',
                    color: 'emerald',
                  },
                  {
                    name: 'Happy Hour',
                    rate: `₱${rates?.happyHourRate || 200}`,
                    unit: '/ hour',
                    desc: `Discounted walk-in rate every weekday ${rates?.happyHourStart || '18:00'}–${rates?.happyHourEnd || '19:00'}.`,
                    features: [`Weekdays only (${rates?.happyHourStart || '18:00'}–${rates?.happyHourEnd || '19:00'})`, 'Walk-in ONLY - No reservations', 'Discounted standard rate', 'Subject to availability'],
                    badge: 'Limited',
                    color: 'amber',
                  },
                ].map(({ name, rate, unit, desc, features, badge, color }) => (
                  <div
                    key={name}
                    className={`relative bg-neutral-900 border rounded-2xl p-6 flex flex-col ${
                      color === 'emerald' ? 'border-emerald-600/50 shadow-lg shadow-emerald-950/50' : color === 'amber' ? 'border-amber-600/30' : 'border-neutral-800'
                    }`}
                  >
                    {badge && (
                      <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                        color === 'emerald' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                      }`}>
                        {badge}
                      </span>
                    )}
                    <p className={`text-xs uppercase tracking-widest font-semibold mb-2 ${
                      color === 'emerald' ? 'text-emerald-400' : color === 'amber' ? 'text-amber-400' : 'text-neutral-500'
                    }`}>{name}</p>
                    <div className="flex items-end gap-1 mb-3">
                      <span className={`text-4xl font-black ${color === 'emerald' ? 'text-emerald-400' : color === 'amber' ? 'text-amber-400' : 'text-white'}`}>{rate}</span>
                      <span className="text-neutral-500 text-sm mb-1">{unit}</span>
                    </div>
                    <p className="text-neutral-500 text-xs mb-5 leading-relaxed">{desc}</p>
                    <ul className="space-y-2 flex-1">
                      {features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs text-neutral-400">
                          <CheckCircle size={12} className={color === 'emerald' ? 'text-emerald-500' : color === 'amber' ? 'text-amber-500' : 'text-neutral-600'} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {name !== 'Happy Hour' ? (
                      <button
                        onClick={() => setActiveSection('reservations')}
                        className={`mt-5 w-full py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' :
                          'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700'
                        }`}
                      >
                        Book Now
                      </button>
                    ) : (
                      <div className="mt-5 w-full py-2.5 rounded-xl text-xs font-semibold text-center bg-amber-950/40 text-amber-600 border border-amber-800/40">
                        🚶 Walk-in Only — No Online Booking
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Additional Info */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4">Additional Information</h3>

                <div className="flex gap-3 bg-emerald-950/40 border border-emerald-700/30 rounded-xl p-4 mb-5">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-600/20 flex items-center justify-center mt-0.5">
                    <Info size={13} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-emerald-300 text-xs font-semibold mb-1">Reservation Redemption Policy</p>
                    <p className="text-neutral-400 text-xs leading-relaxed">
                      After completing your reservation and {rates?.downPaymentPercent || 25}% down payment, the <span className="text-white font-medium">remaining balance must be settled in full upon arrival</span> before your table time begins — payable via <span className="text-white font-medium">Cash or GCash</span>.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {[
                    { label: 'Minimum booking time', value: '1 hour' },
                    { label: 'Down payment required', value: `${rates?.downPaymentPercent || 25}% of total` },
                    { label: 'Remaining balance', value: 'Paid on-site before play begins' },
                    { label: 'Cancellation policy', value: '24 hours before reservation' },
                    { label: 'Payment methods', value: 'GCash, Cash' },
                    { label: 'Walk-in queue', value: 'First Come, First Served — when tables are available' },
                    { label: 'Extension charges', value: 'Regular rate applies' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between py-2 border-b border-neutral-800/60">
                      <span className="text-neutral-500">{label}</span>
                      <span className="text-neutral-200 font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ════ ABOUT SECTION ════ */}
          {activeSection === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-5xl mx-auto px-6 py-10"
            >
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-white mb-2">About One Shot</h2>
                <p className="text-neutral-400 text-sm">The story behind your favorite billiards destination</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-12">
                <div>
                  <p className="text-emerald-400 text-xs uppercase tracking-widest font-semibold mb-3">Our Story</p>
                  <h3 className="text-2xl font-bold text-white mb-4">A Passion for the Game</h3>
                  {(siteSettings?.aboutStory || "One Shot Bar & Billiards was founded with a simple mission: to create the ultimate billiard experience in Cainta, Rizal. What started as a small hobby shop has grown into the premier billiards destination in Eastern Rizal.\n\nOur 10 tournament grade tables are maintained with precision, and our staff are passionate players themselves who understand what makes a great game environment.\n\nWhether you are a seasoned champion or picking up a cue for the first time, One Shot welcomes you. Come in, relax, and take your shot!").split('\n').map((paragraph, idx) => (
                    paragraph.trim() && <p key={idx} className="text-neutral-400 text-sm leading-relaxed mb-4">{paragraph}</p>
                  ))}
                </div>
                <div className="rounded-2xl overflow-hidden h-72">
                  <ImageWithFallback
                    src={siteSettings?.aboutImage || "https://images.unsplash.com/photo-1761335633357-04fab36b333f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXIlMjBsb3VuZ2UlMjBkYXJrJTIwYW1iaWFuY2V8ZW58MXx8fHwxNzc0OTUxMzE1fDA&ixlib=rb-4.1.0&q=80&w=1080"}
                    alt="One Shot Bar & Billiards"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Location Map */}
              <div className="mb-12">
                <h3 className="text-center text-xl font-bold text-white mb-6">Our Location</h3>
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden h-64 flex items-center justify-center relative">
                  
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.3546747517616!2d121.1118129!3d14.5788544!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397c7f3e8b0b8c3%3A0x8e8a60f3b0f5b0a!2sAutobase%20OAX!5e0!3m2!1sen!2sph!4v1700000000000!5m2!1sen!2sph"
                    className="absolute inset-0 w-full h-full opacity-30 grayscale pointer-events-none"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <div className="absolute inset-0 bg-neutral-950/50" /> 
                  
                  <div className="relative z-10 text-center">
                    <MapPin size={32} className="text-emerald-500 mx-auto mb-2 drop-shadow-lg" />
                    <p className="text-white font-semibold text-sm drop-shadow-md">One Shot Bar & Billiards</p>
                    <p className="text-neutral-300 text-xs drop-shadow-md">Autobase OAX, San Juan, Cainta, Rizal 1900</p>
                    <a
                      href="https://www.google.com/maps/place/One+Shot+Bar+and+Billiards/@14.5813335,121.1249395,17z/data=!3m1!4b1!4m6!3m5!1s0x3397c70049cd2efb:0x4b8fd5634abcd6cc!8m2!3d14.5813335!4d121.1275144!16s%2Fg%2F11wwhbc6y5?entry=ttu&g_ep=EgoyMDI2MDQwOC4wIKXMDSoASAFQAw%3D%3D"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-xs bg-emerald-600/90 backdrop-blur-sm text-white px-5 py-2.5 rounded-full hover:bg-emerald-500 transition-colors shadow-xl shadow-black/50 border border-emerald-500/50"
                    >
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              </div>

              <div className="mb-12">
                <h3 className="text-center text-xl font-bold text-white mb-6">Our Facilities</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: '🎱', title: '10 Tables', desc: 'Tournament-grade billiard tables' },
                    { icon: '🍺', title: 'Bar Counter', desc: 'Drinks & light snacks available' },
                    { icon: '📡', title: 'Free WiFi', desc: 'High-speed internet connection' },
                    { icon: '🎵', title: 'Music System', desc: 'Great ambiance & sound system' },
                    { icon: '📷', title: 'CCTV', desc: '24/7 security surveillance' },
                    { icon: '🚗', title: 'Parking', desc: 'Limited parking available' },
                    { icon: '🏆', title: 'Tournament', desc: 'Monthly pool tournaments' },
                    { icon: '👟', title: 'Lounge Area', desc: 'Comfortable waiting & spectator zone' },
                  ].map(({ icon, title, desc }) => (
                    <div key={title} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center hover:border-neutral-700 transition-colors">
                      <div className="text-2xl mb-2">{icon}</div>
                      <p className="text-white text-xs font-semibold mb-1">{title}</p>
                      <p className="text-neutral-600 text-[10px] leading-tight">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-neutral-800 pt-10">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-white mb-1">Contact Us</h3>
                  <p className="text-neutral-400 text-sm">We'd love to hear from you. Get in touch!</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    {[
                      { icon: MapPin, label: 'Address', value: siteSettings?.contactAddress || 'Autobase OAX\nSan Juan, Cainta, Rizal 1900', color: 'emerald' },
                      { icon: Phone, label: 'Phone / Viber', value: siteSettings?.contactPhone || '0917-123-4567\n0998-765-4321', color: 'sky' },
                      { icon: Mail, label: 'Email', value: siteSettings?.contactEmail || 'oneshot.billiards@gmail.com', color: 'violet' },
                      { icon: Clock, label: 'Operating Hours', value: siteSettings?.contactHours || 'Mon – Sat: 12:00 PM – 3:00 AM\nSunday: 5:00 PM – 3:00 AM', color: 'amber' },
                    ].map(({ icon: Icon, label, value, color }) => (
                      <div key={label} className={`bg-neutral-900 border border-neutral-800 hover:border-${color}-600/30 rounded-xl p-5 transition-all flex gap-4`}>
                        <div className={`w-10 h-10 rounded-xl bg-${color}-600/10 border border-${color}-600/20 flex items-center justify-center flex-shrink-0`}>
                          <Icon size={16} className={`text-${color}-400`} />
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1">{label}</p>
                          {value.split('\n').map((line, i) => (
                            <p key={i} className="text-sm text-neutral-200">{line}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                      <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-3">Follow Us</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { platform: 'Facebook', handle: '@OneShotBilliards', icon: '📘' },
                          { platform: 'Instagram', handle: '@oneshot_billiards', icon: '📸' },
                          { platform: 'TikTok', handle: '@oneshotbilliards', icon: '🎵' },
                          { platform: 'YouTube', handle: 'One Shot Billiards', icon: '📺' },
                        ].map(({ platform, handle, icon }) => (
                          <div key={platform} className="flex items-center gap-2.5 bg-neutral-800/60 rounded-lg p-3">
                            <span className="text-lg">{icon}</span>
                            <div>
                              <p className="text-[10px] text-neutral-500">{platform}</p>
                              <p className="text-xs text-neutral-300">{handle}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════ TATTOO SECTION ════ */}
          {activeSection === 'tattoo' && (
            <motion.div
              key="tattoo"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TattooSection
                currentUserName={currentUser?.name}
                currentUserEmail={currentUser?.email}
              />
            </motion.div>
          )}

          {/* ════ FEEDBACK SECTION ════ */}
          {activeSection === 'reviews' && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto px-6 py-10"
            >
              <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-white mb-2">Feedback</h2>
                <p className="text-neutral-400 text-sm">Send a private message directly to our management team.</p>
              </div>

              {simpleFeedbackSent ? (
                <div className="bg-sky-600/10 border border-sky-600/30 rounded-2xl p-10 text-center">
                  <CheckCircle size={40} className="text-sky-400 mx-auto mb-3" />
                  <p className="text-sky-300 font-semibold text-lg mb-1">Message Sent!</p>
                  <p className="text-neutral-500 text-sm">Our management team will review your message shortly.</p>
                </div>
              ) : (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="text-sky-400" size={18} />
                    <p className="text-sm font-semibold text-white">Send a Direct Message</p>
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-400 mb-1.5">Your Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={simpleFeedbackForm.name}
                      onChange={e => setSimpleFeedbackForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Juan dela Cruz"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-400 mb-1.5">Contact Information <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={simpleFeedbackForm.contact}
                      onChange={e => setSimpleFeedbackForm(f => ({ ...f, contact: e.target.value }))}
                      placeholder="Email or Phone Number"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-400 mb-1.5">Type of Feedback <span className="text-rose-500">*</span></label>
                    <select
                      value={simpleFeedbackForm.type}
                      onChange={e => setSimpleFeedbackForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-sky-500 transition-colors appearance-none"
                    >
                      <option value="" disabled>Select a category...</option>
                      <option value="suggestion">Suggestion</option>
                      <option value="complaint">Concern / Complaint</option>
                      <option value="lost_item">Lost Item</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-400 mb-1.5">Message</label>
                    <textarea
                      value={simpleFeedbackForm.message}
                      onChange={e => setSimpleFeedbackForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Please provide details..."
                      rows={5}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-sky-500 transition-colors resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSimpleFeedbackSubmit}
                    disabled={!simpleFeedbackForm.name || !simpleFeedbackForm.contact || !simpleFeedbackForm.type}
                    className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold transition-all"
                  >
                    Submit Feedback
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Footer ── */}
        <footer className="bg-neutral-900 border-t border-neutral-800 mt-10 py-8 px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <img
                src={logoImg}
                alt="One Shot Bar & Billiards"
                className="h-8 w-8 object-contain"
              />
              <span className="text-white font-bold text-sm">One Shot Bar & Billiards</span>
            </div>
            <p className="text-neutral-600 text-xs mb-2">Autobase OAX, Cainta, Rizal · Mon–Sat 12PM–3AM · Sun 5PM–3AM</p>
            <p className="text-neutral-700 text-[10px]">© 2026 One Shot Bar & Billiards. All rights reserved.</p>
          </div>
        </footer>
      </main>

      {/* ════ MODALS ════ */}

      {/* Customer Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowLoginModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-white">User Login</h3>
                  <p className="text-xs text-neutral-500">Welcome back!</p>
                </div>
                <button onClick={() => setShowLoginModal(false)} className="text-neutral-600 hover:text-neutral-300 transition-colors">
                  <X size={18} />
                </button>
              </div>

              {loginForm.error && (
                <div className="bg-rose-950/40 border border-rose-800/50 text-rose-400 text-xs px-3 py-2 rounded-lg mb-4">
                  {loginForm.error}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5">Email</label>
                  <input
                    type="email" value={loginForm.email}
                    onChange={e => setLoginForm(f => ({ ...f, email: e.target.value, error: '' }))}
                    onKeyDown={e => e.key === 'Enter' && handleLoginSubmit()}
                    placeholder="your@email.com"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs text-neutral-400">Password</label>
                    <button
                      type="button"
                      onClick={() => { setShowLoginModal(false); setShowForgotPwModal(true); }}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={loginForm.showPw ? 'text' : 'password'} value={loginForm.password}
                      onChange={e => setLoginForm(f => ({ ...f, password: e.target.value, error: '' }))}
                      onKeyDown={e => e.key === 'Enter' && handleLoginSubmit()}
                      placeholder="••••••••"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 pr-10 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button onClick={() => setLoginForm(f => ({ ...f, showPw: !f.showPw }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400">
                      {loginForm.showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <button onClick={handleLoginSubmit} disabled={isLoggingIn} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
                {isLoggingIn ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </button>

              <p className="text-center text-xs text-neutral-600 mt-4">
                Don't have an account?{' '}
                <button onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }} className="text-emerald-400 hover:text-emerald-300 font-semibold">
                  Register
                </button>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPwModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setShowForgotPwModal(false); setForgotPwMsg(''); setForgotPwEmail(''); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-white">Reset Password</h3>
                  <p className="text-xs text-neutral-500">We'll send you instructions.</p>
                </div>
                <button onClick={() => { setShowForgotPwModal(false); setForgotPwMsg(''); setForgotPwEmail(''); }} className="text-neutral-600 hover:text-neutral-300 transition-colors">
                  <X size={18} />
                </button>
              </div>

              {forgotPwMsg && (
                <div className={`text-xs px-3 py-2.5 rounded-lg mb-4 font-medium ${forgotPwMsg.startsWith('Error') ? 'bg-rose-950/40 border border-rose-800/50 text-rose-400' : 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-400'}`}>
                  {forgotPwMsg}
                </div>
              )}

              {!forgotPwMsg.startsWith('Success') && (
                <>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1.5">Email Address</label>
                      <input
                        type="email" value={forgotPwEmail}
                        onChange={e => { setForgotPwEmail(e.target.value); setForgotPwMsg(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleForgotPasswordSubmit()}
                        placeholder="your@email.com"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleForgotPasswordSubmit}
                    disabled={isResettingPw || !forgotPwEmail}
                    className="w-full mt-5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    {isResettingPw ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                    {isResettingPw ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </>
              )}

              <p className="text-center text-xs text-neutral-600 mt-4">
                Remembered your password?{' '}
                <button onClick={() => { setShowForgotPwModal(false); setShowLoginModal(true); setForgotPwMsg(''); setForgotPwEmail(''); }} className="text-emerald-400 hover:text-emerald-300 font-semibold">
                  Back to Login
                </button>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUpdatePwModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="mb-5">
                <h3 className="text-lg font-bold text-white">Create New Password</h3>
                <p className="text-xs text-neutral-500">Please enter your new password below.</p>
              </div>

              {updatePwForm.error && (
                <div className="bg-rose-950/40 border border-rose-800/50 text-rose-400 text-xs px-3 py-2 rounded-lg mb-4">
                  {updatePwForm.error}
                </div>
              )}
              {updatePwForm.success && (
                <div className="bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 text-xs px-3 py-2 rounded-lg mb-4">
                  {updatePwForm.success}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5">New Password</label>
                  <input
                    type="password" value={updatePwForm.password}
                    onChange={e => setUpdatePwForm(f => ({ ...f, password: e.target.value, error: '' }))}
                    placeholder="••••••••"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5">Confirm New Password</label>
                  <input
                    type="password" value={updatePwForm.confirm}
                    onChange={e => setUpdatePwForm(f => ({ ...f, confirm: e.target.value, error: '' }))}
                    placeholder="••••••••"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <button
                onClick={handleUpdatePasswordSubmit}
                disabled={updatePwForm.loading || !!updatePwForm.success || !updatePwForm.password}
                className="w-full mt-5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white py-3 rounded-xl text-sm font-semibold transition-all flex justify-center items-center gap-2"
              >
                {updatePwForm.loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                {updatePwForm.loading ? 'Updating...' : 'Update Password'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Register Modal */}
      <AnimatePresence>
        {showRegisterModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowRegisterModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-white">Create Account</h3>
                  <p className="text-xs text-neutral-500">Join One Shot today</p>
                </div>
                <button onClick={() => { setShowRegisterModal(false); setRegisterSuccessMsg(''); }} className="text-neutral-600 hover:text-neutral-300 transition-colors">
                  <X size={18} />
                </button>
              </div>

              {registerSuccessMsg ? (
                <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-2xl p-8 text-center space-y-3">
                  <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-2"><Mail size={32} className="text-emerald-400" /></div>
                  <h4 className="text-lg font-bold text-emerald-400">Check Your Email</h4>
                  <p className="text-sm text-neutral-300 leading-relaxed">{registerSuccessMsg}</p>
                  <button onClick={() => { setShowRegisterModal(false); setRegisterSuccessMsg(''); setShowLoginModal(true); }} className="mt-4 bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all">
                    Go to Login
                  </button>
                </div>
              ) : (
                <>
                  {registerForm.error && <div className="bg-rose-950/40 border border-rose-800/50 text-rose-400 text-xs px-3 py-2 rounded-lg mb-4">{registerForm.error}</div>}
                  <div className="space-y-3">
                    {[
                      { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Juan dela Cruz' },
                      { key: 'email', label: 'Email', type: 'email', placeholder: 'juan@email.com' },
                      { key: 'phone', label: 'Contact Number', type: 'tel', placeholder: '09XXXXXXXXX' },
                    ].map(({ key, label, type, placeholder }) => (
                      <div key={key}>
                        <label className="block text-xs text-neutral-400 mb-1.5">{label} <span className="text-rose-500">*</span></label>
                        <input 
                          type={type} 
                          value={(registerForm as any)[key]} 
                          onChange={e => {
                            let val = e.target.value;
                            if (key === 'phone') {
                              val = val.replace(/\D/g, '');
                              if (val.length > 11) return; // Block typing past 11 digits
                            }
                            setRegisterForm(f => ({ ...f, [key]: val, error: '' }));
                          }} 
                          placeholder={placeholder} 
                          className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-emerald-500" 
                        />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1.5">Password <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <input type={registerForm.showPw ? 'text' : 'password'} value={registerForm.password} onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value, error: '' }))} placeholder="••••••••" className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 pr-10 text-sm text-neutral-100 focus:outline-none focus:border-emerald-500" />
                        <button onClick={() => setRegisterForm(f => ({ ...f, showPw: !f.showPw }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400"><Eye size={14} /></button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1.5">Referral Code <span className="text-neutral-600">(optional)</span></label>
                      <input type="text" value={registerForm.referralCode} onChange={e => setRegisterForm(f => ({ ...f, referralCode: e.target.value.toUpperCase(), error: '' }))} placeholder="e.g. JUAN-AB12" className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-emerald-500 font-mono" />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1.5">Confirm Password</label>
                      <input type="password" value={registerForm.confirm} onChange={e => setRegisterForm(f => ({ ...f, confirm: e.target.value, error: '' }))} placeholder="••••••••" className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-emerald-500" />
                    </div>
                  </div>

                  <button onClick={handleRegisterSubmit} disabled={isRegistering} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white py-3 rounded-xl text-sm font-semibold flex justify-center gap-2">
                    {isRegistering ? 'Creating Account...' : 'Create Account'}
                  </button>

                  <p className="text-center text-xs text-neutral-600 mt-4">
                    Already have an account? <button onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); }} className="text-emerald-400 hover:text-emerald-300 font-semibold">Login</button>
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Settings Modal */}
      {currentUser && (
        <CustomerSettingsModal 
          isOpen={showProfileModal} 
          onClose={() => setShowProfileModal(false)}
          currentUser={currentUser}
          onUpdateUser={handleUpdateCustomerProfile}
          onLogout={() => {
            handleCustomerLogout(); // Triggers the secure sign out and toast
            setShowProfileModal(false); // Closes the modal
          }}
        />
      )}

      {/* Payment Modal */}
      <AnimatePresence>
        {reservationStep === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">
              <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
                <div><h3 className="text-base font-bold text-white">Down Payment</h3><p className="text-xs text-neutral-500">Step 2 of 2 · Secure your reservation</p></div>
                <button onClick={closeReservation} className="text-neutral-600 hover:text-neutral-300"><X size={18} /></button>
              </div>
              
              <div className="p-6">
                <div className="bg-amber-950/30 border border-amber-800/30 rounded-xl p-4 mb-5 text-center">
                  <p className="text-xs text-amber-500 mb-1">Amount Due</p>
                  <p className="text-4xl font-black text-amber-400">₱{downPayment}.00</p>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="bg-white p-2 rounded-xl inline-block w-36 h-36 flex items-center justify-center shadow-lg">
                      <img src={gcashQrImg} alt="GCash QR Code" className="w-full h-full object-contain rounded-lg" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-blue-400">GCash</p>
                      <p className="text-xs text-neutral-300 font-semibold">ONE SHOT BAR & BILLIARDS</p>
                      <p className="text-xs text-neutral-500">+63 917-123-4567</p>
                    </div>
                  </div>
                  <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-center">
                    <p className="text-xs text-neutral-500">Scan the QR code using your GCash app</p>
                    <p className="text-xs text-neutral-600 mt-0.5">Send exactly <span className="text-amber-400 font-semibold">₱{downPayment}.00</span></p>
                  </div>
                </div>

                <div className="w-full space-y-3 mt-5 text-left border-t border-neutral-800 pt-5">
                  {uploadError && (
                    <div className="bg-rose-950/40 border border-rose-800/50 text-rose-400 text-xs px-3 py-2 rounded-lg">
                      {uploadError}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1.5">GCash Reference Number <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={e => { 
                        const val = e.target.value;
                        // Only update state if the length (excluding spaces) is 13 or less
                        if (val.replace(/\s/g, '').length <= 13) {
                          setReferenceNumber(val); 
                          setUploadError(''); 
                        }
                      }}
                      placeholder="e.g. 10023948293"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1.5">Upload Screenshot <span className="text-rose-500">*</span></label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => { setReceiptFile(e.target.files?.[0] || null); setUploadError(''); }}
                      className="w-full text-xs text-neutral-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600/20 file:text-blue-400 hover:file:bg-blue-600/30 transition-all cursor-pointer"
                    />
                  </div>
                </div>

                <button onClick={handlePaymentConfirm} disabled={confirmingPayment || !referenceNumber} className="w-full mt-5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                  {confirmingPayment ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={15} />}
                  {confirmingPayment ? 'Verifying...' : "I've Sent the Payment"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {reservationStep === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 20 }} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
              <h3 className="text-xl font-black text-white mb-2">Reservation Submitted!</h3>
              <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
                Your reservation for <strong className="text-neutral-200">{selectedDate?.toLocaleDateString('en-PH', { month: 'long', day: 'numeric' })}</strong> at <strong className="text-neutral-200">{formatTime(resForm.timeSlot)}</strong> has been submitted. Our staff will verify your payment and confirm shortly.
              </p>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-5 text-xs space-y-1.5 text-left">
                <div className="flex justify-between"><span className="text-neutral-500">Name</span><span className="text-neutral-200">{resForm.name}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Email</span><span className="text-neutral-200">{resForm.email}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Down Payment</span><span className="text-emerald-400 font-semibold\">₱{downPayment}.00 ✓</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Status</span><span className="text-amber-400">Pending Verification</span></div>
              </div>
              <button
                onClick={closeReservation}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-sm font-semibold transition-all"
              >
                Back to Home
              </button>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
      {/* Customer Cancellation Modal */}
      <AnimatePresence>
        {cancelModal.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertTriangle size={18} className="text-rose-500" /> Cancel Reservation
                </h3>
                <button onClick={() => setCancelModal({ isOpen: false, id: '', category: 'Standard Cancellation', reason: '', loading: false })} className="text-neutral-600 hover:text-neutral-300">
                  <X size={18} />
                </button>
              </div>
              
              <div className="bg-rose-950/30 border border-rose-900/50 rounded-xl p-3 mb-4">
                <p className="text-xs text-rose-400 leading-relaxed">
                  Are you sure you want to cancel? As per our policy, your down payment is <strong className="text-white">non-refundable</strong>. This action cannot be undone.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5">Cancellation Category <span className="text-rose-500">*</span></label>
                  <select
                    value={cancelModal.category}
                    onChange={e => setCancelModal(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-100 focus:outline-none focus:border-rose-500 transition-colors appearance-none"
                  >
                    <option value="Standard Cancellation">Standard Cancellation</option>
                    <option value="Medical Emergency">Medical Emergency</option>
                    <option value="Schedule Conflict">Schedule Conflict</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5">Reason for Cancellation <span className="text-rose-500">*</span></label>
                  <textarea
                    value={cancelModal.reason}
                    onChange={e => setCancelModal(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Please tell us why you are cancelling..."
                    rows={3}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-rose-500 resize-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setCancelModal({ isOpen: false, id: '', category: 'Standard Cancellation', reason: '', loading: false })}
                  disabled={cancelModal.loading}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleCustomerCancel}
                  disabled={cancelModal.loading || !cancelModal.reason.trim()}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900 disabled:text-rose-400 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex justify-center items-center gap-2"
                >
                  {cancelModal.loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  {cancelModal.loading ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}