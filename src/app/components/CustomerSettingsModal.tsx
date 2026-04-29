import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Lock, Shield, Pencil, X, Save, CheckCircle,
  AlertTriangle, LogOut, Mail, Phone, EyeOff, Eye, Award, CalendarDays, Check, Calendar, Clock, ChevronLeft, ChevronRight
} from 'lucide-react';
import { supabase } from '../../utils/supabase/client';
import { useAppContext } from '../context/AppContext';
import { format, isToday, differenceInMinutes } from 'date-fns';

type Section = 'profile' | 'security';

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

// ── MiniCalendar Component for Rescheduling ──
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
  const isTodayDate = (date: Date) => date.getTime() === today.getTime();

  const prevMonth = () => { const d = new Date(viewDate); d.setMonth(d.getMonth() - 1); setViewDate(d); };
  const nextMonth = () => { const d = new Date(viewDate); d.setMonth(d.getMonth() + 1); setViewDate(d); };

  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-700 p-4 select-none">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prevMonth} className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-white">{MONTHS[month]} {year}</span>
        <button type="button" onClick={nextMonth} className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
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
          const today_ = isTodayDate(date);
          const reserved = isReserved(date) && currentMonth;
          const clickable = currentMonth && !past;
          
          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          const closedInfo = currentMonth ? closedDates.find(cd => cd.date === dateStr) : null;

          return (
            <button
              key={idx} type="button" disabled={!clickable} onClick={() => clickable && onSelect(date)}
              className={`
                relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all
                ${!currentMonth ? 'opacity-20 cursor-default' : ''}
                ${past && currentMonth ? 'opacity-30 cursor-default text-neutral-600' : ''}
                ${selected && !closedInfo ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/50' : ''}
                ${selected && closedInfo ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50' : ''}
                ${!selected && closedInfo && clickable ? 'bg-rose-950/30 border border-rose-800/50 text-rose-400 hover:bg-rose-900/40' : ''}
                ${!selected && !closedInfo && today_ ? 'border border-amber-500 text-amber-400' : ''}
                ${!selected && !closedInfo && clickable && !today_ ? 'text-neutral-300 hover:bg-neutral-800 hover:text-white' : ''}
              `}
            >
              <span>{day}</span>
              {reserved && !selected && !closedInfo && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CustomerSettingsModal({
  isOpen, onClose, currentUser, onUpdateUser, onLogout
}: CustomerSettingsModalProps) {
  const { tattooReservations, confirmReschedule, reservations, closedDates, rates, proposeReschedule } = useAppContext();
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [saved, setSaved] = useState<string | null>(null);

  // ── Reschedule Form State ──
  const [rescheduleTargetId, setRescheduleTargetId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date | null>(null);
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState('');

  // ── Profile Form State ──
  const [profileEdit, setProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone || '',
  });

  // ── Password Form State ──
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [secError, setSecError] = useState('');

  const myBookings = tattooReservations.filter(r => r.email === currentUser.email || r.contactNumber === currentUser.phone);
  const myTableBookings = reservations.filter(r => r.email === currentUser.email || r.contactNumber === currentUser.phone);

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

  const handleSubmitReschedule = async () => {
    if (!rescheduleTargetId || !rescheduleDate || !rescheduleTimeSlot) return;
    
    // Set exact hour/minute for the Date object
    const finalDate = new Date(rescheduleDate);
    const [hours, minutes] = rescheduleTimeSlot.split(':').map(Number);
    finalDate.setHours(hours, minutes, 0, 0);

    // Call the context function to save it
    await proposeReschedule(rescheduleTargetId, finalDate, rescheduleTimeSlot);
    
    // Clean up UI
    setRescheduleTargetId(null);
    setRescheduleDate(null);
    setRescheduleTimeSlot('');
    setSaved('Reschedule request sent! We will confirm shortly.');
    setTimeout(() => setSaved(null), 3000);
  };

  // ── Availability Math for Rescheduling ──
  const selectedDateStr = rescheduleDate ? format(rescheduleDate, 'yyyy-MM-dd') : null;
  const selectedClosedDate = closedDates.find(cd => cd.date === selectedDateStr);
  const reservedDates = reservations.filter(r => r.status !== 'cancelled').map(r => new Date(r.date));
  
  const targetReservation = reservations.find(r => r.id === rescheduleTargetId);

  const slotCounts = useMemo(() => {
    return reservations.reduce((acc, r) => {
      if (r.status === 'cancelled' || !r.timeSlot || !r.date || r.id === rescheduleTargetId) return acc; 
      try {
        const rDateStr = format(new Date(r.date), 'yyyy-MM-dd');
        if (rDateStr === selectedDateStr) {
          const startHour = parseInt(r.timeSlot.split(':')[0]);
          const duration = r.durationHours || 1; 
          for (let i = 0; i < duration; i++) {
            const hourStr = `${String(startHour + i).padStart(2, '0')}:00`;
            acc[hourStr] = (acc[hourStr] || 0) + 1;
          }
        }
      } catch (e) {}
      return acc;
    }, {} as Record<string, number>);
  }, [reservations, selectedDateStr, rescheduleTargetId]);


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
          {/* Mobile Header / Close Button */}
          <button onClick={onClose} className="md:hidden absolute top-4 right-4 p-2 bg-neutral-900 rounded-full text-neutral-400"><X size={16}/></button>

          {/* ════ SIDEBAR NAVIGATION ════ */}
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
                  onClick={() => { setActiveSection(tab.id as Section); setRescheduleTargetId(null); }}
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

            <div className="mt-auto pt-6 border-t border-neutral-800">
              <button onClick={onLogout} className="flex items-center gap-3 text-sm text-neutral-500 hover:text-rose-400 transition-colors w-full px-4 py-2">
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>

          {/* ════ MAIN CONTENT AREA ════ */}
          <div className="flex-1 bg-neutral-950 overflow-y-auto p-4 md:p-8 relative">
            <button onClick={onClose} className="hidden md:flex absolute top-6 right-6 p-2 text-neutral-500 hover:text-white bg-neutral-900 rounded-full transition-colors"><X size={16}/></button>

            {saved && (
              <div className="mb-6 flex items-center gap-2 bg-emerald-950/40 border border-emerald-700/40 text-emerald-400 text-sm px-4 py-3 rounded-xl animate-in fade-in slide-in-from-top-2">
                <CheckCircle size={16} /> {saved}
              </div>
            )}

            {/* ════ BOOKINGS TAB ════ */}
            {activeSection === 'bookings' && !rescheduleTargetId && (
              <div className="space-y-6">
                
                {/* Table Bookings */}
                <div>
                  <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-2">
                    <CalendarDays size={16} className="text-emerald-500" /> Table Reservations
                  </h4>
                  
                  {myTableBookings.length === 0 ? (
                    <div className="bg-neutral-900/50 border border-neutral-800 border-dashed rounded-xl p-8 text-center">
                      <p className="text-neutral-500 text-sm">No table reservations found.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myTableBookings.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(b => {
                        const isPastDate = new Date(b.date).getTime() < new Date().setHours(0,0,0,0);
                        const isActiveStatus = b.status === 'pending' || b.status === 'confirmed';
                        
                        return (
                          <div key={b.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 md:p-5">
                            <div className="flex flex-wrap justify-between items-start gap-4 mb-4 border-b border-neutral-800/60 pb-4">
                              <div>
                                <p className="text-base font-bold text-neutral-200">{format(new Date(b.date), 'EEEE, MMMM d, yyyy')}</p>
                                <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-400 font-medium">
                                  <span className="flex items-center gap-1 text-emerald-400"><Clock size={12}/> {formatTime(b.timeSlot || '00:00')}</span>
                                  <span className="flex items-center gap-1"><Clock size={12}/> {b.durationHours} hrs</span>
                                  <span className="flex items-center gap-1"><User size={12}/> {b.partySize} pax</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                  b.status === 'confirmed' || b.status === 'checked-in' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                  b.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                  'bg-neutral-800 text-neutral-400 border-neutral-700'
                                }`}>
                                  {b.status}
                                </span>
                                {b.tableId && <p className="text-[10px] text-neutral-500 mt-1.5 font-semibold uppercase">Table Assigned</p>}
                              </div>
                            </div>
                            
                            {/* Staff Proposed Reschedule Notice */}
                            {b.rescheduleRequested && b.proposedDate && (
                              <div className="mb-4 bg-amber-950/30 border border-amber-800/50 rounded-xl p-4 animate-pulse-slow">
                                <p className="text-xs text-amber-400 font-bold flex items-center gap-1.5 mb-1.5"><AlertTriangle size={14}/> Action Required: Reschedule Proposed</p>
                                <p className="text-xs text-neutral-300 mb-3 leading-relaxed">Management has proposed moving your reservation to <strong className="text-amber-300 font-black">{format(new Date(b.proposedDate), 'MMM d')} at {b.proposedTimeSlot}</strong>.</p>
                                <div className="flex gap-2">
                                  <button onClick={() => confirmReschedule(b.id, true)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-1.5 shadow-lg shadow-emerald-900/20">
                                    <Check size={14}/> Accept New Time
                                  </button>
                                  <button onClick={() => confirmReschedule(b.id, false)} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 hover:border-neutral-600 text-xs font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-1.5">
                                    <X size={14}/> Decline
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Self-Service Reschedule Button */}
                            {!isPastDate && isActiveStatus && !b.rescheduleRequested && (
                              <button 
                                onClick={() => {
                                  setRescheduleTargetId(b.id);
                                  setRescheduleDate(null);
                                  setRescheduleTimeSlot('');
                                }} 
                                className="w-full py-2.5 text-xs bg-neutral-950 border border-neutral-800 hover:border-amber-600/50 hover:bg-amber-950/20 text-neutral-400 hover:text-amber-400 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 group"
                              >
                                <CalendarDays size={14} className="group-hover:scale-110 transition-transform"/> Request Reschedule
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Tattoo Bookings */}
                <div className="pt-4 border-t border-neutral-800/50">
                  <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-800 pb-2">
                    <Palette size={16} className="text-pink-500" /> Tattoo Bookings
                  </h4>
                  
                  {myBookings.length === 0 ? (
                    <div className="bg-neutral-900/50 border border-neutral-800 border-dashed rounded-xl p-8 text-center">
                      <p className="text-neutral-500 text-sm">No tattoo bookings found.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myBookings.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(b => {
                        const isPastDate = new Date(b.date).getTime() < new Date().setHours(0,0,0,0);
                        const isActiveStatus = b.status === 'pending' || b.status === 'confirmed';

                        return (
                          <div key={b.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 md:p-5">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-base font-bold text-neutral-200">{format(new Date(b.date), 'MMMM d, yyyy')} at {b.timeSlot}</p>
                                <p className="text-xs text-neutral-400 font-medium mt-0.5">{b.placement} ({b.colorStyle})</p>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${
                                b.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                b.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                                'bg-neutral-800 text-neutral-500 border-neutral-700'
                              }`}>
                                {b.status}
                              </span>
                            </div>
                            
                            {/* Staff Proposed Reschedule Notice */}
                            {b.rescheduleRequested && b.proposedDate && (
                              <div className="mt-3 bg-amber-950/30 border border-amber-800/50 rounded-xl p-4 animate-pulse-slow">
                                <p className="text-xs text-amber-400 font-bold flex items-center gap-1.5 mb-1.5"><AlertTriangle size={14}/> Action Required: Reschedule Proposed</p>
                                <p className="text-xs text-neutral-300 mb-3 leading-relaxed">The artist proposed moving your session to <strong className="text-amber-300 font-black">{format(new Date(b.proposedDate), 'MMM d')} at {b.proposedTimeSlot}</strong>.</p>
                                <div className="flex gap-2">
                                  <button onClick={() => confirmReschedule(b.id, true)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-1.5 shadow-lg shadow-emerald-900/20">
                                    <Check size={14}/> Accept 
                                  </button>
                                  <button onClick={() => confirmReschedule(b.id, false)} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 hover:border-neutral-600 text-xs font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-1.5">
                                    <X size={14}/> Decline
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Self-Service Reschedule Button */}
                            {!isPastDate && isActiveStatus && !b.rescheduleRequested && (
                              <button 
                                onClick={() => {
                                  setRescheduleTargetId(b.id);
                                  setRescheduleDate(null);
                                  setRescheduleTimeSlot('');
                                }} 
                                className="w-full mt-3 py-2.5 text-xs bg-neutral-950 border border-neutral-800 hover:border-amber-600/50 hover:bg-amber-950/20 text-neutral-400 hover:text-amber-400 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 group"
                              >
                                <CalendarDays size={14} className="group-hover:scale-110 transition-transform"/> Request Reschedule
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ════ RESCHEDULE FORM UI ════ */}
            {activeSection === 'bookings' && rescheduleTargetId && targetReservation && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
                  <button onClick={() => setRescheduleTargetId(null)} className="p-2 bg-neutral-900 rounded-lg text-neutral-400 hover:text-white transition-colors">
                    <ChevronLeft size={16}/>
                  </button>
                  <div>
                    <h3 className="text-lg font-bold text-white">Request Reschedule</h3>
                    <p className="text-xs text-neutral-500">Pick a new date and time for your booking.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="space-y-4">
                    <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">1. Choose New Date</p>
                    <MiniCalendar selectedDate={rescheduleDate} onSelect={setRescheduleDate} reservedDates={reservedDates} closedDates={closedDates} />
                    {rescheduleDate && !selectedClosedDate && (
                       <div className="bg-amber-600/10 border border-amber-600/25 rounded-xl p-3 flex items-center gap-2">
                         <Calendar size={14} className="text-amber-400 flex-shrink-0" />
                         <span className="text-xs text-amber-300">Selected: <strong>{format(rescheduleDate, 'EEEE, MMM d, yyyy')}</strong></span>
                       </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">2. Choose New Time</p>
                    {!rescheduleDate ? (
                      <div className="bg-neutral-900 border border-dashed border-neutral-700 rounded-2xl p-8 text-center flex flex-col items-center gap-3 h-[300px] justify-center">
                        <Calendar size={24} className="text-neutral-600" />
                        <p className="text-neutral-500 text-sm">Select a date first.</p>
                      </div>
                    ) : selectedClosedDate ? (
                       <div className="bg-rose-950/20 border border-rose-800/30 rounded-2xl p-8 text-center flex flex-col items-center gap-3 h-[300px] justify-center">
                        <AlertTriangle size={24} className="text-rose-500" />
                        <p className="text-rose-400 font-bold">Store Closed</p>
                        <p className="text-xs text-rose-500/80">{selectedClosedDate.reason}</p>
                      </div>
                    ) : (
                      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 h-[300px] flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
                            <Clock size={14} className="text-amber-500" /> Available Slots
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                          {TIME_SLOTS.map(t => {
                            const isHappyHour = t >= (rates?.happyHourStart || '18:00') && t < (rates?.happyHourEnd || '19:00');
                            const bufferHours = 1; 
                            const isPastTime = isToday(rescheduleDate) && parseInt(t.split(':')[0]) <= new Date().getHours() + bufferHours;
                            if (isHappyHour || isPastTime) return null; 
                            
                            const count = slotCounts[t] || 0;
                            const isFull = count >= 5;
                            const disabled = isFull;

                            return (
                              <button 
                                key={t} 
                                disabled={disabled} 
                                onClick={() => setRescheduleTimeSlot(t)} 
                                className={`relative py-2 rounded-lg text-xs font-semibold transition-all overflow-hidden ${
                                  isFull
                                    ? 'bg-rose-950/30 text-rose-500/50 border border-rose-900/30 cursor-not-allowed'
                                    : rescheduleTimeSlot === t 
                                    ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40' 
                                    : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                                }`}
                              >
                                {formatTime(t)}
                                {isFull && <span className="absolute inset-0 flex items-center justify-center bg-rose-950/80 text-rose-500 text-[9px] uppercase tracking-widest backdrop-blur-[1px]">Full</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={handleSubmitReschedule}
                      disabled={!rescheduleDate || !rescheduleTimeSlot || !!selectedClosedDate}
                      className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-900/20 flex justify-center gap-2 items-center"
                    >
                      <Save size={16}/> Submit Request
                    </button>
                  </div>
                </div>
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
        <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} className="input-field pr-10" placeholder="••••••••" />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}