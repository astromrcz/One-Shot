import { useAppContext } from '../context/AppContext';
import { 
  Clock, Filter, Search, CheckCircle, XCircle, Bell, Users, 
  Calendar, DollarSign, TableProperties, TrendingUp, 
  MessageSquare, Tag, Palette, ShieldAlert, Activity, Download // Added new icons
} from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { useState } from 'react';
import type { ActivityType } from '../context/AppContext';

const activityIcons: Record<ActivityType, { icon: any; color: string; bgColor: string }> = {
  table_assigned: { icon: TableProperties, color: 'text-emerald-400', bgColor: 'bg-emerald-500/15' },
  table_freed: { icon: CheckCircle, color: 'text-neutral-400', bgColor: 'bg-neutral-500/15' },
  table_reserved: { icon: Calendar, color: 'text-blue-400', bgColor: 'bg-blue-500/15' },
  session_extended: { icon: Clock, color: 'text-amber-400', bgColor: 'bg-amber-500/15' },
  queue_added: { icon: Users, color: 'text-purple-400', bgColor: 'bg-purple-500/15' },
  queue_removed: { icon: XCircle, color: 'text-rose-400', bgColor: 'bg-rose-500/15' },
  queue_called: { icon: Bell, color: 'text-amber-400', bgColor: 'bg-amber-500/15' },
  reservation_created: { icon: Calendar, color: 'text-emerald-400', bgColor: 'bg-emerald-500/15' },
  reservation_updated: { icon: TrendingUp, color: 'text-blue-400', bgColor: 'bg-blue-500/15' },
  payment_received: { icon: DollarSign, color: 'text-emerald-400', bgColor: 'bg-emerald-500/15' },
  reservation_cancelled: { icon: XCircle, color: 'text-rose-400', bgColor: 'bg-rose-500/15' },
  // Added missing types:
  feedback_received: { icon: MessageSquare, color: 'text-sky-400', bgColor: 'bg-sky-500/15' },
  promo_created: { icon: Tag, color: 'text-fuchsia-400', bgColor: 'bg-fuchsia-500/15' },
  tattoo_reservation_created: { icon: Palette, color: 'text-violet-400', bgColor: 'bg-violet-500/15' },
  admin_action: { icon: ShieldAlert, color: 'text-orange-400', bgColor: 'bg-orange-500/15' },
};

const formatTimestamp = (date: Date) => {
  if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`;
  if (isYesterday(date)) return `Yesterday, ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, h:mm a');
};

export function ActivityLog() {
  const { activities } = useAppContext();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');

  const filtered = activities.filter(a => {
    const matchSearch = !search || a.description.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || a.type === filterType;
    return matchSearch && matchType;
  });

  const activityTypes: Array<ActivityType | 'all'> = [
    'all', 'table_assigned', 'table_freed', 'reservation_created', 'reservation_updated',
    'payment_received', 'queue_added', 'reservation_cancelled', 'admin_action'
  ];

  const typeLabels: Record<ActivityType | 'all', string> = {
    all: 'All',
    table_assigned: 'Table Assigned',
    table_freed: 'Table Freed',
    table_reserved: 'Table Reserved',
    session_extended: 'Session Extended',
    queue_added: 'Queue Added',
    queue_removed: 'Queue Removed',
    queue_called: 'Queue Called',
    reservation_created: 'Reservation Created',
    reservation_updated: 'Reservation Updated',
    payment_received: 'Payment',
    reservation_cancelled: 'Cancelled',
    // Added missing labels:
    feedback_received: 'Feedback',
    promo_created: 'Promo Created',
    tattoo_reservation_created: 'Tattoo Booked',
    admin_action: 'Admin Action',
  };

  // Fulfills System Requirement REQ012
  const handleExportCSV = () => {
    if (!activities || activities.length === 0) return;
    
    const headers = "Date,Type,Description\n";
    const rows = activities.map(act => {
      const date = new Date(act.timestamp).toLocaleString().replace(/,/g, ''); 
      // Replace quotes in description to prevent CSV breaking
      const safeDesc = act.description.replace(/"/g, '""'); 
      return `"${date}","${act.type}","${safeDesc}"`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OneShot_Activity_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Activities', value: activities.length, color: 'text-blue-400' },
          { label: 'Today', value: activities.filter(a => isToday(a.timestamp)).length, color: 'text-emerald-400' },
          { label: 'Reservations', value: activities.filter(a => a.type.includes('reservation')).length, color: 'text-purple-400' },
          { label: 'Payments', value: activities.filter(a => a.type === 'payment_received').length, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search activities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-neutral-500 flex-none" />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as ActivityType | 'all')}
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            {activityTypes.map(type => (
              <option key={type} value={type}>{typeLabels[type] || 'Unknown'}</option>
            ))}
          </select>
          <button onClick={handleExportCSV} className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 px-3 py-2 rounded-lg text-sm transition-colors flex-none ml-2">
            <Download size={14} /> <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Clock size={32} className="mx-auto text-neutral-700 mb-3" />
            <p className="text-neutral-500">No activities found</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/50">
            {filtered.map((activity) => {
              // 🚨 THE FIX: Fallback to a generic icon if the type is unknown
              const config = activityIcons[activity.type] || { icon: Activity, color: 'text-neutral-400', bgColor: 'bg-neutral-800' };
              const Icon = config.icon;
              const label = typeLabels[activity.type] || 'Unknown Activity';
              
              return (
                <div key={activity.id} className="px-5 py-4 hover:bg-neutral-900/40 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center flex-none`}>
                      <Icon size={18} className={config.color} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-200 font-medium leading-relaxed">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-neutral-500">
                          {formatTimestamp(activity.timestamp)}
                        </span>
                        <span className="text-xs text-neutral-600">
                          ({formatDistanceToNow(activity.timestamp, { addSuffix: true })})
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-500 uppercase tracking-wider font-semibold flex-none">
                      {label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}