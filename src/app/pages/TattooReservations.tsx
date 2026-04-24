import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { format } from 'date-fns';
import { Search, Calendar, Clock, User, Phone } from 'lucide-react';

export function TattooReservationsPage() {
  const { tattooReservations, updateTattooReservationStatus } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = (tattooReservations || []).filter(r =>
    r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.artistName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Tattoo Reservations</h2>
          <p className="text-sm text-neutral-400">Manage client bookings and deposits.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
          <input
            type="text"
            placeholder="Search by client or artist..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white focus:border-violet-500 focus:outline-none w-full md:w-64"
          />
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-950/50 text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="p-4 font-semibold">Date & Time</th>
                <th className="p-4 font-semibold">Client</th>
                <th className="p-4 font-semibold">Artist</th>
                <th className="p-4 font-semibold">Details</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-neutral-500">No reservations found.</td></tr>
              ) : (
                filtered.map(res => (
                  <tr key={res.id} className="hover:bg-neutral-800/20">
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-white font-medium"><Calendar size={14} className="text-violet-400"/> {format(new Date(res.date), 'MMM d, yyyy')}</span>
                        <span className="flex items-center gap-1.5 text-neutral-400"><Clock size={14}/> {res.timeSlot}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-white"><User size={14} className="text-neutral-500"/> {res.customerName}</span>
                        <span className="flex items-center gap-1.5 text-neutral-400"><Phone size={14}/> {res.contactNumber}</span>
                      </div>
                    </td>
                    <td className="p-4 text-neutral-300">{res.artistName}</td>
                    <td className="p-4">
                      <p className="text-white">{res.placement}</p>
                      <p className="text-xs text-neutral-500">{res.estimatedSize}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${
                        res.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        res.status === 'confirmed' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                        res.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {res.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        value={res.status}
                        onChange={(e) => updateTattooReservationStatus(res.id, e.target.value as any)}
                        className="bg-neutral-950 border border-neutral-700 text-neutral-300 text-xs rounded-lg px-2 py-1.5 focus:border-violet-500 focus:outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}