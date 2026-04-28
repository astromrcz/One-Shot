import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { format } from 'date-fns';
import { Search, Calendar, Clock, User, Phone, Receipt, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function TattooReservationsPage() {
  const { tattooReservations, updateTattooReservationStatus } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [receiptViewer, setReceiptViewer] = useState<{ url: string, ref: string, name: string } | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

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
                      {res.receiptUrl && (
                        <button
                          onClick={() => setReceiptViewer({ url: res.receiptUrl!, ref: res.paymentReference || '', name: res.customerName })}
                          className="mt-2 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-[10px] font-bold rounded border border-blue-700/30 transition-colors flex items-center gap-1 w-fit"
                        >
                          <Receipt size={10} /> View Receipt
                        </button>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${
                        res.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        res.status === 'confirmed' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' :
                        res.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        res.status === 'denied' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
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
                        <option value="denied">Denied</option> {/* 🚨 STEP 15: Added Denied */}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Viewer Modal */}
      <AnimatePresence>
        {receiptViewer && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => { setReceiptViewer(null); setIsZoomed(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-xl shadow-2xl flex flex-col max-h-[95vh]"
            >
              <div className="flex items-center justify-between mb-4 flex-none">
                <div>
                  <h3 className="text-lg font-bold text-white">GCash Receipt</h3>
                  <p className="text-xs text-neutral-500">{receiptViewer.name}</p>
                </div>
                <button onClick={() => { setReceiptViewer(null); setIsZoomed(false); }} className="text-neutral-600 hover:text-neutral-300">
                  <X size={18} />
                </button>
              </div>
              
              <div className={`relative w-full h-[70vh] min-h-[400px] max-h-[800px] bg-black rounded-lg border border-neutral-800 mb-4 flex ${isZoomed ? 'overflow-auto items-start p-0' : 'overflow-hidden items-center justify-center p-2'}`}>
                <img 
                  src={receiptViewer.url} 
                  alt="Receipt" 
                  onClick={() => setIsZoomed(!isZoomed)}
                  className={`transition-all duration-300 rounded mx-auto ${
                    isZoomed 
                      ? 'w-[200%] h-auto max-w-none cursor-zoom-out' 
                      : 'w-full h-full object-contain cursor-zoom-in'
                  }`}
                />
              </div>

              <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4 text-center flex-none">
                <p className="text-[10px] text-blue-500 uppercase tracking-widest font-semibold mb-1">Reference Number</p>
                <p className="text-lg font-mono font-bold text-blue-400">{receiptViewer.ref || 'N/A'}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}