import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../utils/supabase/client';

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

export function generateRandomPromoCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function generateReferralCode(name: string): string {
  const prefix = name.replace(/\s+/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

export type TattooReservationStatus = 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';

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
};

export const TATTOO_DEPOSIT = 500;

export type StaffProfile = {
  username: string;
  password?: string; // <-- Add the ? to make it optional
  fullName: string;
  email: string;
  role: string;
  phone: string;
  joinedDate: string;
  artistId?: string;
};

export type StaffUser = {
  id: string;
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: 'manager' | 'tattoo-artist' | 'cashier';
  isAdmin: boolean;
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
};

export const HOURLY_RATE = 250;
export const DOWN_PAYMENT_RATE = 0.25;

const DEFAULT_STAFF_PROFILE: StaffProfile = {
  username: 'admin', fullName: 'Admin User', 
  email: 'admin@oneshot.com', role: 'Manager', phone: '09171234567', joinedDate: '2024-01-15',
};

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
  addReservation: (item: Omit<Reservation, 'id' | 'createdAt'>) => Promise<void>;
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
  addTattooReservation: (item: Omit<TattooReservation, 'id' | 'createdAt'>) => Promise<void>;
  updateTattooReservationStatus: (id: string, status: TattooReservationStatus) => Promise<void>;
  updateTattooDepositPaid: (id: string, paid: boolean) => Promise<void>;
  rescheduleTattooReservation: (id: string, proposedDate: Date, proposedTimeSlot: string) => Promise<void>;
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
};

const AppContext = createContext<AppContextType | undefined>(undefined);

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
    hourlyRate: 250,
    happyHourRate: 200,
    happyHourStart: '18:00',
    happyHourEnd: '19:00',
    overtimeRate: 250,
    tattooDeposit: 500,
    downPaymentPercent: 25,
  });
  const [reservationTerms, setReservationTermsState] = useState<ReservationTerms>({
    minHours: 1,
    maxHours: 8,
    minPartySize: 1,
    maxPartySize: 10,
    cancellationHours: 24,
    cancellationPolicy: 'Cancellations must be made at least 24 hours before the reservation.',
    termsAndConditions: 'Standard terms apply.',
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

  const mapTableFromDB = (row: any): Table => ({
    id: row.id,
    name: row.name,
    status: row.status,
    isActive: row.is_active,
    session: row.session_customer_name ? {
      customerName: row.session_customer_name,
      startTime: new Date(row.session_start_time),
      durationMinutes: row.session_duration_minutes,
      isPaid: row.session_is_paid,
      hourlyRate: row.session_hourly_rate,
      amountPaid: row.session_amount_paid,
      orders: row.session_orders || [],
    } : undefined,
  });

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
    session_orders: table.session?.orders || null,
  });

  const refreshData = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const [
        { data: tablesData, error: tablesError },
        { data: queueData, error: queueError },
        { data: resData, error: resError },
        { data: feedbackData, error: feedbackError },
        { data: actData, error: actError },
        { data: promoData, error: promoError },
        { data: artistsData, error: artistsError },
        { data: tattooResData, error: tattooResError },
        { data: staffData, error: staffError },
        { data: ratesData, error: ratesError },
        { data: termsData, error: termsError },
        { data: annData, error: annError },
        { data: closedData, error: closedError },
        { data: settingsData, error: settingsError }
      ] = await Promise.all([
        supabase.from('tables').select('*').order('name'),
        supabase.from('queue_items').select('*').order('arrival_time'),
        // Added .limit(500) to cap memory usage
        supabase.from('reservations').select('*').order('date', { ascending: false }).limit(500), 
        supabase.from('feedback').select('*').order('created_at', { ascending: false }),
        // 🚨 FIX: Changed 'created_at' to 'timestamp' to match your Supabase schema!
        supabase.from('activities').select('*').order('timestamp', { ascending: false }).limit(200),
        supabase.from('promo_codes').select('*').order('created_at', { ascending: false }),
        supabase.from('tattoo_artists').select('*').order('name'),
        supabase.from('tattoo_reservations').select('*').order('date', { ascending: false }),
        supabase.from('staff_users').select('*').order('full_name'),
        supabase.from('rates_config').select('*').eq('id', '1').maybeSingle(),
        supabase.from('reservation_terms').select('*').eq('id', '1').maybeSingle(),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
        supabase.from('closed_dates').select('*').order('date'),
        supabase.from('site_settings').select('*').eq('id', '1').maybeSingle()
      ]);

      if (tablesError) console.error('Error fetching tables:', tablesError);
      else setTables((tablesData || []).map(mapTableFromDB));

      if (queueError) console.error('Error fetching queue:', queueError);
      else setQueue((queueData || []).map(row => ({
        id: row.id,
        customerName: row.customer_name,
        contactNumber: row.contact_number,
        partySize: row.party_size,
        arrivalTime: new Date(row.arrival_time),
        notes: row.notes || undefined,
        status: row.status,
      })));

      if (resError) console.error('Error fetching reservations:', resError);
      else setReservations((resData || []).map(row => ({
        id: row.id,
        customerName: row.customer_name,
        contactNumber: row.contact_number,
        email: row.email || undefined,
        date: new Date(row.date),
        timeSlot: row.time_slot,
        durationHours: row.duration_hours,
        partySize: row.party_size,
        tableId: row.table_id || undefined,
        status: row.status,
        totalAmount: row.total_amount,
        downPaymentAmount: row.down_payment_amount,
        downPaymentPaid: row.down_payment_paid,
        balancePaid: row.balance_paid,
        createdAt: new Date(row.created_at),
        cancellationReason: row.cancellation_reason || undefined,
        promoCode: row.promo_code || undefined,
        discountAmount: row.discount_amount || undefined,
        paymentReference: row.payment_reference || undefined,
        receiptUrl: row.receipt_url || undefined,
      })));

      if (feedbackError) console.error('Error fetching feedback:', feedbackError);
      else setFeedback((feedbackData || []).map(row => ({
        id: row.id,
        customerName: row.customer_name,
        contactInfo: row.contact_info || undefined,
        rating: row.rating,
        feedbackType: row.feedback_type || undefined,
        comment: row.comment,
        date: new Date(row.created_at),
        reservationId: row.reservation_id || undefined,
        tags: row.tags || [],
      })));

      if (actError) console.error('Error fetching activities:', actError);
      else {
        const mapped = (actData || []).map(row => ({
          id: row.id,
          type: row.type as ActivityType,
          description: row.description,
          timestamp: new Date(row.created_at || row.timestamp || Date.now()),
          metadata: row.metadata || undefined,
        }));
        mapped.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setActivities(mapped);
      }

      if (promoError) console.error('Error fetching promo codes:', promoError);
      else setPromoCodes((promoData || []).map(row => ({
        id: row.id,
        code: row.code,
        discountPercent: row.discount_percent,
        description: row.description,
        isActive: row.is_active,
        maxUsage: row.max_usage,
        usageCount: row.usage_count,
        expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
        createdAt: new Date(row.created_at),
      })));

      if (artistsError) console.error('Error fetching tattoo artists:', artistsError);
      else setTattooArtists((artistsData || []).map(row => ({
        id: row.id,
        name: row.name,
        specialty: row.specialty,
        contactNumber: row.contact_number,
        email: row.email || undefined,
        bio: row.bio || undefined,
        isAvailableToday: row.is_available_today,
        isActive: row.is_active,
        unavailableDates: row.unavailable_dates || [],
      })));

      if (tattooResError) console.error('Error fetching tattoo reservations:', tattooResError);
      else setTattooReservations((tattooResData || []).map(row => ({
        id: row.id,
        customerName: row.customer_name,
        contactNumber: row.contact_number,
        email: row.email || undefined,
        date: new Date(row.date),
        timeSlot: row.time_slot,
        artistId: row.artist_id,
        artistName: row.artist_name,
        artistContact: row.artist_contact,
        placement: row.placement,
        estimatedSize: row.estimated_size,
        designDescription: row.design_description,
        colorStyle: row.color_style,
        agreementSigned: row.agreement_signed,
        consentSigned: row.consent_signed,
        status: row.status,
        depositAmount: row.deposit_amount,
        depositPaid: row.deposit_paid,
        inspirationImages: row.inspiration_images || undefined,
        createdAt: new Date(row.created_at),
        rescheduleRequested: row.reschedule_requested || undefined,
        proposedDate: row.proposed_date ? new Date(row.proposed_date) : undefined,
        proposedTimeSlot: row.proposed_time_slot || undefined,
        customerRescheduleConfirmed: row.customer_reschedule_confirmed,
      })));

      if (staffError) console.error('Error fetching staff users:', staffError);
      else setStaffUsers((staffData || []).map(row => ({
        id: row.id,
        username: row.username,
        password: row.password,
        fullName: row.full_name,
        email: row.email,
        role: row.role as any,
        isAdmin: row.is_admin,
        artistId: row.artist_id || undefined,
        phone: row.phone,
        isActive: row.is_active,
        createdAt: new Date(row.created_at),
      })));

      if (ratesError) console.error('Error fetching rates config:', ratesError);
      else if (ratesData) {
        setRates({
          hourlyRate: ratesData.hourly_rate,
          happyHourRate: ratesData.happy_hour_rate,
          happyHourStart: ratesData.happy_hour_start,
          happyHourEnd: ratesData.happy_hour_end,
          overtimeRate: ratesData.overtime_rate,
          tattooDeposit: ratesData.tattoo_deposit,
          downPaymentPercent: ratesData.down_payment_percent,
        });
      }

      if (termsError) console.error('Error fetching reservation terms:', termsError);
      else if (termsData) {
        setReservationTermsState({
          minHours: termsData.min_hours,
          maxHours: termsData.max_hours,
          minPartySize: termsData.min_party_size,
          maxPartySize: termsData.max_party_size,
          cancellationHours: termsData.cancellation_hours,
          cancellationPolicy: termsData.cancellation_policy,
          termsAndConditions: termsData.terms_and_conditions,
        });
      }

      if (annError) console.error('Error fetching announcements:', annError);
      else setAnnouncements((annData || []).map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        type: row.type as AnnouncementType,
        isActive: row.is_active,
        createdAt: new Date(row.created_at),
        expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
      })));

      if (closedError) console.error('Error fetching closed dates:', closedError);
      else setClosedDates((closedData || []).map(row => ({
        id: row.id,
        date: row.date,
        reason: row.reason,
        isFullDay: row.is_full_day,
        openTime: row.open_time || undefined,
        closeTime: row.close_time || undefined,
      })));

      if (settingsError) console.error('Error fetching site settings:', settingsError);
      else if (settingsData) {
        setSiteSettings({
          logoUrl: settingsData.logo_url || '',
          heroTitle: settingsData.hero_title || '',
          heroSubtitle: settingsData.hero_subtitle || '',
          heroDescription: settingsData.hero_description || '',
          aboutStory: settingsData.about_story || '',
          contactAddress: settingsData.contact_address || '',
          contactPhone: settingsData.contact_phone || '',
          contactEmail: settingsData.contact_email || '',
          contactHours: settingsData.contact_hours || '',
        });
      }

    } catch (err) {
      // Properly typed error catching instead of 'any'
      const errorMessage = err instanceof Error ? err.message : 'Unknown network error';
      console.error('Critical sync error:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    refreshData();
    const savedSession = localStorage.getItem('oneshot_staff_session');
    if (savedSession) {
      try {
        const profile = JSON.parse(savedSession);
        setStaffProfile(profile);
        
        const r = profile.role?.toLowerCase();
        if (r === 'admin' || profile.isAdmin) {
          setAdminLoggedIn(true);
          setStaffLoggedIn(true); // 🚨 Restore dual-access on refresh
        }
        else if (r === 'artist' || r === 'tattoo-artist') {
          setArtistLoggedIn(true);
          setCurrentArtistId(profile.artistId || null);
        }
        else setStaffLoggedIn(true); // Managers and standard staff
      } catch (e) {
        console.error('Failed to parse saved session');
      }
    }
  }, []);

  // ── Auth ──────────────────────────────────────────────────────
  // ── Auth ──────────────────────────────────────────────────────
  
  const saveStaffSession = (profile: StaffProfile) => {
    // SECURITY PATCH: Clone the profile and strip the password before saving to browser!
    const secureProfile = { ...profile };
    delete secureProfile.password;
    
    localStorage.setItem('oneshot_staff_session', JSON.stringify(secureProfile));
    setStaffProfile(profile);
  };

  const clearStaffSession = async () => {
    localStorage.removeItem('oneshot_staff_session');
    setStaffProfile(DEFAULT_STAFF_PROFILE);
    setStaffLoggedIn(false);
    setAdminLoggedIn(false);
    setArtistLoggedIn(false);
    setCurrentArtistId(null);
    await supabase.auth.signOut(); // Wipes any lingering Supabase cache!
  };

  const staffLogin = async (username: string, password: string): Promise<boolean> => {
    const user = staffUsers.find(u => u.username === username && u.password === password && u.isActive);
    
    if (user) { 
      setStaffLoggedIn(true); 
      saveStaffSession({
        username: user.username, fullName: user.fullName, email: user.email,
        role: user.role, phone: user.phone, joinedDate: user.createdAt.toISOString(), artistId: user.artistId
      });
      return true; 
    }
    return false;
  };
  
 const staffLogout = async () => await clearStaffSession();

  const adminLogin = async (username: string, password: string): Promise<boolean> => {
    const user = staffUsers.find(u => 
      u.username === username && u.password === password && u.isActive && 
      (u.isAdmin || u.role?.toLowerCase() === 'admin')
    );
    
    if (user) {
      setAdminLoggedIn(true);
      setStaffLoggedIn(true); // 🚨 Grants Admins access to the Staff Portal!
      saveStaffSession({
        username: user.username, fullName: user.fullName, email: user.email,
        role: user.role, phone: user.phone, joinedDate: user.createdAt.toISOString(), artistId: user.artistId
      });
      return true;
    }
    return false;
  };
  
  const adminLogout = async () => await clearStaffSession();

  const artistLogin = async (username: string, password: string): Promise<boolean> => {
    const user = staffUsers.find(u => u.username === username && u.password === password && u.isActive && u.role === 'tattoo-artist');
    if (user && user.artistId) {
      setArtistLoggedIn(true);
      setCurrentArtistId(user.artistId);
      saveStaffSession({
        username: user.username,
        password: user.password,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        joinedDate: user.createdAt.toISOString(),
        artistId: user.artistId
      });
      return true;
    }
    return false;
  };
  
  const artistLogout = async () => await clearStaffSession();

 const updateStaffProfile = async (profile: Partial<StaffProfile>) => {
    // 1. Update the local screen memory immediately
    setStaffProfile(prev => ({ ...prev, ...profile }));
    
    // 2. Find the actual user ID from the database array using their current username
    const user = staffUsers.find(u => u.username === staffProfile.username);
    
    // 3. Push the changes securely to Supabase!
    if (user) {
      await updateStaffUser(user.id, {
        ...(profile.username && { username: profile.username }),
        ...(profile.password && { password: profile.password }),
        ...(profile.fullName && { fullName: profile.fullName }),
        ...(profile.email && { email: profile.email }),
        ...(profile.phone && { phone: profile.phone }),
      });
    }
  };

 const addActivity = async (type: ActivityType, description: string, metadata?: Record<string, any>) => {
    try {
      const id = `act_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const activity = { id, type, description, metadata };
      
      // FIX: Await the insert and check for errors cleanly instead of chaining .catch()
      const { error } = await supabase.from('activities').insert([activity]);
      if (error) console.error('Error inserting activity:', error);
      
      setActivities(prev => [{ ...activity, timestamp: new Date() }, ...prev]);
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  };

  // ── Tables ────────────────────────────────────────────────────
  const assignTable = async (tableId: string, session: Session) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const updated = { ...table, status: 'occupied' as TableStatus, session };
    const { error } = await supabase.from('tables').update(mapTableToDB(updated)).eq('id', tableId);
    if (error) {
      console.error("Assign Table Error:", error);
      throw new Error("Failed to assign table in database."); // Stops execution here!
    }

    // 2. Only update the UI if the database succeeded
    setTables(prev => prev.map(t => t.id === tableId ? updated : t));
    await addActivity('table_assigned', `${table.name} assigned to ${session.customerName}`, { tableId, customerName: session.customerName });
  };

  const freeTable = async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const updated = { ...table, status: 'available' as TableStatus, session: undefined };
    
    const { error } = await supabase.from('tables').update(mapTableToDB(updated)).eq('id', tableId);
    if (error) {
      console.error("Free Table Error:", error);
      throw new Error("Failed to free table in database.");
    }

    setTables(prev => prev.map(t => t.id === tableId ? updated : t));
    await addActivity('table_freed', `Table ${table.name} freed`);
  };

  const reserveTable = async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const updated = { ...table, status: 'reserved' as TableStatus };
    
    const { error } = await supabase.from('tables').update(mapTableToDB(updated)).eq('id', tableId);
    if (error) {
      console.error("Reserve Table Error:", error);
      throw new Error("Failed to reserve table in database.");
    }

    setTables(prev => prev.map(t => t.id === tableId ? updated : t));
    await addActivity('table_reserved', `Table ${table.name} reserved`);
  };

  const extendSession = async (tableId: string, extraMinutes: number, extraPayment: number) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.session) return;

    const newDuration = table.session.durationMinutes + extraMinutes;
    const newEndTime = new Date(table.session.startTime.getTime() + newDuration * 60000);

    const todayStr = new Date().toISOString().split('T')[0];
    const conflict = reservations.find(r => {
      // PROTECT: Ignore if cancelled/completed, or missing crucial data from old records
      if (r.tableId !== tableId || r.status === 'cancelled' || r.status === 'completed' || !r.timeSlot || !r.date) return false;
      
      const rDateStr = new Date(r.date).toISOString().split('T')[0];
      if (rDateStr !== todayStr) return false;
      
      const resStart = new Date(r.date);
      const [hours, minutes] = r.timeSlot.split(':').map(Number);
      resStart.setHours(hours, minutes, 0, 0);
      
      return newEndTime > resStart; 
    });

    if (conflict) {
      alert(`EXTENSION BLOCKED: This table is reserved for ${conflict.customerName} at ${conflict.timeSlot}. Please assign the customer to a different table.`);
      throw new Error("Table overlap conflict.");
    }

    const updated = {
      ...table,
      session: {
        ...table.session,
        durationMinutes: newDuration,
        amountPaid: table.session.amountPaid + extraPayment
      }
    };
    await supabase.from('tables').update(mapTableToDB(updated)).eq('id', tableId);
    setTables(prev => prev.map(t => t.id === tableId ? updated : t));
    await addActivity('session_extended', `Table ${table.name} extended by ${extraMinutes} mins`);
  };

  // 🚨 NEW: The actual POS order function!
  const addOrderToTable = async (tableId: string, order: OrderItem) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.session) return;
    
    const updated = {
      ...table,
      session: { 
        ...table.session, 
        orders: [...(table.session.orders || []), order] 
      }
    };
    
    await supabase.from('tables').update(mapTableToDB(updated)).eq('id', tableId);
    setTables(prev => prev.map(t => t.id === tableId ? updated : t));
    await addActivity('payment_received', `Added ${order.name} to ${table.name}`);
  };

  const removeOrderFromTable = async (tableId: string, orderId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.session || !table.session.orders) return;
    
    const orderToRemove = table.session.orders.find(o => o.id === orderId);
    const newOrders = table.session.orders.filter(o => o.id !== orderId);
    
    const updated = {
      ...table,
      session: { 
        ...table.session, 
        orders: newOrders 
      }
    };
    
    await supabase.from('tables').update(mapTableToDB(updated)).eq('id', tableId);
    setTables(prev => prev.map(t => t.id === tableId ? updated : t));
    if (orderToRemove) {
      await addActivity('admin_action', `Voided ${orderToRemove.name} from ${table.name}`);
    }
  };

  const addTable = async (name: string) => {
    const id = `t${Date.now()}`;
    const newTable: Table = { id, name, status: 'available', isActive: true };
    await supabase.from('tables').insert([mapTableToDB(newTable)]);
    setTables(prev => [...prev, newTable]);
    await addActivity('admin_action', `Table "${name}" added`, { tableId: id });
  };

  const updateTable = async (id: string, name: string) => {
    await supabase.from('tables').update({ name }).eq('id', id);
    setTables(prev => prev.map(t => t.id === id ? { ...t, name } : t));
    await addActivity('admin_action', `Table renamed to "${name}"`, { tableId: id });
  };

  const toggleTableActive = async (id: string) => {
    const table = tables.find(t => t.id === id);
    if (!table) return;

    await supabase.from('tables').update({ is_active: !table.isActive }).eq('id', id);
    setTables(prev => prev.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t));
    await addActivity('admin_action', `Table "${table.name}" ${table.isActive ? 'deactivated' : 'activated'}`, { tableId: id });
  };

  const deleteTable = async (id: string) => {
    const table = tables.find(t => t.id === id);
    const tableName = table ? table.name : id; // Fallback just in case
    
    await supabase.from('tables').delete().eq('id', id);
    setTables(prev => prev.filter(t => t.id !== id));
    // FIXED: Use tableName instead of id
    await addActivity('admin_action', `Table "${tableName}" deleted`, { tableId: id });
  };

  const addToQueue = async (item: Omit<QueueItem, 'id' | 'arrivalTime' | 'status'>) => {
    const id = `q${Date.now()}`;
    const arrivalTime = new Date();
    const queueItem = { ...item, id, arrivalTime, status: 'waiting' as const };

    await supabase.from('queue_items').insert([{
      id,
      customer_name: item.customerName,
      contact_number: item.contactNumber,
      party_size: item.partySize,
      arrival_time: arrivalTime.toISOString(),
      notes: item.notes,
      status: 'waiting'
    }]);
    setQueue(prev => [...prev, queueItem]);
    await addActivity('queue_added', `${item.customerName} added to queue`);
  };

  const removeFromQueue = async (id: string) => {
    await supabase.from('queue_items').delete().eq('id', id);
    setQueue(prev => prev.filter(q => q.id !== id));
    await addActivity('queue_removed', 'Queue item removed');
  };

  const callQueueItem = async (id: string) => {
    await supabase.from('queue_items').update({ status: 'called' }).eq('id', id);
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'called' as const } : q));
    await addActivity('queue_called', 'Queue item called');
  };

  const addReservation = async (item: Omit<Reservation, 'id' | 'createdAt'>) => {
    const id = crypto.randomUUID();
    const reservation: Reservation = { ...item, id, createdAt: new Date() };

    const { error } = await supabase.from('reservations').insert([{
      id,
      customer_name: item.customerName,
      contact_number: item.contactNumber,
      email: item.email,
      date: item.date.toISOString(),
      time_slot: item.timeSlot,
      duration_hours: item.durationHours,
      party_size: item.partySize,
      table_id: item.tableId,
      status: item.status,
      total_amount: item.totalAmount,
      down_payment_amount: item.downPaymentAmount,
      down_payment_paid: item.downPaymentPaid,
      balance_paid: item.balancePaid,
      cancellation_reason: item.cancellationReason,
      promo_code: item.promoCode,
      discount_amount: item.discountAmount,
      payment_reference: item.paymentReference,
      receipt_url: item.receiptUrl,
    }]);

    if (error) {
      console.error("Supabase Save Error:", error);
      throw new Error(error.message); 
    }

    setReservations(prev => [...prev, reservation]);
    await addActivity('reservation_created', `New reservation for ${item.customerName}`);
  };
  const updateReservationStatus = async (id: string, status: ReservationStatus) => {
    await supabase.from('reservations').update({ status }).eq('id', id);
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    await addActivity('reservation_updated', `Reservation updated to ${status}`);
  };

  const cancelReservation = async (id: string, reason: string) => {
    const { error } = await supabase.from('reservations').update({ status: 'cancelled', cancellation_reason: reason }).eq('id', id);
    if (error) throw new Error(error.message);
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' as ReservationStatus, cancellationReason: reason } : r));
    await addActivity('reservation_cancelled', 'Reservation cancelled');
  };

  const updateDownPayment = async (id: string, paid: boolean) => {
    await supabase.from('reservations').update({ down_payment_paid: paid }).eq('id', id);
    setReservations(prev => prev.map(r => r.id === id ? { ...r, downPaymentPaid: paid } : r));
    await addActivity('payment_received', `Down payment ${paid ? 'received' : 'refunded'}`);
  };

  const updateBalance = async (id: string, paid: boolean) => {
    await supabase.from('reservations').update({ balance_paid: paid }).eq('id', id);
    setReservations(prev => prev.map(r => r.id === id ? { ...r, balancePaid: paid } : r));
    await addActivity('payment_received', `Balance ${paid ? 'paid' : 'refunded'}`);
  };

  const addFeedback = async (item: Omit<Feedback, 'id' | 'date'>) => {
    const id = `f${Date.now()}`;
    const feedback = { ...item, id, date: new Date() };

    await supabase.from('feedback').insert([{
      id,
      customer_name: item.customerName,
      contact_info: item.contactInfo,
      rating: item.rating,
      feedback_type: item.feedbackType,
      comment: item.comment,
      reservation_id: item.reservationId,
      tags: item.tags,
    }]);
    setFeedback(prev => [feedback, ...prev]);
    await addActivity('feedback_received', `Feedback received from ${item.customerName}`);
  };

  const addPromoCode = async (item: Omit<PromoCode, 'id' | 'createdAt' | 'usageCount'>) => {
    const id = `pc${Date.now()}`;
    const promoCode = { ...item, id, usageCount: 0, createdAt: new Date() };

    await supabase.from('promo_codes').insert([{
      id,
      code: item.code,
      discount_percent: item.discountPercent,
      description: item.description,
      is_active: item.isActive,
      max_usage: item.maxUsage,
      usage_count: 0,
      expires_at: item.expiresAt?.toISOString(),
    }]);
    setPromoCodes(prev => [promoCode, ...prev]);
    await addActivity('promo_created', `Promo code ${item.code} created`);
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
    if (promo.expiresAt && new Date() > new Date(promo.expiresAt)) return null;

    await supabase.from('promo_codes').update({ usage_count: promo.usageCount + 1 }).eq('id', promo.id);
    setPromoCodes(prev => prev.map(p => p.id === promo.id ? { ...p, usageCount: p.usageCount + 1 } : p));
    return promo;
  };

  const addTattooReservation = async (item: Omit<TattooReservation, 'id' | 'createdAt'>) => {
    const id = `tr${Date.now()}`;
    const reservation = { ...item, id, createdAt: new Date() };

    await supabase.from('tattoo_reservations').insert([{
      id,
      customer_name: item.customerName,
      contact_number: item.contactNumber,
      email: item.email,
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
      inspiration_images: item.inspirationImages,
      reschedule_requested: item.rescheduleRequested,
      proposed_date: item.proposedDate?.toISOString(),
      proposed_time_slot: item.proposedTimeSlot,
      customer_reschedule_confirmed: item.customerRescheduleConfirmed,
    }]);
    setTattooReservations(prev => [reservation, ...prev]);
    await addActivity('tattoo_reservation_created', `Tattoo reservation for ${item.customerName}`);
  };

  const updateTattooReservationStatus = async (id: string, status: TattooReservationStatus) => {
    await supabase.from('tattoo_reservations').update({ status }).eq('id', id);
    setTattooReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const updateTattooDepositPaid = async (id: string, paid: boolean) => {
    await supabase.from('tattoo_reservations').update({ deposit_paid: paid }).eq('id', id);
    setTattooReservations(prev => prev.map(r => r.id === id ? { ...r, depositPaid: paid } : r));
  };

  const rescheduleTattooReservation = async (id: string, proposedDate: Date, proposedTimeSlot: string) => {
    await supabase.from('tattoo_reservations').update({
      reschedule_requested: true,
      proposed_date: proposedDate.toISOString(),
      proposed_time_slot: proposedTimeSlot,
      customer_reschedule_confirmed: null
    }).eq('id', id);
    setTattooReservations(prev => prev.map(r => r.id === id ? {
      ...r, rescheduleRequested: true, proposedDate, proposedTimeSlot, customerRescheduleConfirmed: null
    } : r));
  };

  const confirmReschedule = async (id: string, confirmed: boolean) => {
    const reservation = tattooReservations.find(r => r.id === id);
    if (!reservation) return;

    if (confirmed && reservation.proposedDate && reservation.proposedTimeSlot) {
      await supabase.from('tattoo_reservations').update({
        date: reservation.proposedDate.toISOString(),
        time_slot: reservation.proposedTimeSlot,
        reschedule_requested: false,
        proposed_date: null,
        proposed_time_slot: null,
        customer_reschedule_confirmed: true
      }).eq('id', id);
      setTattooReservations(prev => prev.map(r => r.id === id ? {
        ...r, date: reservation.proposedDate!, timeSlot: reservation.proposedTimeSlot!, rescheduleRequested: false, proposedDate: undefined, proposedTimeSlot: undefined, customerRescheduleConfirmed: true
      } : r));
    } else {
      await supabase.from('tattoo_reservations').update({
        reschedule_requested: false,
        proposed_date: null,
        proposed_time_slot: null,
        customer_reschedule_confirmed: false
      }).eq('id', id);
      setTattooReservations(prev => prev.map(r => r.id === id ? {
        ...r, rescheduleRequested: false, proposedDate: undefined, proposedTimeSlot: undefined, customerRescheduleConfirmed: false
      } : r));
    }
  };

  const addTattooArtist = async (artist: Omit<TattooArtist, 'id'>) => {
    const id = `ta${Date.now()}`;
    const newArtist = { ...artist, id };

    await supabase.from('tattoo_artists').insert([{
      id,
      name: artist.name,
      specialty: artist.specialty,
      contact_number: artist.contactNumber,
      email: artist.email,
      bio: artist.bio,
      is_available_today: artist.isAvailableToday,
      is_active: artist.isActive,
      unavailable_dates: artist.unavailableDates,
    }]);
    setTattooArtists(prev => [...prev, newArtist]);
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
    if (updates.unavailableDates !== undefined) dbUpdates.unavailable_dates = updates.unavailableDates;

    await supabase.from('tattoo_artists').update(dbUpdates).eq('id', id);
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
    const newUser = { ...user, id, createdAt: new Date() };

    await supabase.from('staff_users').insert([{
      id,
      username: user.username,
      password: user.password,
      full_name: user.fullName,
      email: user.email,
      role: user.role,
      is_admin: user.isAdmin,
      artist_id: user.artistId,
      phone: user.phone,
      is_active: user.isActive,
    }]);
    setStaffUsers(prev => [...prev, newUser]);
  };

  const updateStaffUser = async (id: string, updates: Partial<StaffUser>) => {
    const dbUpdates: any = {};
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    if (updates.password !== undefined) dbUpdates.password = updates.password;
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.isAdmin !== undefined) dbUpdates.is_admin = updates.isAdmin;
    if (updates.artistId !== undefined) dbUpdates.artist_id = updates.artistId;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    await supabase.from('staff_users').update(dbUpdates).eq('id', id);
    setStaffUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const resetStaffUserPassword = async (id: string) => {
    await supabase.from('staff_users').update({ password: 'oneshotdefaultpw' }).eq('id', id);
    setStaffUsers(prev => prev.map(u => u.id === id ? { ...u, password: 'oneshotdefaultpw' } : u));
  };

  const toggleStaffUserActive = async (id: string) => {
    const user = staffUsers.find(u => u.id === id);
    if (!user) return;

    await supabase.from('staff_users').update({ is_active: !user.isActive }).eq('id', id);
    setStaffUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
  };

  const updateRates = async (r: Partial<RatesConfig>) => {
    // Add id: '1' so the database knows exactly which row to create/update
    const updates: any = { id: '1' }; 
    if (r.hourlyRate !== undefined) updates.hourly_rate = r.hourlyRate;
    if (r.happyHourRate !== undefined) updates.happy_hour_rate = r.happyHourRate;
    if (r.happyHourStart !== undefined) updates.happy_hour_start = r.happyHourStart;
    if (r.happyHourEnd !== undefined) updates.happy_hour_end = r.happyHourEnd;
    if (r.overtimeRate !== undefined) updates.overtime_rate = r.overtimeRate;
    if (r.tattooDeposit !== undefined) updates.tattoo_deposit = r.tattooDeposit;
    if (r.downPaymentPercent !== undefined) updates.down_payment_percent = r.downPaymentPercent;

    // CHANGED from .update() to .upsert() so it creates the row if it's missing!
    const { error } = await supabase.from('rates_config').upsert(updates);
    
    if (error) {
      console.error("Database Error saving rates:", error.message);
      alert("Failed to save to database. Check console for details.");
    } else {
      setRates(prev => ({ ...prev, ...r }));
    }
  };

  const updateReservationTerms = async (t: Partial<ReservationTerms>) => {
    const updates: any = {};
    if (t.minHours !== undefined) updates.min_hours = t.minHours;
    if (t.maxHours !== undefined) updates.max_hours = t.maxHours;
    if (t.minPartySize !== undefined) updates.min_party_size = t.minPartySize;
    if (t.maxPartySize !== undefined) updates.max_party_size = t.maxPartySize;
    if (t.cancellationHours !== undefined) updates.cancellation_hours = t.cancellationHours;
    if (t.cancellationPolicy !== undefined) updates.cancellation_policy = t.cancellationPolicy;
    if (t.termsAndConditions !== undefined) updates.terms_and_conditions = t.termsAndConditions;

    await supabase.from('reservation_terms').update(updates).eq('id', '1');
    setReservationTermsState(prev => ({ ...prev, ...t }));
  };

  const addAnnouncement = async (item: Omit<Announcement, 'id' | 'createdAt'>) => {
    const id = `ann${Date.now()}`;
    const announcement = { ...item, id, createdAt: new Date() };

    await supabase.from('announcements').insert([{
      id,
      title: item.title,
      content: item.content,
      type: item.type,
      is_active: item.isActive,
      expires_at: item.expiresAt?.toISOString(),
    }]);
    setAnnouncements(prev => [announcement, ...prev]);
  };

  const updateAnnouncement = async (id: string, updates: Partial<Announcement>) => {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.expiresAt !== undefined) dbUpdates.expires_at = updates.expiresAt?.toISOString();

    await supabase.from('announcements').update(dbUpdates).eq('id', id);
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
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
    const closedDate = { ...item, id };

    await supabase.from('closed_dates').insert([{
      id,
      date: item.date,
      reason: item.reason,
      is_full_day: item.isFullDay,
      open_time: item.openTime,
      close_time: item.closeTime,
    }]);
    setClosedDates(prev => [...prev, closedDate]);
  };

  const removeClosedDate = async (id: string) => {
    await supabase.from('closed_dates').delete().eq('id', id);
    setClosedDates(prev => prev.filter(c => c.id !== id));
  };

  const updateClosedDate = async (id: string, updates: Partial<ClosedDate>) => {
    const dbUpdates: any = {};
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.reason !== undefined) dbUpdates.reason = updates.reason;
    if (updates.isFullDay !== undefined) dbUpdates.is_full_day = updates.isFullDay;
    if (updates.openTime !== undefined) dbUpdates.open_time = updates.openTime;
    if (updates.closeTime !== undefined) dbUpdates.close_time = updates.closeTime;

    await supabase.from('closed_dates').update(dbUpdates).eq('id', id);
    setClosedDates(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const updateSiteSettings = async (s: Partial<SiteSettings>) => {
    const updates: any = { id: '1' };
    if (s.logoUrl !== undefined) updates.logo_url = s.logoUrl;
    if (s.heroTitle !== undefined) updates.hero_title = s.heroTitle;
    if (s.heroSubtitle !== undefined) updates.hero_subtitle = s.heroSubtitle;
    if (s.heroDescription !== undefined) updates.hero_description = s.heroDescription;
    if (s.aboutStory !== undefined) updates.about_story = s.aboutStory;
    if (s.contactAddress !== undefined) updates.contact_address = s.contactAddress;
    if (s.contactPhone !== undefined) updates.contact_phone = s.contactPhone;
    if (s.contactEmail !== undefined) updates.contact_email = s.contactEmail;
    if (s.contactHours !== undefined) updates.contact_hours = s.contactHours;

    const { error } = await supabase.from('site_settings').upsert(updates);
    if (error) throw new Error(error.message);
    setSiteSettings(prev => ({ ...prev, ...s } as SiteSettings));
  };

  return (
    <AppContext.Provider value={{
      tables, queue, reservations, feedback, activities, promoCodes, tattooReservations, tattooArtists,
      staffUsers, rates, reservationTerms: reservationTerms, announcements, closedDates, siteSettings,
      loading,
      staffLoggedIn, adminLoggedIn, artistLoggedIn, currentArtistId, staffProfile,
      staffLogin, staffLogout, adminLogin, adminLogout, artistLogin, artistLogout, updateStaffProfile,
      assignTable, freeTable, reserveTable, extendSession, addTable, updateTable, toggleTableActive, deleteTable,
      addOrderToTable, removeOrderFromTable,
      addToQueue, removeFromQueue, callQueueItem,
      addReservation, updateReservationStatus, cancelReservation, updateDownPayment, updateBalance,
      addFeedback, addActivity,
      addPromoCode, togglePromoCode, deletePromoCode, applyPromoCode,
      addTattooReservation, updateTattooReservationStatus, updateTattooDepositPaid,
      rescheduleTattooReservation, confirmReschedule,
      addTattooArtist, updateTattooArtist, deleteTattooArtist, updateTattooArtistUnavailableDates,
      addStaffUser, updateStaffUser, resetStaffUserPassword, toggleStaffUserActive,
      updateRates, updateReservationTerms,
      addAnnouncement, updateAnnouncement, deleteAnnouncement, toggleAnnouncement,
      addClosedDate, removeClosedDate, updateClosedDate, updateSiteSettings,
      refreshData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
}