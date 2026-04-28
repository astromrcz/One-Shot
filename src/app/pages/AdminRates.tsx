import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { PhilippinePeso, Save, CheckCircle, Info, RefreshCw } from 'lucide-react'; // STEP 1

export function AdminRates() {
  const { rates, updateRates } = useAppContext();
  const [form, setForm] = useState({ ...rates });
  const [saved, setSaved] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false); // STEP 2
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateRates(form);
    setSaved(true);
    setConfirmSave(false);
    setIsSaving(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const NumField = ({ label, field, unit, hint }: {
    label: string; field: keyof typeof form; unit?: string; hint?: string;
  }) => (
    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
      <label className="block text-xs text-neutral-400 font-medium uppercase tracking-wider mb-3">{label}</label>
      <div className="flex items-center gap-3">
        {unit && <span className="text-neutral-500 text-sm font-semibold">{unit}</span>}
        {/* STEP 13: Changed type to text, stripped non-numbers, removed increment spinners */}
        <input
          type="text" value={form[field] as number}
          onChange={e => {
            const numericValue = e.target.value.replace(/[^0-9.]/g, '');
            setForm(f => ({ ...f, [field]: numericValue === '' ? 0 : parseFloat(numericValue) }));
          }}
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-600/50 focus:ring-1 focus:ring-amber-600/20 transition-colors"
        />
      </div>
      {hint && <p className="text-[10px] text-neutral-600 mt-2">{hint}</p>}
      <p className="text-lg font-black text-amber-400 mt-2">
        {typeof form[field] === 'number'
          ? (field === 'downPaymentPercent' ? `${form[field]}%` : `₱${(form[field] as number).toLocaleString()}`)
          : form[field] as string}
      </p>
    </div>
  );

  const TimeField = ({ label, field, hint }: { label: string; field: 'happyHourStart' | 'happyHourEnd'; hint?: string }) => (
    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
      <label className="block text-xs text-neutral-400 font-medium uppercase tracking-wider mb-3">{label}</label>
      <input
        type="time" value={form[field]}
        onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-amber-600/50 focus:ring-1 focus:ring-amber-600/20 transition-colors"
      />
      {hint && <p className="text-[10px] text-neutral-600 mt-2">{hint}</p>}
      <p className="text-lg font-black text-amber-400 mt-2">{form[field]}</p>
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      {saved && (
        <div className="flex items-center gap-2.5 bg-emerald-950/40 border border-emerald-700/40 text-emerald-400 text-sm px-4 py-3 rounded-xl">
          <CheckCircle size={15} /> Rates updated and applied!
        </div>
      )}

      <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4 flex items-start gap-3">
        <Info size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-600/80 leading-relaxed">
          Changes here update live rates for new sessions, reservation pricing calculations, and payment summaries across the entire system.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Table Rates */}
        <div>
          <h3 className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
            <PhilippinePeso size={12} className="text-amber-500" /> Table Rental Rates
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <NumField label="Standard Hourly Rate" field="hourlyRate" unit="₱" min={50} max={2000} step={25} hint="Applied to all regular table sessions" />
            <NumField label="Happy Hour Rate" field="happyHourRate" unit="₱" min={50} max={2000} step={25} hint="Applied during happy hour window (walk-in only)" />
            <NumField label="Overtime Rate" field="overtimeRate" unit="₱" min={50} max={2000} step={25} hint="Charged per hour beyond booked duration" />
          </div>
        </div>

        {/* Happy Hour Times */}
        <div>
          <h3 className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-3">Happy Hour Window</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TimeField label="Happy Hour Start" field="happyHourStart" hint="Walk-in sessions only during this window" />
            <TimeField label="Happy Hour End" field="happyHourEnd" />
          </div>
          <div className="mt-2 bg-neutral-950 border border-neutral-800 rounded-xl p-3">
            <p className="text-xs text-neutral-400">
              Current happy hour: <span className="text-amber-400 font-semibold">{form.happyHourStart} – {form.happyHourEnd}</span>
              &nbsp;· Rate: <span className="text-amber-400 font-semibold">₱{form.happyHourRate}/hr</span>
            </p>
          </div>
        </div>

        {/* Other Fees */}
        <div>
          <h3 className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-3">Bookings & Deposits</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NumField label="Reservation Down Payment %" field="downPaymentPercent" min={10} max={100} step={5} hint="Percentage of total reservation amount required upfront" />
            <NumField label="Tattoo Session Deposit" field="tattooDeposit" unit="₱" min={100} max={5000} step={100} hint="Fixed deposit required for all tattoo reservations" />
          </div>
        </div>

        {/* Rate Preview */}
        <div className="bg-neutral-950 border border-amber-900/30 rounded-xl p-5">
          <h3 className="text-xs text-neutral-500 uppercase tracking-widest font-semibold mb-4">Rate Preview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: '1-hour session', value: `₱${form.hourlyRate}` },
              { label: '2-hour session', value: `₱${form.hourlyRate * 2}` },
              { label: '3-hour session', value: `₱${form.hourlyRate * 3}` },
              { label: 'Happy hour (1hr)', value: `₱${form.happyHourRate}` },
            ].map(p => (
              <div key={p.label} className="bg-neutral-900 rounded-lg p-3 text-center">
                <p className="text-sm font-black text-amber-300">{p.value}</p>
                <p className="text-[10px] text-neutral-600 mt-1">{p.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* STEP 2: Double Click Confirmation */}
        <div className="flex gap-3">
          {confirmSave && (
            <button type="button" onClick={() => setConfirmSave(false)} disabled={isSaving}
              className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm rounded-xl font-semibold transition-colors">
              Cancel
            </button>
          )}
          {confirmSave ? (
            <button type="submit" disabled={isSaving}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-900/30 animate-pulse">
              {isSaving ? <RefreshCw size={15} className="animate-spin" /> : <><CheckCircle size={15} /> Confirm Rate Changes?</>}
            </button>
          ) : (
            <button type="button" onClick={() => setConfirmSave(true)}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-amber-900/30">
              <Save size={15} /> Save Rate Changes
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
