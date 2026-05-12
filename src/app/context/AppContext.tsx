import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'sonner';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type TableStatus = 'available' | 'occupied' | 'reserved';

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  timestamp: Date;
};

export type Session = {
  customerName: string;
  startTime: Date;
  durationMinutes: number;
  isPaid: boolean;
  hourlyRate: number;
  amountPaid: number;
  orders?: OrderItem[];
};

export type Table = {
  id: string;
  name: string;
  status: TableStatus;
  session?: Session;
  isActive: boolean;
};

export type QueueItem = {
  id: string;
  customerName: string;
  contactNumber: string;
  partySize: number;
  arrivalTime: Date;
  notes?: string;
  status: 'waiting' | 'called' | 'seated';
};

export type ReservationStatus = 'pending' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled';

export type Reservation = {
  id: string;
  customerName: string;
  contactNumber: string;
  email?: string;
  date: Date;
  timeSlot: string;
  durationHours: number;
  partySize: number;
  tableId?: string;
  status: ReservationStatus;
  totalAmount: number;
  downPaymentAmount: number;
  downPaymentPaid: boolean;
  balancePaid: boolean;
  createdAt: Date;
  cancellationReason?: string;
  promoCode?: string;
  discountAmount?: number;
  paymentReference?: string;
  receiptUrl?: string;
  rescheduleRequested?: boolean;
  proposedDate?: Date;
  proposedTimeSlot?: string;
  customerRescheduleConfirmed?: boolean | null;
};

export type Feedback = {
  id: string;
  customerName: string;
  contactInfo?: string;
  rating: number;
  feedbackType?: 'suggestion' | 'complaint' | 'lost_item' | 'compliment' | 'other';
  comment: string;
  date: Date;
  reservationId?: string;
  tags: string[];
};

export type ActivityType =
  | 'table_assigned' | 'table_freed' | 'table_reserved' | 'session_extended'
  | 'queue_added' | 'queue_removed' | 'queue_called'
  | 'reservation_created' | 'reservation_updated' | 'payment_received' | 'reservation_cancelled'
  | 'feedback_received' | 'promo_created' | 'tattoo_reservation_created'
  | 'admin_action';

export type Activity = {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
};

export type PromoCode = {
  id: string;
  code: string;
  discountPercent: number;
  description: string;
  isActive: boolean;
  maxUsage: number;
  usageCount: number;
  expiresAt?: Date;
  createdAt: Date;
};

export type TattooReservationStatus = 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'denied';

export type TattooArtist = {
  id: string;
  name: string;
  specialty: string;
  contactNumber: string;
  email?: string;
  bio?: string;
  isAvailableToday: boolean;
  isActive: boolean;
  unavailableDates: string[];
};

export type TattooReservation = {
  id: string;
  customerName: string;
  contactNumber: string;
  email?: string;
  date: Date;
  timeSlot: string;
  artistId: string;
  artistName: string;
  artistContact: string;
  placement: string;
  estimatedSize: string;
  designDescription: string;
  colorStyle: string;
  agreementSigned: boolean;
  consentSigned: boolean;
  status: TattooReservationStatus;
  depositAmount: number;
  depositPaid: boolean;
  inspirationImages?: string[];
  createdAt: Date;
  rescheduleRequested?: boolean;
  proposedDate?: Date;
  proposedTimeSlot?: string;
  customerRescheduleConfirmed?: boolean | null;
  paymentReference?: string;
  receiptUrl?: string;
};

export type StaffProfile = {
  username: string;
  fullName: string;
  email: string;
  role: string;
  phone: string;
  joinedDate: string;
  artistId?: string;
  isAdmin?: boolean;
};

export type StaffUser = {
  id: string;
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: 'admin' | 'manager' | 'tattoo-artist';
  artistId?: string;
  phone: string;
  isActive: boolean;
  createdAt: Date;
};

export type RatesConfig = {
  hourlyRate: number;
  happyHourRate: number;
  happyHourStart: string;
  happyHourEnd: string;
  overtimeRate: number;
  tattooDeposit: number;
  downPaymentPercent: number;
};

export type ReservationTerms = {
  minHours: number;
  maxHours: number;
  minPartySize: number;
  maxPartySize: number;
  cancellationHours: number;
  cancellationPolicy: string;
  termsAndConditions: string;
};

export type AnnouncementType = 'info' | 'warning' | 'promo' | 'event';
export type Announcement = {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
};

export type ClosedDate = {
  id: string;
  date: string;
  reason: string;
  isFullDay: boolean;
  openTime?: string;
  closeTime?: string;
};

export type SiteSettings = {
  logoUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  aboutStory: string;
  contactAddress: string;
  contactPhone: string;
  contactEmail: string;
  contactHours: string;
  heroImage1?: string;
  heroImage2?: string;
  heroImage3?: string;
  heroSliderImages?: string[];
  promoImage?: string;
  aboutImage?: string;
};

// ─── CONSTANTS & UTILS ────────────────────────────────────────────────────────

export const TATTOO_DEPOSIT = 500;
export const HOURLY_RATE = 250;
export const DOWN_PAYMENT_RATE = 0.25;

const DEFAULT_STAFF_PROFILE: StaffProfile = {
  username: 'admin', fullName: 'Admin User', 
  email: 'admin@oneshot.com', role: 'Manager', phone: '09171234567', joinedDate: '2024-01-15',
};

export function generateRandomPromoCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function generateReferralCode(name: string): string {
  const prefix = name.replace(/\s+/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

const isToday = (date: Date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

type AppContextType = {
  tables: Table[];
  queue: QueueItem[];
  reservations: Reservation[];
  feedback: Feedback[];
  activities: Activity[];
  promoCodes: PromoCode[];
  tattooReservations: TattooReservation[];
  tattooArtists: TattooArtist[];
  staffUsers: StaffUser[];
  rates: RatesConfig;
  reservationTerms: ReservationTerms;
  announcements: Announcement[];
  closedDates: ClosedDate[];
  siteSettings: SiteSettings | null;
  loading: boolean;
  staffLoggedIn: boolean;
  adminLoggedIn: boolean;
  artistLoggedIn: boolean;
  currentArtistId: string | null;
  staffProfile: StaffProfile;
  staffLogin: (username: string, password: string) => Promise<boolean>;
  staffLogout: () => Promise<void>;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  adminLogout: () => Promise<void>;
  artistLogin: (username: string, password: string) => Promise<boolean>;
  artistLogout: () => Promise<void>;
  updateStaffProfile: (profile: Partial<StaffProfile>) => void;
  assignTable: (tableId: string, session: Session) => Promise<void>;
  freeTable: (tableId: string) => Promise<void>;
  reserveTable: (tableId: string) => Promise<void>;
  extendSession: (tableId: string, extraMinutes: number, extraPayment: number) => Promise<void>;
  addTable: (name: string) => Promise<void>;
  updateTable: (id: string, name: string) => Promise<void>;
  toggleTableActive: (id: string) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  addOrderToTable: (tableId: string, order: OrderItem) => Promise<void>;
  removeOrderFromTable: (tableId: string, orderId: string) => Promise<void>;
  addToQueue: (item: Omit<QueueItem, 'id' | 'arrivalTime' | 'status'>) => Promise<void>;
  removeFromQueue: (id: string) => Promise<void>;
  callQueueItem: (id: string) => Promise<void>;
  addReservation: (item: Omit<Reservation, 'id' | 'createdAt'> & { id?: string }) => Promise<string>;
  updateReservationStatus: (id: string, status: ReservationStatus) => Promise<void>;
  cancelReservation: (id: string, reason: string) => Promise<void>;
  updateDownPayment: (id: string, paid: boolean) => Promise<void>;
  updateBalance: (id: string, paid: boolean) => Promise<void>;
  addFeedback: (item: Omit<Feedback, 'id' | 'date'>) => Promise<void>;
  addActivity: (type: ActivityType, description: string, metadata?: Record<string, any>) => Promise<void>;
  addPromoCode: (item: Omit<PromoCode, 'id' | 'createdAt' | 'usageCount'>) => Promise<void>;
  togglePromoCode: (id: string) => Promise<void>;
  deletePromoCode: (id: string) => Promise<void>;
  applyPromoCode: (code: string) => Promise<PromoCode | null>;
  addTattooReservation: (item: Omit<TattooReservation, 'id' | 'createdAt'> & { id?: string }) => Promise<string>;
  updateTattooReservationStatus: (id: string, status: TattooReservationStatus) => Promise<void>;
  updateTattooDepositPaid: (id: string, paid: boolean) => Promise<void>;
  proposeReschedule: (id: string, proposedDate: Date, proposedTimeSlot: string) => Promise<void>;
  confirmReschedule: (id: string, confirmed: boolean) => Promise<void>;
  addTattooArtist: (artist: Omit<TattooArtist, 'id'>) => Promise<void>;
  updateTattooArtist: (id: string, updates: Partial<TattooArtist>) => Promise<void>;
  deleteTattooArtist: (id: string) => Promise<void>;
  updateTattooArtistUnavailableDates: (id: string, dates: string[]) => Promise<void>;
  addStaffUser: (user: Omit<StaffUser, 'id' | 'createdAt'>) => Promise<void>;
  updateStaffUser: (id: string, updates: Partial<StaffUser>) => Promise<void>;
  resetStaffUserPassword: (id: string) => Promise<void>;
  toggleStaffUserActive: (id: string) => Promise<void>;
  updateRates: (rates: Partial<RatesConfig>) => Promise<void>;
  updateReservationTerms: (terms: Partial<ReservationTerms>) => Promise<void>;
  addAnnouncement: (item: Omit<Announcement, 'id' | 'createdAt'>) => Promise<void>;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  toggleAnnouncement: (id: string) => Promise<void>;
  addClosedDate: (item: Omit<ClosedDate, 'id'>) => Promise<void>;
  removeClosedDate: (id: string) => Promise<void>;
  updateClosedDate: (id: string, updates: Partial<ClosedDate>) => Promise<void>;
  updateSiteSettings: (settings: Partial<SiteSettings>) => Promise<void>;
  refreshData: (silent?: boolean) => Promise<void>;
  sendCustomerPush: (customerName: string, title: string, message: string) => Promise<void>;
  sendAdminPush: (title: string, message: string) => Promise<void>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [tables, setTables] = useState<Table[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [tattooReservations, setTattooReservations] = useState<TattooReservation[]>([]);
  const [tattooArtists, setTattooArtists] = useState<TattooArtist[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [rates, setRates] = useState<RatesConfig>({
    hourlyRate: 250, happyHourRate: 200, happyHourStart: '18:00', happyHourEnd: '19:00', overtimeRate: 250, tattooDeposit: 500, downPaymentPercent: 25,
  });
  const [reservationTerms, setReservationTermsState] = useState<ReservationTerms>({
    minHours: 1, maxHours: 8, minPartySize: 1, maxPartySize: 10, cancellationHours: 24, cancellationPolicy: '...', termsAndConditions: '...',
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [closedDates, setClosedDates] = useState<ClosedDate[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [staffLoggedIn, setStaffLoggedIn] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [artistLoggedIn, setArtistLoggedIn] = useState(false);
  const [currentArtistId, setCurrentArtistId] = useState<string | null>(null);
  const [staffProfile, setStaffProfile] = useState<StaffProfile>(DEFAULT_STAFF_PROFILE);

  // ─── 1. CORE HELPERS (Defined first to prevent ReferenceErrors) ───

  const addActivity = async (type: ActivityType, description: string, metadata?: Record<string, any>) => {
    try {
      const id = `act_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const activity = { id, type, description, metadata };
      await supabase.from('activities').insert([activity]);
      setActivities(prev => [{ ...activity, timestamp: new Date() }, ...prev]);
    } catch (err) { console.error('Failed to log activity:', err); }
  };

  const removeFromQueue = async (id: string) => {
    await supabase.from('queue_items').delete().eq('id', id);
    setQueue(prev => prev.filter(q => q.id !== id));
  };

  const cancelReservation = async (id: string, reason: string) => {
    if (reservations.some(r => r.id === id)) {
      const { error } = await supabase.from('reservations').update({ status: 'cancelled', cancellation_reason: reason }).eq('id', id);
      if (error) throw new Error(error.message);
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' as ReservationStatus, cancellationReason: reason } : r));
      await addActivity('reservation_cancelled', 'Table reservation cancelled');
    } else if (tattooReservations.some(r => r.id === id)) {
      const { error } = await supabase.from('tattoo_reservations').update({ status: 'cancelled' }).eq('id', id);
      if (error) throw new Error(error.message);
      setTattooReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' as TattooReservationStatus } : r));
      await addActivity('reservation_cancelled', 'Tattoo reservation cancelled');
    }
  };

  // ─── 2. AUTO-EXPIRATION ENGINE ───

  useEffect(() => {
    const expirationCheck = setInterval(async () => {
      const now = new Date();
      const GRACE_PERIOD_MS = 15 * 60 * 1000;

      const expiredQueue = queue.filter(q => q.status === 'called' && (now.getTime() - new Date(q.arrivalTime).getTime()) > GRACE_PERIOD_MS);
      for (const item of expiredQueue) {
        await removeFromQueue(item.id);
        await addActivity('queue_removed', `Auto-cancelled ${item.customerName} (No-show 15m)`);
      }

      const expiredRes = reservations.filter(r => {
        if (r.status !== 'confirmed' && r.status !== 'pending') return false;
        if (!isToday(new Date(r.date)) || !r.timeSlot) return false;
        const [h, m] = r.timeSlot.split(':').map(Number);
        const startTime = new Date(r.date);
        startTime.setHours(h, m, 0, 0);
        return (now.getTime() - startTime.getTime()) > GRACE_PERIOD_MS;
      });

      for (const res of expiredRes) {
        await cancelReservation(res.id, "Auto-cancelled: No-show for 15 minutes");
        await addActivity('reservation_cancelled', `Auto-cancelled reservation for ${res.customerName} (15m Late)`);
      }
    }, 30000);
    return () => clearInterval(expirationCheck);
  }, [queue, reservations]);

  // ─── 3. REFRESH & DATABASE LOGIC ───

  const mapTableToDB = (table: Table) => ({
    id: table.id, 
    name: table.name, 
    status: table.status, 
    is_active: table.isActive,
    session_customer_name: table.session?.customerName || null,
    session_start_time: table.session?.startTime?.toISOString() || null,
    session_duration_minutes: table.session?.durationMinutes || null,
    session_is_paid: table.session?.isPaid || null,
    session_hourly_rate: table.session?.hourlyRate || null,
    session_amount_paid: table.session?.amountPaid || null,
  });

  const mapTableFromDB = (row: any): Table => ({
    id: row.id,
    name: row.name,
    status: row.status,
    isActive: row.is_active,
    session: row.session_customer_name ? {
      customerName: row.session_customer_name,
      startTime: new Date(row.session_start_time),
      durationMinutes: row.session_duration_minutes || 60,
      isPaid: row.session_is_paid || false,
      hourlyRate: row.session_hourly_rate || 250,
      amountPaid: row.session_amount_paid || 0,
      orders: [],
    } : undefined,
  });

  // 🚨 FIXED: Bulletproof data fetching to prevent cascading failures
  const safeFetch = async (promise: Promise<any>) => {
    try {
      const { data, error } = await promise;
      if (error) {
        console.warn('Supabase fetch error:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('Network error during fetch:', err);
      return null;
    }
  };

  const refreshData = async (silent = false) => {
    if (!silent) setLoading(true);

    if (!navigator.onLine) {
      const cachedTables = localStorage.getItem('oneshot_cache_tables');
      const cachedQueue = localStorage.getItem('oneshot_cache_queue');
      if (cachedTables) setTables(JSON.parse(cachedTables));
      if (cachedQueue) setQueue(JSON.parse(cachedQueue));
      setLoading(false);
      return;
    }

    try {
      // Fetch each table independently so one missing table doesn't crash the whole app!
      const [
        tablesData, queueData, resData, feedbackData, actData, promoData,
        artistsData, tattooResData, staffData, ratesData, termsData, annData, 
        closedData, settingsData
      ] = await Promise.all([
        safeFetch(supabase.from('tables').select('*').order('name')),
        safeFetch(supabase.from('queue_items').select('*').order('arrival_time')),
        safeFetch(supabase.from('reservations').select('*').order('date', { ascending: false }).limit(500)), 
        safeFetch(supabase.from('feedback').select('*').order('created_at', { ascending: false })),
        safeFetch(supabase.from('activities').select('*').order('timestamp', { ascending: false }).limit(200)),
        safeFetch(supabase.from('promo_codes').select('*').order('created_at', { ascending: false })),
        safeFetch(supabase.from('tattoo_artists').select('*').order('name')),
        safeFetch(supabase.from('tattoo_reservations').select('*').order('date', { ascending: false })),
        safeFetch(supabase.from('staff_users').select('*').order('full_name')),
        safeFetch(supabase.from('rates_config').select('*').eq('id', '1').maybeSingle()),
        safeFetch(supabase.from('reservation_terms').select('*').eq('id', '1').maybeSingle()),
        safeFetch(supabase.from('announcements').select('*').order('created_at', { ascending: false })),
        safeFetch(supabase.from('closed_dates').select('*').order('date')),
        safeFetch(supabase.from('site_settings').select('*').eq('id', '1').maybeSingle())
      ]);

      if (tablesData) {
        setTables(tablesData.map(mapTableFromDB));
        localStorage.setItem('oneshot_cache_tables', JSON.stringify(tablesData.map(mapTableFromDB)));
      }
      
      if (queueData) {
        const mappedQueue = queueData.map((row: any) => ({ id: row.id, customerName: row.customer_name, contactNumber: row.contact_number, partySize: row.party_size, arrivalTime: new Date(row.arrival_time), notes: row.notes || undefined, status: row.status }));
        setQueue(mappedQueue);
        localStorage.setItem('oneshot_cache_queue', JSON.stringify(mappedQueue));
      }

      if (resData) setReservations(resData.map((row: any) => ({ id: row.id, customerName: row.customer_name, contactNumber: row.contact_number, email: row.email || undefined, date: new Date(row.date), timeSlot: row.time_slot, durationHours: row.duration_hours, partySize: row.party_size, tableId: row.table_id || undefined, status: row.status, totalAmount: row.total_amount, downPaymentAmount: row.down_payment_amount, downPaymentPaid: row.down_payment_paid, balancePaid: row.balance_paid, createdAt: new Date(row.created_at), cancellationReason: row.cancellation_reason || undefined, promoCode: row.promo_code || undefined, discountAmount: row.discount_amount || undefined, paymentReference: row.payment_reference || undefined, receiptUrl: row.receipt_url || undefined, rescheduleRequested: row.reschedule_requested || undefined, proposedDate: row.proposed_date ? new Date(row.proposed_date) : undefined, proposedTimeSlot: row.proposed_time_slot || undefined, customerRescheduleConfirmed: row.customer_reschedule_confirmed })));
      if (feedbackData) setFeedback(feedbackData.map((row: any) => ({ id: row.id, customerName: row.customer_name, contactInfo: row.contact_info || undefined, rating: row.rating, feedbackType: row.feedback_type || undefined, comment: row.comment, date: new Date(row.created_at), reservationId: row.reservation_id || undefined, tags: row.tags || [] })));
      if (actData) { const mapped = actData.map((row: any) => ({ id: row.id, type: row.type as ActivityType, description: row.description, timestamp: new Date(row.created_at || row.timestamp || Date.now()), metadata: row.metadata || undefined })); mapped.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); setActivities(mapped); }
      if (promoData) setPromoCodes(promoData.map((row: any) => ({ id: row.id, code: row.code, discountPercent: row.discount_percent, description: row.description, isActive: row.is_active, maxUsage: row.max_usage, usageCount: row.usage_count, expiresAt: row.expires_at ? new Date(row.expires_at) : undefined, createdAt: new Date(row.created_at) })));
      if (artistsData) setTattooArtists(artistsData.map((row: any) => ({ id: row.id, name: row.name, specialty: row.specialty, contactNumber: row.contact_number, email: row.email || undefined, bio: row.bio || undefined, isAvailableToday: row.is_available_today, isActive: row.is_active, unavailableDates: row.unavailable_dates || [] })));
      if (tattooResData) setTattooReservations(tattooResData.map((row: any) => ({ id: row.id, customerName: row.customer_name, contactNumber: row.contact_number, email: row.email || undefined, date: new Date(row.date), timeSlot: row.time_slot, artistId: row.artist_id, artistName: row.artist_name, artistContact: row.artist_contact, placement: row.placement, estimatedSize: row.estimated_size, designDescription: row.design_description, colorStyle: row.color_style, agreementSigned: row.agreement_signed, consentSigned: row.consent_signed, status: row.status, depositAmount: row.deposit_amount, depositPaid: row.deposit_paid, inspirationImages: row.inspiration_images || undefined, createdAt: new Date(row.created_at), rescheduleRequested: row.reschedule_requested || undefined, proposedDate: row.proposed_date ? new Date(row.proposed_date) : undefined, proposedTimeSlot: row.proposed_time_slot || undefined, customerRescheduleConfirmed: row.customer_reschedule_confirmed, paymentReference: row.payment_reference || undefined, receiptUrl: row.receipt_url || undefined })));
      if (staffData) setStaffUsers(staffData.map((row: any) => ({ id: row.id, username: row.username, password: row.password, fullName: row.full_name, email: row.email, role: row.role as any, isAdmin: row.is_admin, artistId: row.artist_id || undefined, phone: row.phone, isActive: row.is_active, createdAt: new Date(row.created_at) })));
      if (ratesData) setRates({ hourlyRate: ratesData.hourly_rate, happyHourRate: ratesData.happy_hour_rate, happyHourStart: ratesData.happy_hour_start, happyHourEnd: ratesData.happy_hour_end, overtimeRate: ratesData.overtime_rate, tattooDeposit: ratesData.tattoo_deposit, downPaymentPercent: ratesData.down_payment_percent });
      if (termsData) setReservationTermsState({ minHours: termsData.min_hours, maxHours: termsData.max_hours, minPartySize: termsData.min_party_size, maxPartySize: termsData.max_party_size, cancellationHours: termsData.cancellation_hours, cancellationPolicy: termsData.cancellation_policy, termsAndConditions: termsData.terms_and_conditions });
      if (annData) setAnnouncements(annData.map((row: any) => ({ id: row.id, title: row.title, content: row.content, type: row.type as AnnouncementType, isActive: row.is_active, createdAt: new Date(row.created_at), expiresAt: row.expires_at ? new Date(row.expires_at) : undefined })));
      if (closedData) setClosedDates(closedData.map((row: any) => ({ id: row.id, date: row.date, reason: row.reason, isFullDay: row.is_full_day, openTime: row.open_time || undefined, closeTime: row.close_time || undefined })));
      if (settingsData) setSiteSettings({ logoUrl: settingsData.logo_url || '', heroTitle: settingsData.hero_title || '', heroSubtitle: settingsData.hero_subtitle || '', heroDescription: settingsData.hero_description || '', aboutStory: settingsData.about_story || '', contactAddress: settingsData.contact_address || '', contactPhone: settingsData.contact_phone || '', contactEmail: settingsData.contact_email || '', contactHours: settingsData.contact_hours || '', heroImage1: settingsData.hero_image_1 || '', heroImage2: settingsData.hero_image_2 || '', heroImage3: settingsData.hero_image_3 || '', heroSliderImages: settingsData.hero_slider_images || [], promoImage: settingsData.promo_image || '', aboutImage: settingsData.about_image || '' });

    } catch (err) { 
      console.error('Refresh Error:', err); 
    } finally { 
      setLoading(false); 
    }
  };

  // ─── 4. AUTH & SESSION ───

  useEffect(() => {
    refreshData();
    const savedSession = localStorage.getItem('oneshot_staff_session');
    if (savedSession) {
      try {
        const profile = JSON.parse(savedSession);
        setStaffProfile(profile);
        const r = profile.role?.toLowerCase();
        if (r === 'admin' || profile.isAdmin) { setAdminLoggedIn(true); setStaffLoggedIn(true); }
        else if (r === 'artist' || r === 'tattoo-artist') { setArtistLoggedIn(true); setCurrentArtistId(profile.artistId || null); setStaffLoggedIn(true); }
        else setStaffLoggedIn(true);
      } catch { console.error('Failed to parse saved session'); }
    }
  }, []);

  const saveStaffSession = (profile: StaffProfile) => {
    const secureProfile = { ...profile };
    delete secureProfile.password;
    localStorage.setItem('oneshot_staff_session', JSON.stringify(secureProfile));
    setStaffProfile(profile);
  };

  const clearStaffSession = async () => {
    localStorage.removeItem('oneshot_staff_session');
    setStaffProfile(DEFAULT_STAFF_PROFILE);
    setStaffLoggedIn(false); setAdminLoggedIn(false); setArtistLoggedIn(false); setCurrentArtistId(null);
    try {
      await supabase.auth.signOut();
    } catch(e) {} // 🚨 Muffled to avoid the 403 error on logouts
    window.location.href = '/'; 
  };

  const staffLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/verify_staff_login`;
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': key, 'Authorization': `Bearer ${key}` }, body: JSON.stringify({ p_username: username, p_password: password }) });
      if (!res.ok) {
        console.error("RPC Error! Have you run the verify_staff_login SQL script?");
        return false;
      }
      const users = await res.json();
      if (users && Array.isArray(users) && users.length > 0) {
        const user = users[0];
        setStaffLoggedIn(true); 
        if (user.is_admin || user.role === 'admin') setAdminLoggedIn(true);
        if (user.role === 'tattoo-artist') { setArtistLoggedIn(true); setCurrentArtistId(user.artist_id || null); }
        saveStaffSession({ username: user.username, fullName: user.full_name, email: user.email, role: user.role, phone: user.phone, joinedDate: user.created_at, artistId: user.artist_id, isAdmin: user.is_admin || user.role === 'admin' });
        return true; 
      }
      return false;
    } catch { return false; }
  };

  const staffLogout = async () => clearStaffSession();
  const adminLogin = (u: string, p: string) => staffLogin(u, p);
  const adminLogout = () => clearStaffSession();
  const artistLogin = (u: string, p: string) => staffLogin(u, p);
  const artistLogout = () => clearStaffSession();

  const updateStaffProfile = async (profile: Partial<StaffProfile>) => {
    setStaffProfile(prev => ({ ...prev, ...profile }));
    const user = staffUsers.find(u => u.username === staffProfile.username);
    if (user) {
      await updateStaffUser(user.id, {
        ...(profile.username && { username: profile.username }),
        ...(profile.fullName && { fullName: profile.fullName }), 
        ...(profile.email && { email: profile.email }),
        ...(profile.phone && { phone: profile.phone }),
      });
    }
  };

  // ─── 5. MUTATIONS ───

  const assignTable = async (tableId: string, session: Session) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    const updated = { ...table, status: 'occupied' as TableStatus, session };
    const { error } = await supabase.from('tables').update(mapTableToDB(updated)).eq('id', tableId);
    if (error) throw new Error("Failed to assign table.");
    setTables(prev => prev.map(t => t.id === tableId ? updated : t));
    await addActivity('table_assigned', `${table.name} assigned to ${session.customerName}`);
  };

  const freeTable = async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    const updated = { ...table, status: 'available' as TableStatus, session: undefined };
    const { error } = await supabase.from('tables').update(mapTableToDB(updated)).eq('id', tableId);
    if (error) throw new Error("Failed to free table.");
    setTables(prev => prev.map(t => t.id === tableId ? updated : t));
    await addActivity('table_freed', `Table ${table.name} freed`);
  };

  const reserveTable = async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    const updated = { ...table, status: 'reserved' as TableStatus };
    const { error } = await supabase.from('tables').update(mapTableToDB(updated)).eq('id', tableId);
    if (error) throw new Error("Failed to reserve table.");
    setTables(prev => prev.map(t => t.id === tableId ? updated : t));
  };

  const extendSession = async (tableId: string, extraMinutes: number, extraPayment: number) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.session) return;
    let newDuration = table.session.durationMinutes + extraMinutes;
    if (extraMinutes < 0) newDuration = -Math.abs(table.session.durationMinutes);
    const updated = { ...table, session: { ...table.session, durationMinutes: newDuration, amountPaid: table.session.amountPaid + extraPayment } };
    const { error } = await supabase.from('tables').update(mapTableToDB(updated)).eq('id', tableId);
    if (error) throw new Error("Failed to extend session.");
    setTables(prev => prev.map(t => t.id === tableId ? updated : t));
    await addActivity('session_extended', `Table ${table.name} extended`);
  };

  const addTable = async (name: string) => {
    const id = `t${Date.now()}`;
    const newTable: Table = { id, name, status: 'available', isActive: true };
    await supabase.from('tables').insert([mapTableToDB(newTable)]);
    setTables(prev => [...prev, newTable]);
    await addActivity('admin_action', `Table "${name}" added`);
  };

  const updateTable = async (id: string, name: string) => {
    await supabase.from('tables').update({ name }).eq('id', id);
    setTables(prev => prev.map(t => t.id === id ? { ...t, name } : t));
  };

  const toggleTableActive = async (id: string) => {
    const table = tables.find(t => t.id === id);
    if (!table) return;
    await supabase.from('tables').update({ is_active: !table.isActive }).eq('id', id);
    setTables(prev => prev.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t));
  };

  const deleteTable = async (id: string) => {
    await supabase.from('tables').delete().eq('id', id);
    setTables(prev => prev.filter(t => t.id !== id));
  };

  const addOrderToTable = async (tableId: string, order: OrderItem) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.session) return;
    const updated = { ...table, session: { ...table.session, orders: [...(table.session.orders || []), order] } };
    await supabase.from('tables').update(mapTableToDB(updated)).eq('id', tableId);
    setTables(prev => prev.map(t => t.id === tableId ? updated : t));
  };

  const removeOrderFromTable = async (tableId: string, orderId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.session?.orders) return;
    const updated = { ...table, session: { ...table.session, orders: table.session.orders.filter(o => o.id !== orderId) } };
    await supabase.from('tables').update(mapTableToDB(updated)).eq('id', tableId);
    setTables(prev => prev.map(t => t.id === tableId ? updated : t));
  };

  const addToQueue = async (item: Omit<QueueItem, 'id' | 'arrivalTime' | 'status'>) => {
    const id = `q${Date.now()}`;
    const arrivalTime = new Date();
    await supabase.from('queue_items').insert([{ id, customer_name: item.customerName, contact_number: item.contactNumber, party_size: item.partySize, arrival_time: arrivalTime.toISOString(), notes: item.notes, status: 'waiting' }]);
    setQueue(prev => [...prev, { ...item, id, arrivalTime, status: 'waiting' }]);
    await addActivity('queue_added', `${item.customerName} added to queue`);
  };

  const callQueueItem = async (id: string) => {
    await supabase.from('queue_items').update({ status: 'called' }).eq('id', id);
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'called' as const } : q));
    await addActivity('queue_called', 'Queue item called');
  };

  const addReservation = async (item: Omit<Reservation, 'id' | 'createdAt'> & { id?: string }) => {
    const id = item.id || crypto.randomUUID();
    const { error } = await supabase.from('reservations').insert([{ 
      id, 
      customer_name: item.customerName, 
      contact_number: item.contactNumber, 
      email: item.email || null,
      date: item.date.toISOString(), 
      time_slot: item.timeSlot, 
      duration_hours: item.durationHours, 
      party_size: item.partySize, 
      table_id: item.tableId || null, 
      status: item.status, 
      total_amount: item.totalAmount, 
      down_payment_amount: item.downPaymentAmount, 
      down_payment_paid: item.downPaymentPaid, 
      balance_paid: item.balancePaid,
      cancellation_reason: item.cancellationReason || null,
      promo_code: item.promoCode || null,
      discount_amount: item.discountAmount || null,
      payment_reference: item.paymentReference || null,
      receipt_url: item.receiptUrl || null
    }]);
    if (error) throw new Error(error.message);
    setReservations(prev => [...prev, { ...item, id, createdAt: new Date() }]);
    return id;
  };

  const updateReservationStatus = async (id: string, status: ReservationStatus) => {
    await supabase.from('reservations').update({ status }).eq('id', id);
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const updateDownPayment = async (id: string, paid: boolean) => {
    await supabase.from('reservations').update({ down_payment_paid: paid }).eq('id', id);
    setReservations(prev => prev.map(r => r.id === id ? { ...r, downPaymentPaid: paid } : r));
  };

  const updateBalance = async (id: string, paid: boolean) => {
    await supabase.from('reservations').update({ balance_paid: paid }).eq('id', id);
    setReservations(prev => prev.map(r => r.id === id ? { ...r, balancePaid: paid } : r));
  };

  const addFeedback = async (item: Omit<Feedback, 'id' | 'date'>) => {
    const id = `f${Date.now()}`;
    const dbFeedback = {
      id, 
      customer_name: item.customerName, 
      contact_info: item.contactInfo || null,
      rating: item.rating, 
      feedback_type: item.feedbackType || null, 
      comment: item.comment, 
      reservation_id: item.reservationId || null,
      tags: item.tags || []
    };

    const { error } = await supabase.from('feedback').insert([dbFeedback]);
    if (error) throw error;
    
    setFeedback(prev => [{ ...item, id, date: new Date() }, ...prev]);
  };

  const addPromoCode = async (item: Omit<PromoCode, 'id' | 'createdAt' | 'usageCount'>) => {
    const id = `pc${Date.now()}`;
    await supabase.from('promo_codes').insert([{ id, code: item.code, discount_percent: item.discountPercent, description: item.description, is_active: item.isActive, max_usage: item.maxUsage, usage_count: 0 }]);
    setPromoCodes(prev => [{ ...item, id, usageCount: 0, createdAt: new Date() }, ...prev]);
  };

  const togglePromoCode = async (id: string) => {
    const promo = promoCodes.find(p => p.id === id);
    if (!promo) return;
    await supabase.from('promo_codes').update({ is_active: !promo.isActive }).eq('id', id);
    setPromoCodes(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  const deletePromoCode = async (id: string) => {
    await supabase.from('promo_codes').delete().eq('id', id);
    setPromoCodes(prev => prev.filter(p => p.id !== id));
  };

  const applyPromoCode = async (code: string): Promise<PromoCode | null> => {
    const promo = promoCodes.find(p => p.code === code.toUpperCase() && p.isActive && p.usageCount < p.maxUsage);
    if (!promo) return null;
    await supabase.from('promo_codes').update({ usage_count: promo.usageCount + 1 }).eq('id', promo.id);
    setPromoCodes(prev => prev.map(p => p.id === promo.id ? { ...p, usageCount: p.usageCount + 1 } : p));
    return promo;
  };

  const addTattooReservation = async (item: Omit<TattooReservation, 'id' | 'createdAt'> & { id?: string }) => {
    const id = item.id || `tr${Date.now()}`;
    
    const dbPayload = { 
      id, 
      customer_name: item.customerName, 
      contact_number: item.contactNumber, 
      email: item.email || null,
      date: item.date.toISOString(), 
      time_slot: item.timeSlot, 
      artist_id: item.artistId,
      artist_name: item.artistName,
      artist_contact: item.artistContact,
      placement: item.placement,
      estimated_size: item.estimatedSize,
      design_description: item.designDescription,
      color_style: item.colorStyle,
      agreement_signed: item.agreementSigned,
      consent_signed: item.consentSigned,
      status: item.status, 
      deposit_amount: item.depositAmount, 
      deposit_paid: item.depositPaid,
      inspiration_images: item.inspirationImages || [],
      reschedule_requested: item.rescheduleRequested || false,
      proposed_date: item.proposedDate?.toISOString() || null,
      proposed_time_slot: item.proposedTimeSlot || null,
      customer_reschedule_confirmed: item.customerRescheduleConfirmed || null,
      payment_reference: item.paymentReference || null,
      receipt_url: item.receiptUrl || null,
    };

    const { error } = await supabase.from('tattoo_reservations').insert([dbPayload]);
    if (error) {
      console.error("Tattoo DB Error:", error);
      throw new Error(error.message);
    }
    
    setTattooReservations(prev => [{ ...item, id, createdAt: new Date() }, ...prev]);
    return id;
  };

  const updateTattooReservationStatus = async (id: string, status: TattooReservationStatus) => {
    const { error } = await supabase.from('tattoo_reservations').update({ status }).eq('id', id);
    if (error) throw error;
    setTattooReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const updateTattooDepositPaid = async (id: string, paid: boolean) => {
    const { error } = await supabase.from('tattoo_reservations').update({ deposit_paid: paid }).eq('id', id);
    if (error) throw error;
    setTattooReservations(prev => prev.map(r => r.id === id ? { ...r, depositPaid: paid } : r));
  };

  const proposeReschedule = async (id: string, proposedDate: Date, proposedTimeSlot: string) => {
    const isTable = reservations.some(r => r.id === id);
    const table = isTable ? 'reservations' : 'tattoo_reservations';
    await supabase.from(table).update({ reschedule_requested: true, proposed_date: proposedDate.toISOString(), proposed_time_slot: proposedTimeSlot, customer_reschedule_confirmed: null }).eq('id', id);
    if (isTable) setReservations(prev => prev.map(r => r.id === id ? { ...r, rescheduleRequested: true, proposedDate, proposedTimeSlot, customerRescheduleConfirmed: null } : r));
    else setTattooReservations(prev => prev.map(r => r.id === id ? { ...r, rescheduleRequested: true, proposedDate, proposedTimeSlot, customerRescheduleConfirmed: null } : r));
  };

  const confirmReschedule = async (id: string, confirmed: boolean) => {
    const isTable = reservations.some(r => r.id === id);
    const table = isTable ? 'reservations' : 'tattoo_reservations';
    const r = isTable ? reservations.find(x => x.id === id) : tattooReservations.find(x => x.id === id);
    if (!r) return;
    if (confirmed && r.proposedDate && r.proposedTimeSlot) {
      await supabase.from(table).update({ date: r.proposedDate.toISOString(), time_slot: r.proposedTimeSlot, reschedule_requested: false, proposed_date: null, proposed_time_slot: null, customer_reschedule_confirmed: true }).eq('id', id);
      if (isTable) setReservations(prev => prev.map(item => item.id === id ? { ...item, date: item.proposedDate!, timeSlot: item.proposedTimeSlot!, rescheduleRequested: false, customerRescheduleConfirmed: true } : item));
      else setTattooReservations(prev => prev.map(item => item.id === id ? { ...item, date: item.proposedDate!, timeSlot: item.proposedTimeSlot!, rescheduleRequested: false, customerRescheduleConfirmed: true } : item));
    } else {
      await supabase.from(table).update({ reschedule_requested: false, proposed_date: null, proposed_time_slot: null, customer_reschedule_confirmed: false }).eq('id', id);
      if (isTable) setReservations(prev => prev.map(item => item.id === id ? { ...item, rescheduleRequested: false, customerRescheduleConfirmed: false } : item));
      else setTattooReservations(prev => prev.map(item => item.id === id ? { ...item, rescheduleRequested: false, customerRescheduleConfirmed: false } : item));
    }
  };

  const addTattooArtist = async (artist: Omit<TattooArtist, 'id'>) => {
    const id = `ta${Date.now()}`;
    const dbPayload = { 
      id, 
      name: artist.name, 
      specialty: artist.specialty, 
      contact_number: artist.contactNumber,
      email: artist.email || null,
      bio: artist.bio || null,
      is_available_today: artist.isAvailableToday,
      is_active: artist.isActive,
      unavailable_dates: artist.unavailableDates || [],
    };
    const { error } = await supabase.from('tattoo_artists').insert([dbPayload]);
    if (error) throw error;
    setTattooArtists(prev => [...prev, { ...artist, id }]);
  };

  const updateTattooArtist = async (id: string, updates: Partial<TattooArtist>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.specialty !== undefined) dbUpdates.specialty = updates.specialty;
    if (updates.contactNumber !== undefined) dbUpdates.contact_number = updates.contactNumber;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.isAvailableToday !== undefined) dbUpdates.is_available_today = updates.isAvailableToday;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    
    const { error } = await supabase.from('tattoo_artists').update(dbUpdates).eq('id', id);
    if (error) throw error;
    setTattooArtists(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteTattooArtist = async (id: string) => {
    await supabase.from('tattoo_artists').delete().eq('id', id);
    setTattooArtists(prev => prev.filter(a => a.id !== id));
  };

  const updateTattooArtistUnavailableDates = async (id: string, dates: string[]) => {
    await supabase.from('tattoo_artists').update({ unavailable_dates: dates }).eq('id', id);
    setTattooArtists(prev => prev.map(a => a.id === id ? { ...a, unavailableDates: dates } : a));
  };

  const addStaffUser = async (user: Omit<StaffUser, 'id' | 'createdAt'>) => {
    const id = `u${Date.now()}`;
    const dbUser = {
      id,
      username: user.username,
      password: user.password,
      full_name: user.fullName,
      email: user.email,
      role: user.role,
      artist_id: user.artistId || null,
      phone: user.phone,
      is_active: user.isActive !== undefined ? user.isActive : true
    };
    
    const { error } = await supabase.from('staff_users').insert([dbUser]);
    if (error) {
      console.error(error);
      throw new Error("Failed to add user");
    }
    setStaffUsers(prev => [...prev, { ...user, id, createdAt: new Date() }]);
  };

  const updateStaffUser = async (id: string, updates: Partial<StaffUser>) => {
    const dbUpdates: any = {};
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    if (updates.password !== undefined) dbUpdates.password = updates.password;
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.artistId !== undefined) dbUpdates.artist_id = updates.artistId;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { error } = await supabase.from('staff_users').update(dbUpdates).eq('id', id);
    if (error) throw error;
    setStaffUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const resetStaffUserPassword = async (id: string) => {
    await supabase.from('staff_users').update({ password: 'oneshotdefaultpw' }).eq('id', id);
  };

  const toggleStaffUserActive = async (id: string) => {
    const user = staffUsers.find(u => u.id === id);
    if (!user) return;
    await supabase.from('staff_users').update({ is_active: !user.isActive }).eq('id', id);
    setStaffUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
  };

  const updateRates = async (r: Partial<RatesConfig>) => {
    const dbRates: any = {}; 
    if (r.hourlyRate !== undefined) dbRates.hourly_rate = r.hourlyRate;
    if (r.happyHourRate !== undefined) dbRates.happy_hour_rate = r.happyHourRate;
    if (r.happyHourStart !== undefined) dbRates.happy_hour_start = r.happyHourStart;
    if (r.happyHourEnd !== undefined) dbRates.happy_hour_end = r.happyHourEnd;
    if (r.overtimeRate !== undefined) dbRates.overtime_rate = r.overtimeRate;
    if (r.tattooDeposit !== undefined) dbRates.tattoo_deposit = r.tattooDeposit;
    if (r.downPaymentPercent !== undefined) dbRates.down_payment_percent = r.downPaymentPercent;

    const { error } = await supabase.from('rates_config').update(dbRates).eq('id', 1);
    if (error) throw error;
    setRates(prev => ({ ...prev, ...r }));
  };

  const updateReservationTerms = async (t: Partial<ReservationTerms>) => {
    const dbTerms: any = {};
    if (t.minHours !== undefined) dbTerms.min_hours = t.minHours;
    if (t.maxHours !== undefined) dbTerms.max_hours = t.maxHours;
    if (t.minPartySize !== undefined) dbTerms.min_party_size = t.minPartySize;
    if (t.maxPartySize !== undefined) dbTerms.max_party_size = t.maxPartySize;
    if (t.cancellationHours !== undefined) dbTerms.cancellation_hours = t.cancellationHours;
    if (t.cancellationPolicy !== undefined) dbTerms.cancellation_policy = t.cancellationPolicy;
    if (t.termsAndConditions !== undefined) dbTerms.terms_and_conditions = t.termsAndConditions;

    const { error } = await supabase.from('reservation_terms').update(dbTerms).eq('id', 1);
    if (error) throw error;
    setReservationTermsState(prev => ({ ...prev, ...t }));
  };

  const addAnnouncement = async (item: Omit<Announcement, 'id' | 'createdAt'>) => {
    try {
      const id = `ann${Date.now()}`;
      const dbItem = {
        id,
        title: item.title,
        content: item.content,
        type: item.type,
        is_active: item.isActive,
        expires_at: item.expiresAt ? item.expiresAt.toISOString() : null
      };

      const { error } = await supabase.from('announcements').insert([dbItem]);
      if (error) throw error;
      
      setAnnouncements(prev => [{ ...item, id, createdAt: new Date() }, ...prev]);
      toast.success("Announcement created!");
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to create announcement.");
    }
  };

  const updateAnnouncement = async (id: string, updates: Partial<Announcement>) => {
    try {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.expiresAt !== undefined) dbUpdates.expires_at = updates.expiresAt ? updates.expiresAt.toISOString() : null;

      const { error } = await supabase.from('announcements').update(dbUpdates).eq('id', id);
      if (error) throw error;
      
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
      toast.success("Announcement updated!");
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update announcement.");
    }
  };

  const deleteAnnouncement = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const toggleAnnouncement = async (id: string) => {
    const announcement = announcements.find(a => a.id === id);
    if (!announcement) return;
    await supabase.from('announcements').update({ is_active: !announcement.isActive }).eq('id', id);
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };

  const addClosedDate = async (item: Omit<ClosedDate, 'id'>) => {
    const id = `cd${Date.now()}`;
    const dbPayload = {
      id,
      date: item.date,
      reason: item.reason,
      is_full_day: item.isFullDay,
      open_time: item.openTime || null,
      close_time: item.closeTime || null
    };

    const { error } = await supabase.from('closed_dates').insert([dbPayload]);
    if (error) throw error;
    
    setClosedDates(prev => [...prev, { ...item, id }]);
  };

  const removeClosedDate = async (id: string) => {
    const { error } = await supabase.from('closed_dates').delete().eq('id', id);
    if (error) throw error;
    setClosedDates(prev => prev.filter(c => c.id !== id));
  };

  const updateClosedDate = async (id: string, updates: Partial<ClosedDate>) => {
    const dbPayload: any = {};
    if (updates.date !== undefined) dbPayload.date = updates.date;
    if (updates.reason !== undefined) dbPayload.reason = updates.reason;
    if (updates.isFullDay !== undefined) dbPayload.is_full_day = updates.isFullDay;
    if (updates.openTime !== undefined) dbPayload.open_time = updates.openTime;
    if (updates.closeTime !== undefined) dbPayload.close_time = updates.closeTime;

    const { error } = await supabase.from('closed_dates').update(dbPayload).eq('id', id);
    if (error) throw error;
    
    setClosedDates(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const updateSiteSettings = async (s: Partial<SiteSettings>) => {
    try {
      const dbSettings: any = { id: '1' };
      if (s.logoUrl !== undefined) dbSettings.logo_url = s.logoUrl;
      if (s.heroTitle !== undefined) dbSettings.hero_title = s.heroTitle;
      if (s.heroSubtitle !== undefined) dbSettings.hero_subtitle = s.heroSubtitle;
      if (s.heroDescription !== undefined) dbSettings.hero_description = s.heroDescription;
      if (s.aboutStory !== undefined) dbSettings.about_story = s.aboutStory;
      if (s.contactAddress !== undefined) dbSettings.contact_address = s.contactAddress;
      if (s.contactPhone !== undefined) dbSettings.contact_phone = s.contactPhone;
      if (s.contactEmail !== undefined) dbSettings.contact_email = s.contactEmail;
      if (s.contactHours !== undefined) dbSettings.contact_hours = s.contactHours;
      if (s.heroImage1 !== undefined) dbSettings.hero_image_1 = s.heroImage1;
      if (s.heroImage2 !== undefined) dbSettings.hero_image_2 = s.heroImage2;
      if (s.heroImage3 !== undefined) dbSettings.hero_image_3 = s.heroImage3;
      if (s.heroSliderImages !== undefined) dbSettings.hero_slider_images = s.heroSliderImages;
      if (s.promoImage !== undefined) dbSettings.promo_image = s.promoImage;
      if (s.aboutImage !== undefined) dbSettings.about_image = s.aboutImage;

      const { error } = await supabase.from('site_settings').upsert(dbSettings);
      if (error) throw error;

      setSiteSettings(prev => ({ ...prev, ...s } as SiteSettings));
      toast.success("Site Customization Saved!");
    } catch (err) {
      console.error("Site settings error:", err);
      toast.error("Failed to save site settings.");
    }
  };

  const sendCustomerPush = async (customerName: string, title: string, message: string) => {
    if (!import.meta.env.VITE_ONESIGNAL_REST_KEY) return;
    try {
      await fetch('/api/onesignal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${import.meta.env.VITE_ONESIGNAL_REST_KEY}` },
        body: JSON.stringify({
          app_id: import.meta.env.VITE_ONESIGNAL_APP_ID,
          filters: [{ "field": "tag", "key": "customer_name", "relation": "=", "value": customerName.toLowerCase() }],
          headings: { "en": title },
          contents: { "en": message }
        })
      });
    } catch { console.warn("Push failed suppressed."); }
  };

  const sendAdminPush = async (title: string, message: string) => {
    if (!import.meta.env.VITE_ONESIGNAL_REST_KEY) return;
    try {
      await fetch('/api/onesignal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${import.meta.env.VITE_ONESIGNAL_REST_KEY}` },
        body: JSON.stringify({
          app_id: import.meta.env.VITE_ONESIGNAL_APP_ID,
          filters: [{ "field": "tag", "key": "role", "relation": "=", "value": "admin" }],
          headings: { "en": title },
          contents: { "en": message }
        })
      });
    } catch { console.warn("Admin push suppressed."); }
  };

  return (
    <AppContext.Provider value={{
      tables, queue, reservations, feedback, activities, promoCodes, tattooReservations, tattooArtists,
      staffUsers, rates, reservationTerms, announcements, closedDates, siteSettings, loading,
      staffLoggedIn, adminLoggedIn, artistLoggedIn, currentArtistId, staffProfile,
      staffLogin, staffLogout, adminLogin, adminLogout, artistLogin, artistLogout, updateStaffProfile,
      assignTable, freeTable, reserveTable, extendSession, addTable, updateTable, toggleTableActive, deleteTable,
      addOrderToTable, removeOrderFromTable, addToQueue, removeFromQueue, callQueueItem,
      addReservation, updateReservationStatus, cancelReservation, updateDownPayment, updateBalance,
      addFeedback, addActivity, addPromoCode, togglePromoCode, deletePromoCode, applyPromoCode,
      addTattooReservation, updateTattooReservationStatus, updateTattooDepositPaid,
      proposeReschedule, confirmReschedule, addTattooArtist, updateTattooArtist, deleteTattooArtist, 
      updateTattooArtistUnavailableDates, addStaffUser, updateStaffUser, resetStaffUserPassword, 
      toggleStaffUserActive, updateRates, updateReservationTerms, addAnnouncement, updateAnnouncement, 
      deleteAnnouncement, toggleAnnouncement, addClosedDate, removeClosedDate, updateClosedDate, 
      updateSiteSettings, refreshData, sendCustomerPush, sendAdminPush
    }}>
      {children}
    </AppContext.Provider>
  );
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
}