import { useState, useMemo } from 'react';
import { useAppContext, TattooReservation, TattooReservationStatus } from '../context/AppContext';
import {
  Calendar, CalendarX2, ChevronLeft, ChevronRight, Phone, Mail,
  Clock, CheckCircle, XCircle, AlertTriangle, CalendarDays,
  RefreshCw, Check, X, User, CreditCard, ImageIcon, FileText,
  Shield, ChevronDown, Power, DollarSign, Users, MessageSquare
} from 'lucide-react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth,
  isSameDay, isToday, isPast, isFuture,
} from 'date-fns';
import { toast } from 'sonner';

const STATUS_CFG: Record<TattooReservationStatus, { label: string; color: string; dot: string }> = {
  pending:       { label: 'Pending',     color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',     dot: 'bg-amber-400' },
  confirmed:     { label: 'Confirmed',   color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',         dot: 'bg-blue-400' },
  completed:     { label: 'Completed',   color: 'bg-neutral-700/50 text-neutral-400 border-neutral-700',   dot: 'bg-neutral-500' },
  cancelled:     { label: 'Cancelled',   color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',         dot: 'bg-rose-400' },
};
const STATUS_ORDER: TattooReservationStatus[] = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];
const TIME_SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Tab = 'calendar' | 'availability';

/* ── Reschedule Modal ─────────────────────────────────────── */
function RescheduleModal({
  reservation,
  onClose,
  onConfirm,
}: {
  reservation: TattooReservation;
  onClose: () => void;
  onConfirm: (date: Date, slot: string, reason: string) => void;
}) {
  const [pickerMonth, setPickerMonth] = useState(new Date());
  const [newDate, setNewDate]         = useState<Date | null>(null);
  const [newSlot, setNewSlot]         = useState('');
  const [reason, setReason]           = useState('');

  const start = startOfWeek(startOfMonth(pickerMonth), { weekStartsOn: 0 });
  const end   = endOfWeek(endOfMonth(pickerMonth),     { weekStartsOn: 0 });
  const days  = eachDayOfInterval({ start, end });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-neutral-950 border border-pink-900/40 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between flex-none">
          <div>
            <h2 className="text-sm font-bold text-neutral-100">Propose Reschedule</h2>
            <p className="text-xs text-neutral-500">{reservation.customerName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg"><X size={14} /></button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Current */}
          <div className="bg-neutral-900 rounded-xl p-3 text-xs">
            <p className="text-neutral-500 mb-1 font-medium">Current Schedule</p>
            <p className="text-neutral-200">{format(new Date(reservation.date), 'MMMM d, yyyy')} · {reservation.timeSlot}</p>
          </div>

          {/* Reason Input */}
          <div>
            <label className="text-xs text-neutral-400 mb-1.5 block font-medium">Reason for Rescheduling</label>
            <textarea 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              placeholder="e.g., Unforeseen schedule conflict, artist unavailable..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-pink-600/50 min-h-[60px]"
            />
          </div>

          {/* Calendar picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => setPickerMonth(m => subMonths(m, 1))} className="p-1 rounded hover:bg-neutral-800 text-neutral-400"><ChevronLeft size={14} /></button>
              <p className="text-xs font-semibold text-neutral-300">{format(pickerMonth, 'MMMM yyyy')}</p>
              <button onClick={() => setPickerMonth(m => addMonths(m, 1))} className="p-1 rounded hover:bg-neutral-800 text-neutral-400"><ChevronRight size={14} /></button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => <div key={d} className="text-center text-[10px] text-neutral-600 font-semibold py-0.5">{d[0]}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {days.map(day => {
                const inMonth = isSameMonth(day, pickerMonth);
                const past    = isPast(day) && !isToday(day);
                const sel     = newDate && isSameDay(day, newDate);
                return (
                  <button key={format(day, 'yyyy-MM-dd')}
                    disabled={!inMonth || past}
                    onClick={() => setNewDate(day)}
                    className={`h-8 rounded-lg text-xs font-semibold transition-all
                      ${!inMonth || past ? 'text-neutral-800 cursor-default' :
                        sel ? 'bg-pink-600 text-white' :
                        isToday(day) ? 'bg-pink-950/40 border border-pink-700/40 text-pink-300 hover:bg-pink-700/30' :
                        'text-neutral-400 hover:bg-neutral-800'}`}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time slot */}
          <div>
            <p className="text-xs text-neutral-400 mb-1.5 font-medium">New Time Slot</p>
            <div className="grid grid-cols-4 gap-1.5">
              {TIME_SLOTS.map(s => (
                <button key={s} onClick={() => setNewSlot(s)}
                  className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${newSlot === s ? 'bg-pink-600/30 border-pink-500/50 text-pink-300' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t border-neutral-800 bg-neutral-950 flex-none">
          <button onClick={onClose} className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-xl transition-colors font-semibold">Cancel</button>
          <button
            onClick={() => newDate && newSlot && onConfirm(newDate, newSlot, reason)}
            disabled={!newDate || !newSlot || !reason}
            className="flex-1 py-2.5 bg-pink-700 hover:bg-pink-600 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5">
            <MessageSquare size={12} /> Notify & Reschedule
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Reservation Detail Panel ─────────────────────────────── */
function ReservationDetail({
  reservation,
  onClose,
  onUpdateStatus,
  onReschedule,
  onConfirmReschedule,
}: {
  reservation: TattooReservation;
  onClose: () => void;
  onUpdateStatus: (id: string, s: TattooReservationStatus) => void;
  onReschedule: (r: TattooReservation) => void;
  onConfirmReschedule: (id: string, confirmed: boolean) => void;
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const cfg = STATUS_CFG[reservation.status];

  const rescheduleStatus = reservation.rescheduleRequested
    ? { label: 'Awaiting Customer', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
    : reservation.customerRescheduleConfirmed === true
    ? { label: 'Customer Confirmed ✓', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
    : reservation.customerRescheduleConfirmed === false
    ? { label: 'Customer Declined ✗', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
    : null;

  return (
    <div className="bg-neutral-950 border border-pink-900/30 rounded-xl overflow-hidden h-full flex flex-col">
      <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between flex-none">
        <div>
          <h3 className="text-sm font-bold text-neutral-100">Reservation Details</h3>
          <p className="text-[10px] text-neutral-600">ID: {reservation.id}</p>
        </div>
        <button onClick={onClose} className="p-1.5 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
          </span>
          {rescheduleStatus && (
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${rescheduleStatus.color}`}>
              {rescheduleStatus.label}
            </span>
          )}
        </div>

        {/* Reschedule proposal info */}
        {reservation.rescheduleRequested && reservation.proposedDate && (
          <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-3 space-y-2">
            <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Reschedule Pending</p>
            <p className="text-xs text-neutral-300">
              Proposed: <span className="text-amber-300 font-semibold">{format(new Date(reservation.proposedDate), 'MMMM d, yyyy')}</span> at <span className="text-amber-300 font-semibold">{reservation.proposedTimeSlot}</span>
            </p>
            <p className="text-[10px] text-neutral-500">Waiting for customer to confirm or decline</p>
            <div className="flex gap-1.5 pt-1">
              <p className="text-[10px] text-neutral-600 self-center">Simulate customer:</p>
              <button onClick={() => onConfirmReschedule(reservation.id, true)}
                className="flex items-center gap-1 px-2 py-1 bg-emerald-700/30 hover:bg-emerald-700/50 border border-emerald-600/30 text-emerald-400 text-[10px] font-semibold rounded-lg transition-colors">
                <Check size={10} /> Confirm
              </button>
              <button onClick={() => onConfirmReschedule(reservation.id, false)}
                className="flex items-center gap-1 px-2 py-1 bg-rose-700/30 hover:bg-rose-700/50 border border-rose-600/30 text-rose-400 text-[10px] font-semibold rounded-lg transition-colors">
                <X size={10} /> Decline
              </button>
            </div>
          </div>
        )}

        {/* Customer info */}
        <div className="bg-neutral-900 rounded-xl p-3">
          <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1"><User size={9} /> Customer</p>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-full bg-pink-600/20 border border-pink-600/30 flex items-center justify-center text-sm font-bold text-pink-400 flex-shrink-0">
              {reservation.customerName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-200">{reservation.customerName}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <a href={`tel:${reservation.contactNumber}`}
              className="flex items-center gap-2 text-xs text-neutral-300 hover:text-pink-400 transition-colors">
              <Phone size={11} className="text-neutral-600" /> {reservation.contactNumber}
            </a>
            {reservation.email && (
              <a href={`mailto:${reservation.email}`}
                className="flex items-center gap-2 text-xs text-neutral-300 hover:text-pink-400 transition-colors">
                <Mail size={11} className="text-neutral-600" /> {reservation.email}
              </a>
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-neutral-900 rounded-xl p-3 space-y-1.5 text-xs">
          <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-semibold">Schedule</p>
          <div className="flex justify-between"><span className="text-neutral-500">Date</span><span className="text-neutral-200">{format(new Date(reservation.date), 'MMMM d, yyyy')}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Time</span><span className="text-neutral-200">{reservation.timeSlot}</span></div>
        </div>

        {/* Tattoo Details */}
        <div className="bg-neutral-900 rounded-xl p-3 space-y-1.5 text-xs">
          <p className="text-[10px] text-neutral-600 uppercase tracking-wider font-semibold">Tattoo Details</p>
          <div className="flex justify-between"><span className="text-neutral-500">Placement</span><span className="text-neutral-200">{reservation.placement}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Size</span><span className="text-neutral-200">{reservation.estimatedSize}</span></div>
          <div className="flex justify-between"><span className="text-neutral-500">Style</span><span className="text-neutral-200">{reservation.colorStyle}</span></div>
        </div>

        {/* Actions */}
        {reservation.status !== 'completed' && reservation.status !== 'cancelled' && (
          <div className="space-y-2 pt-2">
            {!reservation.rescheduleRequested && (
              <button onClick={() => onReschedule(reservation)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-pink-900/30 hover:bg-pink-900/50 border border-pink-800/30 text-pink-400 text-xs font-semibold rounded-xl transition-colors">
                <RefreshCw size={12} /> Propose Reschedule
              </button>
            )}

            <div className="relative">
              <button onClick={() => setShowStatusMenu(v => !v)}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-xl transition-colors">
                Update Status <ChevronDown size={12} />
              </button>
              {showStatusMenu && (
                <div className="absolute bottom-full left-0 mb-1 w-full bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl z-10 overflow-hidden">
                  {STATUS_ORDER.filter(s => s !== reservation.status).map(s => (
                    <button key={s} onClick={() => { 
                        onUpdateStatus(reservation.id, s); 
                        setShowStatusMenu(false);
                        toast.success(`Status updated to ${STATUS_CFG[s].label}`);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-neutral-300 hover:bg-neutral-800 transition-colors text-left">
                      <span className={`w-2 h-2 rounded-full ${STATUS_CFG[s].dot}`} /> {STATUS_CFG[s].label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────── */
export function ArtistPortal() {
  const {
    currentArtistId, tattooArtists, tattooReservations, artistLoggedIn, loading,
    updateTattooReservationStatus, rescheduleTattooReservation, confirmReschedule,
    updateTattooArtistUnavailableDates, updateTattooArtist, artistLogout
  } = useAppContext();

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-neutral-500">
        <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="animate-pulse tracking-widest text-sm uppercase font-bold text-pink-500">Loading Studio...</p>
      </div>
    );
  }

 if (!artistLoggedIn) {
    window.location.href = '/';
    return null;
  }

  // 🚨 FIX: Don't kick them out! Tell them what's wrong so they can fix it.
  if (!currentArtistId) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-4 border border-rose-500/20">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Account Not Linked</h2>
        <p className="text-neutral-400 max-w-md text-sm mb-6">
          You are successfully logged in, but your staff account has not been linked to a public Tattoo Artist profile yet. 
          <br/><br/>
          Please ask a Manager to go to <strong>User Management</strong>, edit your account, and select your name from the <strong>"Link to Artist Profile"</strong> dropdown.
        </p>
        <button 
          onClick={async () => { await artistLogout(); window.location.href = '/'; }} 
          className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-700/30 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          Log Out
        </button>
      </div>
    );
  }

  const artist = tattooArtists.find(a => a.id === currentArtistId);
  const myReservations = tattooReservations.filter(r => r.artistId === currentArtistId);

  if (!artist) return <div className="text-white text-center py-20">Artist profile not found.</div>;

  const [tab, setTab]                   = useState<Tab>('calendar');
  const [calMonth, setCalMonth]         = useState(new Date());
  const [selectedDay, setSelectedDay]   = useState<Date | null>(null);
  const [selectedRes, setSelectedRes]   = useState<TattooReservation | null>(null);
  const [rescheduleRes, setRescheduleRes] = useState<TattooReservation | null>(null);

  const fmtDate = (d: Date) => format(d, 'yyyy-MM-dd');

  const calStart = startOfWeek(startOfMonth(calMonth), { weekStartsOn: 0 });
  const calEnd   = endOfWeek(endOfMonth(calMonth),     { weekStartsOn: 0 });
  const calDays  = eachDayOfInterval({ start: calStart, end: calEnd });

  const resByDay = useMemo(() => {
    const map: Record<string, TattooReservation[]> = {};
    myReservations.forEach(r => {
      const k = fmtDate(new Date(r.date));
      if (!map[k]) map[k] = [];
      map[k].push(r);
    });
    return map;
  }, [myReservations]);

  const dayReservations = selectedDay
    ? (resByDay[fmtDate(selectedDay)] ?? []).sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
    : [];

  const handleReschedule = (date: Date, slot: string, reason: string) => {
    if (!rescheduleRes) return;
    
    rescheduleTattooReservation(rescheduleRes.id, date, slot);
    
    toast.success("Reschedule Proposed", { description: `Notified ${rescheduleRes.customerName}: "${reason}"` });
    
    setRescheduleRes(null);
    setSelectedRes(prev => prev?.id === rescheduleRes.id ? { ...prev, rescheduleRequested: true, proposedDate: date, proposedTimeSlot: slot, customerRescheduleConfirmed: null } : prev);
  };

  const handleConfirmReschedule = (id: string, confirmed: boolean) => {
    confirmReschedule(id, confirmed);
    const updated = myReservations.find(r => r.id === id);
    if (updated && selectedRes?.id === id) {
      setSelectedRes({ ...updated, rescheduleRequested: false, customerRescheduleConfirmed: confirmed });
    }
    toast.info(`Customer ${confirmed ? 'confirmed' : 'declined'} the reschedule`);
  };

  const toggleUnavail = (d: Date) => {
    const k = fmtDate(d);
    const oldDates = artist.unavailableDates || [];
    const newDates = oldDates.includes(k) ? oldDates.filter(x => x !== k) : [...oldDates, k];
    
    updateTattooArtistUnavailableDates(artist.id, newDates);
    toast.success(oldDates.includes(k) ? 'Date unblocked' : 'Date blocked from new bookings');
  };

  const clearAllBlockedDates = () => {
    updateTattooArtistUnavailableDates(artist.id, []);
    toast.success("All blocked dates cleared");
  };

  const handleLogout = async () => {
    await artistLogout();
    toast.success("Logged out successfully");
    window.location.href = '/';
  };

  const todaysRes = myReservations.filter(r => isToday(new Date(r.date)) && r.status !== 'cancelled');
  const totalEarnings = myReservations.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.depositAmount, 0);

  const upcoming  = myReservations.filter(r => isFuture(new Date(r.date)) && r.status !== 'cancelled').length;
  const pending   = myReservations.filter(r => r.status === 'pending').length;
  const confirmed = myReservations.filter(r => r.status === 'confirmed').length;

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-6 relative">
      
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-full flex items-center justify-center text-xl font-black">
              {artist.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Welcome back, {artist.name.split(' ')[0]}!</h1>
              <p className="text-neutral-400 text-sm mt-0.5">{artist.specialty} Specialist</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-3 bg-neutral-950 border border-neutral-800 px-4 py-2.5 rounded-xl">
              <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg"><DollarSign size={16} /></div>
              <div>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">Total Earnings</p>
                <p className="text-sm font-bold text-neutral-200">₱{totalEarnings.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-neutral-950 border border-neutral-800 px-4 py-2.5 rounded-xl">
              <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg"><Users size={16} /></div>
              <div>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">Today's Sessions</p>
                <p className="text-sm font-bold text-neutral-200">{todaysRes.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-neutral-950 border border-neutral-800 px-4 py-2.5 rounded-xl cursor-pointer hover:border-neutral-700 transition-colors"
                 onClick={() => {
                   updateTattooArtist(artist.id, { isAvailableToday: !artist.isAvailableToday });
                   toast.success(artist.isAvailableToday ? "Walk-ins disabled" : "Accepting walk-ins!");
                 }}>
              <div>
                <p className="text-xs font-bold text-neutral-200">Walk-in Status</p>
                <p className={`text-[10px] font-bold ${artist.isAvailableToday ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {artist.isAvailableToday ? 'Accepting Now' : 'Fully Booked'}
                </p>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 ${artist.isAvailableToday ? 'bg-emerald-500' : 'bg-neutral-700'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow transition-transform ${artist.isAvailableToday ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </div>

            <button onClick={handleLogout} className="flex items-center gap-2 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-700/30 text-rose-400 px-4 py-2.5 rounded-xl font-bold text-xs transition-all">
              <Power size={14} /> Log Out
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Upcoming',       value: upcoming,  color: 'text-pink-400' },
          { label: 'Pending Review', value: pending,   color: 'text-amber-400' },
          { label: 'Confirmed',      value: confirmed, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('calendar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${tab === 'calendar' ? 'bg-pink-600/20 border-pink-600/40 text-pink-300' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'}`}>
          <Calendar size={14} /> My Calendar
        </button>
        <button onClick={() => setTab('availability')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${tab === 'availability' ? 'bg-rose-600/20 border-rose-600/40 text-rose-300' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'}`}>
          <CalendarX2 size={14} /> Manage Availability
          {(artist?.unavailableDates?.length ?? 0) > 0 && (
            <span className="bg-rose-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">{artist.unavailableDates!.length}</span>
          )}
        </button>
      </div>

      {tab === 'calendar' && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          <div className={`space-y-4 ${selectedRes ? 'xl:col-span-3' : 'xl:col-span-5'}`}>
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCalMonth(m => subMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400"><ChevronLeft size={16} /></button>
                <p className="text-sm font-bold text-neutral-200">{format(calMonth, 'MMMM yyyy')}</p>
                <button onClick={() => setCalMonth(m => addMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400"><ChevronRight size={16} /></button>
              </div>

              <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => <div key={d} className="text-center text-[10px] text-neutral-600 font-semibold py-1">{d}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calDays.map(day => {
                  const key       = fmtDate(day);
                  const inMonth   = isSameMonth(day, calMonth);
                  const dayRes    = resByDay[key] ?? [];
                  const blocked   = artist?.unavailableDates?.includes(key);
                  const todayMark = isToday(day);
                  const sel       = selectedDay && isSameDay(day, selectedDay);
                  const hasPending = dayRes.some(r => r.status === 'pending');
                  const hasReschedule = dayRes.some(r => r.rescheduleRequested);

                  return (
                    <button
                      key={key}
                      onClick={() => { if (inMonth) { setSelectedDay(day); setSelectedRes(null); } }}
                      disabled={!inMonth}
                      className={`min-h-[52px] rounded-xl p-1.5 flex flex-col transition-all border text-left
                        ${!inMonth ? 'opacity-0 cursor-default' :
                          sel ? 'bg-pink-600/20 border-pink-600/40' :
                          blocked ? 'bg-rose-950/30 border-rose-900/30' :
                          todayMark ? 'bg-pink-950/20 border-pink-800/30 hover:bg-pink-950/40' :
                          dayRes.length > 0 ? 'bg-neutral-800/60 border-neutral-700/60 hover:bg-neutral-800' :
                          'border-transparent hover:bg-neutral-800/40'
                        }`}
                    >
                      <span className={`text-xs font-bold mb-0.5 ${
                        !inMonth ? 'text-neutral-800' : sel ? 'text-pink-300' : todayMark ? 'text-pink-400' : blocked ? 'text-rose-700' : 'text-neutral-400'
                      }`}>{format(day, 'd')}</span>

                      {blocked && <span className="text-[9px] text-rose-700 leading-none">blocked</span>}

                      {dayRes.length > 0 && !blocked && (
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          {dayRes.slice(0, 2).map(r => (
                            <span key={r.id} className={`text-[8px] font-semibold px-1 py-0.5 rounded truncate leading-none ${STATUS_CFG[r.status].color}`}>
                              {r.timeSlot} {r.customerName.split(' ')[0]}
                            </span>
                          ))}
                        </div>
                      )}

                      {(hasPending || hasReschedule) && (
                        <div className="flex gap-0.5 mt-auto">
                          {hasPending && <span className="w-1 h-1 rounded-full bg-amber-400" />}
                          {hasReschedule && <span className="w-1 h-1 rounded-full bg-blue-400" />}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDay && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-2">
                    <CalendarDays size={14} className="text-pink-400" />
                    {format(selectedDay, 'MMMM d, yyyy')}
                  </h3>
                  <span className="text-xs text-neutral-500">{dayReservations.length} reservation(s)</span>
                </div>
                {dayReservations.length === 0 ? (
                  <div className="py-6 text-center">
                    <Calendar size={24} className="mx-auto text-neutral-700 mb-2" />
                    <p className="text-sm text-neutral-600">No reservations this day</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayReservations.map(r => {
                      const rc = STATUS_CFG[r.status];
                      return (
                        <button key={r.id} onClick={() => setSelectedRes(selectedRes?.id === r.id ? null : r)}
                          className={`w-full text-left bg-neutral-950/60 border rounded-xl p-3 hover:border-pink-700/40 transition-all ${selectedRes?.id === r.id ? 'border-pink-600/50' : 'border-neutral-800'}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-pink-600/20 border border-pink-600/30 flex items-center justify-center text-xs font-bold text-pink-400 flex-shrink-0">
                                {r.customerName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-neutral-200 truncate">{r.customerName}</p>
                                <p className="text-[10px] text-neutral-500">{r.timeSlot} · {r.placement}</p>
                              </div>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${rc.color}`}>
                              {rc.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedRes && (
            <div className="xl:col-span-2">
              <div className="sticky top-0">
                <ReservationDetail
                  reservation={tattooReservations.find(r => r.id === selectedRes.id) ?? selectedRes}
                  onClose={() => setSelectedRes(null)}
                  onUpdateStatus={updateTattooReservationStatus}
                  onReschedule={setRescheduleRes}
                  onConfirmReschedule={handleConfirmReschedule}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'availability' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-200">Block Unavailable Dates</h3>
                <p className="text-xs text-neutral-500">Click dates to instantly mark as unavailable</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setCalMonth(m => subMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400"><ChevronLeft size={14} /></button>
              <p className="text-xs font-semibold text-neutral-300">{format(calMonth, 'MMMM yyyy')}</p>
              <button onClick={() => setCalMonth(m => addMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400"><ChevronRight size={14} /></button>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => <div key={d} className="text-center text-[10px] text-neutral-600 font-semibold py-0.5">{d[0]}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {calDays.map(day => {
                const key      = fmtDate(day);
                const inMonth  = isSameMonth(day, calMonth);
                const blocked  = artist?.unavailableDates?.includes(key);
                const hasRes   = (resByDay[key] ?? []).length > 0;
                return (
                  <button key={key}
                    onClick={() => inMonth && toggleUnavail(day)}
                    disabled={!inMonth}
                    className={`h-9 rounded-xl text-xs font-semibold transition-all border relative
                      ${!inMonth ? 'text-neutral-800 cursor-default border-transparent' :
                        blocked ? 'bg-rose-700/60 border-rose-600 text-white' :
                        'text-neutral-400 hover:bg-rose-700/20 hover:text-rose-300 border-transparent'
                      }`}
                  >
                    {format(day, 'd')}
                    {hasRes && !blocked && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-pink-400" />}
                  </button>
                );
              })}
            </div>
            
            {(artist?.unavailableDates?.length ?? 0) > 0 && (
              <button onClick={clearAllBlockedDates} className="mt-4 w-full text-xs text-neutral-600 hover:text-rose-400 transition-colors py-1">
                Clear all blocked dates
              </button>
            )}
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-neutral-200 mb-3 flex items-center gap-2">
              <CalendarX2 size={14} className="text-rose-400" /> Blocked Dates
            </h3>
            {(!artist?.unavailableDates || artist.unavailableDates.length === 0) ? (
              <div className="py-8 text-center">
                <CalendarX2 size={28} className="mx-auto text-neutral-700 mb-2" />
                <p className="text-sm text-neutral-600">No blocked dates</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                {[...artist.unavailableDates].sort().map(d => {
                  const dayDate = new Date(d + 'T00:00:00');
                  const affectedRes = resByDay[d] ?? [];
                  return (
                    <div key={d} className="flex flex-col bg-neutral-950/60 border border-neutral-800 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-neutral-300">{format(dayDate, 'MMMM d, yyyy')} <span className="text-[10px] text-neutral-600 ml-1">({format(dayDate, 'EEEE')})</span></p>
                        </div>
                        <button onClick={() => toggleUnavail(dayDate)} className="text-rose-500 hover:text-rose-400 text-xs font-bold px-2 py-1 bg-rose-500/10 rounded-lg">
                          Unblock
                        </button>
                      </div>

                      {affectedRes.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-neutral-800/50">
                          <p className="text-[10px] font-bold text-amber-500 mb-1">⚠ {affectedRes.length} AFFECTED BOOKINGS</p>
                          <div className="space-y-1">
                            {affectedRes.map(r => (
                              <div key={r.id} className="flex items-center justify-between bg-amber-950/20 border border-amber-900/30 p-2 rounded-lg">
                                <span className="text-[11px] text-neutral-300">{r.timeSlot} - {r.customerName}</span>
                                <button 
                                  onClick={() => setRescheduleRes(r)} 
                                  className="text-[10px] font-bold bg-amber-600 hover:bg-amber-500 text-white px-2 py-1 rounded"
                                >
                                  Reschedule
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {rescheduleRes && (
        <RescheduleModal
          reservation={rescheduleRes}
          onClose={() => setRescheduleRes(null)}
          onConfirm={handleReschedule}
        />
      )}
    </div>
  );
}