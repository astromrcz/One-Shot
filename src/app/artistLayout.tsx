import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { Palette, LogOut, CalendarX2 } from 'lucide-react';
import { useAppContext } from './context/AppContext';
import logoImg from '@/app/assets/40eb82831843e17a3c48a360fd80f0aaaa58ddc8.png';

export function ArtistLayout() {
  // 🚨 FIX 1: We must extract 'loading' from the context so the layout knows when to wait
  const { artistLoggedIn, artistLogout, currentArtistId, tattooArtists, tattooReservations, loading } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    // 🚨 FIX 2: Wait until loading is FALSE before we judge if they are logged in!
    // Also updated the redirect to '/' since we deleted the old login pages.
    if (!loading && !artistLoggedIn) {
      navigate('/', { replace: true });
    }
  }, [artistLoggedIn, loading, navigate]);

  // Show a blank screen while verifying credentials to prevent flickering
  if (loading || !artistLoggedIn) return null;

  const artist = tattooArtists.find(a => a.id === currentArtistId);
  const myPending = tattooReservations.filter(r => r.artistId === currentArtistId && r.status === 'pending').length;

  // 🚨 FIX 3: Update logout to redirect to the home page
  const handleLogout = () => { artistLogout(); navigate('/'); };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Top bar */}
      <header className="bg-neutral-900 border-b border-neutral-800 px-4 py-3 flex items-center justify-between flex-none">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="One Shot" className="h-7 object-contain" />
          <div className="h-5 w-px bg-neutral-700" />
          <div className="flex items-center gap-1.5">
            <Palette size={14} className="text-pink-400" />
            <span className="text-sm font-semibold text-pink-300">Artist Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {artist && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-xs font-bold text-pink-400">
                {artist.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-200 leading-none">{artist.name}</p>
                <p className="text-[10px] text-pink-400/70 leading-none mt-0.5">{artist.specialty}</p>
              </div>
            </div>
          )}
          {myPending > 0 && (
            <span className="bg-amber-500 text-black text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">{myPending}</span>
          )}
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg border border-neutral-800 hover:border-rose-900/50 transition-all">
            <LogOut size={13} /> Logout
          </button>
        </div>
      </header>

      {/* Artist info bar */}
      {artist && (
        <div className="bg-gradient-to-r from-pink-950/20 to-neutral-900/60 border-b border-pink-900/20 px-6 py-3 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-base font-black text-pink-400 flex-shrink-0">
            {artist.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-neutral-100">{artist.name}</p>
            <p className="text-xs text-pink-400/80">{artist.specialty}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${artist.isAvailableToday ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-neutral-800 text-neutral-500 border-neutral-700'}`}>
              {artist.isAvailableToday ? 'Available Today' : 'Unavailable Today'}
            </span>
            {(artist.unavailableDates?.length ?? 0) > 0 && (
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                <CalendarX2 size={9} /> {artist.unavailableDates!.length} blocked
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}