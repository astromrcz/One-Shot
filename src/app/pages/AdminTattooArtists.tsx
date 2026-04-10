import { useState } from 'react';
import { useAppContext, TattooArtist } from '../context/AppContext';
import {
  Plus, X, Pencil, Trash2, Palette, ToggleLeft, ToggleRight,
  CheckCircle, Phone, Mail, CalendarX2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns';

type FormState = Omit<TattooArtist, 'id' | 'unavailableDates'>;
const blank: FormState = { name: '', specialty: '', contactNumber: '', email: '', bio: '', isAvailableToday: true, isActive: true };

function UnavailabilityCalendar({ artist, onClose }: { artist: TattooArtist; onClose: () => void }) {
  const { updateTattooArtistUnavailableDates } = useAppContext();
  const [month, setMonth] = useState(new Date());
  const [dates, setDates] = useState<string[]>(artist.unavailableDates ?? []);

  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end   = endOfWeek(endOfMonth(month),     { weekStartsOn: 0 });
  const days  = eachDayOfInterval({ start, end });

  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

  const toggle = (d: Date) => {
    const key = fmt(d);
    setDates(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]);
  };

  const handleSave = () => {
    updateTattooArtistUnavailableDates(artist.id, dates);
    onClose();
  };

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-neutral-950 border border-amber-900/30 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
              <CalendarX2 size={14} className="text-rose-400" /> Unavailability Calendar
            </h2>
            <p className="text-xs text-neutral-500">{artist.name} · click dates to toggle</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg"><X size={14} /></button>
        </div>

        <div className="p-4">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setMonth(m => subMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors">
              <ChevronLeft size={15} />
            </button>
            <p className="text-sm font-semibold text-neutral-200">{format(month, 'MMMM yyyy')}</p>
            <button onClick={() => setMonth(m => addMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors">
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] text-neutral-600 font-semibold py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {days.map(day => {
              const key = fmt(day);
              const inMonth    = isSameMonth(day, month);
              const blocked    = dates.includes(key);
              const todayMark  = isToday(day);
              return (
                <button
                  key={key}
                  onClick={() => inMonth && toggle(day)}
                  disabled={!inMonth}
                  className={`h-8 w-full rounded-lg text-xs font-semibold transition-all
                    ${!inMonth ? 'text-neutral-800 cursor-default' :
                      blocked ? 'bg-rose-600/80 text-white border border-rose-500' :
                      todayMark ? 'bg-amber-600/20 border border-amber-600/40 text-amber-400 hover:bg-rose-600/30' :
                      'text-neutral-400 hover:bg-rose-600/20 hover:text-rose-300 border border-transparent'
                    }`}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 text-[10px] text-neutral-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-600/80 inline-block" /> Unavailable</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-600/20 border border-amber-600/40 inline-block" /> Today</span>
            <span className="ml-auto text-amber-500 font-semibold">{dates.length} blocked</span>
          </div>

          {/* Clear */}
          {dates.length > 0 && (
            <button onClick={() => setDates([])} className="mt-2 w-full text-xs text-neutral-600 hover:text-rose-400 transition-colors py-1">
              Clear all blocked dates
            </button>
          )}
        </div>

        <div className="px-4 pb-4 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-xl transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminTattooArtists() {
  const { tattooArtists, addTattooArtist, updateTattooArtist, deleteTattooArtist } = useAppContext();
  const [showForm, setShowForm]         = useState(false);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [form, setForm]                 = useState<FormState>(blank);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast]               = useState<string | null>(null);
  const [calendarArtist, setCalendarArtist] = useState<TattooArtist | null>(null);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const openAdd  = () => { setEditingId(null); setForm(blank); setShowForm(true); };
  const openEdit = (a: TattooArtist) => {
    setEditingId(a.id);
    setForm({ name: a.name, specialty: a.specialty, contactNumber: a.contactNumber, email: a.email || '', bio: a.bio || '', isAvailableToday: a.isAvailableToday, isActive: a.isActive });
    setShowForm(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.specialty) return;
    if (editingId) { updateTattooArtist(editingId, form); flash('Artist updated!'); }
    else { addTattooArtist({ ...form, unavailableDates: [] }); flash('Artist added!'); }
    setShowForm(false); setEditingId(null); setForm(blank);
  };

  const handleDelete = (id: string) => {
    deleteTattooArtist(id); setDeleteConfirm(null); flash('Artist removed.');
  };

  const active = tattooArtists.filter(a => a.isActive);
  const availableToday = tattooArtists.filter(a => a.isAvailableToday && a.isActive);

  return (
    <div className="space-y-5">
      {toast && (
        <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-700/40 text-emerald-400 text-sm px-4 py-3 rounded-xl">
          <CheckCircle size={14} /> {toast}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Artists',   value: tattooArtists.length, color: 'text-white' },
          { label: 'Active',          value: active.length,         color: 'text-pink-400' },
          { label: 'Available Today', value: availableToday.length, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-center">
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex justify-end">
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white text-sm px-4 py-2 rounded-xl font-semibold transition-all shadow-lg shadow-amber-900/30">
          <Plus size={15} /> Add Artist
        </button>
      </div>

      {/* Artist Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tattooArtists.length === 0 ? (
          <div className="col-span-2 bg-neutral-950 border border-neutral-800 rounded-xl p-12 text-center">
            <Palette size={32} className="mx-auto text-neutral-700 mb-3" />
            <p className="text-neutral-500">No tattoo artists yet</p>
          </div>
        ) : tattooArtists.map(a => (
          <div key={a.id} className={`bg-neutral-950 border rounded-xl p-5 ${a.isActive ? 'border-neutral-800' : 'border-neutral-800/40 opacity-60'}`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <Palette size={18} className="text-pink-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-100">{a.name}</p>
                  <p className="text-xs text-pink-400/80">{a.specialty}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(a)} className="p-1.5 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors">
                  <Pencil size={13} />
                </button>
                {/* Unavailability Calendar button */}
                <button
                  onClick={() => setCalendarArtist(a)}
                  title="Manage unavailable dates"
                  className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors"
                >
                  <CalendarX2 size={13} />
                </button>
                <button onClick={() => updateTattooArtist(a.id, { isAvailableToday: !a.isAvailableToday })}
                  title={a.isAvailableToday ? 'Mark unavailable today' : 'Mark available today'}
                  className="p-1.5 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors">
                  {a.isAvailableToday ? <ToggleRight size={18} className="text-emerald-400" /> : <ToggleLeft size={18} />}
                </button>
                {deleteConfirm === a.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDelete(a.id)} className="px-2 py-1 text-[10px] bg-rose-700 hover:bg-rose-600 text-white rounded-lg font-semibold">Yes</button>
                    <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-[10px] bg-neutral-800 text-neutral-400 rounded-lg">No</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(a.id)} className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            {a.bio && <p className="text-xs text-neutral-500 mb-3 leading-relaxed">{a.bio}</p>}

            <div className="flex items-center gap-3 text-xs text-neutral-600">
              {a.contactNumber && <span className="flex items-center gap-1"><Phone size={10} />{a.contactNumber}</span>}
              {a.email && <span className="flex items-center gap-1"><Mail size={10} />{a.email}</span>}
            </div>

            <div className="flex gap-2 mt-3 flex-wrap">
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-semibold ${a.isActive ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'bg-neutral-800 text-neutral-500 border-neutral-700'}`}>
                {a.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-semibold ${a.isAvailableToday ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-neutral-800 text-neutral-500 border-neutral-700'}`}>
                {a.isAvailableToday ? 'Available Today' : 'Unavailable Today'}
              </span>
              {(a.unavailableDates?.length ?? 0) > 0 && (
                <button
                  onClick={() => setCalendarArtist(a)}
                  className="text-[10px] px-2.5 py-0.5 rounded-full border font-semibold bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                >
                  <CalendarX2 size={9} className="inline mr-1" />
                  {a.unavailableDates!.length} blocked date{a.unavailableDates!.length !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-amber-900/30 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center flex-none">
              <div>
                <h2 className="text-base font-bold text-neutral-100">{editingId ? 'Edit Artist' : 'Add Tattoo Artist'}</h2>
                <p className="text-xs text-neutral-500">Artist profile information</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleSave} className="overflow-y-auto flex-1 p-6 space-y-4">
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block font-medium">Full Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required autoFocus
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-600/50 transition-colors placeholder-neutral-600" placeholder="Artist name" />
              </div>
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block font-medium">Specialty / Style *</label>
                <input type="text" value={form.specialty} onChange={e => setForm(f => ({...f, specialty: e.target.value}))} required
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-600/50 transition-colors placeholder-neutral-600" placeholder="e.g. Black & Grey / Realism" />
              </div>
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block font-medium">Contact Number</label>
                <input type="tel" value={form.contactNumber} onChange={e => setForm(f => ({...f, contactNumber: e.target.value}))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-600/50 transition-colors placeholder-neutral-600" placeholder="09XXXXXXXXX" />
              </div>
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block font-medium">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-600/50 transition-colors placeholder-neutral-600" placeholder="artist@oneshot.com" />
              </div>
              <div>
                <label className="text-xs text-neutral-400 mb-1.5 block font-medium">Bio / Description</label>
                <textarea value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))} rows={3}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-600/50 transition-colors placeholder-neutral-600 resize-none"
                  placeholder="Short artist bio..." />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-9 h-5 rounded-full relative transition-colors ${form.isAvailableToday ? 'bg-emerald-600' : 'bg-neutral-700'}`}
                    onClick={() => setForm(f => ({...f, isAvailableToday: !f.isAvailableToday}))}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isAvailableToday ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-xs text-neutral-400">Available Today</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className={`w-9 h-5 rounded-full relative transition-colors ${form.isActive ? 'bg-pink-600' : 'bg-neutral-700'}`}
                    onClick={() => setForm(f => ({...f, isActive: !f.isActive}))}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-xs text-neutral-400">Active</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-xl transition-colors">Cancel</button>
                <button type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-sm rounded-xl font-semibold py-2.5 flex items-center justify-center gap-2">
                  {editingId ? <><Pencil size={14} /> Save</> : <><Plus size={14} /> Add Artist</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unavailability Calendar Modal */}
      {calendarArtist && (
        <UnavailabilityCalendar
          artist={calendarArtist}
          onClose={() => setCalendarArtist(null)}
        />
      )}
    </div>
  );
}
