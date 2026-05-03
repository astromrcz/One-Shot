import { Outlet } from 'react-router';
import { AppProvider, useAppContext } from './context/AppContext';
import { Toaster } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

// 🎱 The standard, reusable Billiards loading screen used everywhere
function SimpleBilliardsLoader() {
  return (
    <div className="text-center flex flex-col items-center">
      <div className="relative w-64 h-32 flex items-center justify-center mb-2">
        <div className="relative w-64 h-16 flex items-center">
          {/* Cue Stick */}
          <motion.div
            className="absolute left-4 w-32 h-1.5 flex rounded-full overflow-hidden shadow-lg z-10"
            animate={{ x: [0, -30, 16, 16, 0], opacity: [0, 1, 1, 0, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, times: [0, 0.3, 0.4, 0.8, 1], ease: "easeInOut" }}
          >
            <div className="w-[75%] bg-amber-900" />
            <div className="w-[5%] bg-amber-400" />
            <div className="w-[15%] bg-neutral-200" />
            <div className="w-[5%] bg-blue-500" />
          </motion.div>
          
          {/* Cue Ball */}
          <motion.div
            className="absolute left-40 w-5 h-5 bg-neutral-100 rounded-full shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.4)] z-20 flex items-center justify-center"
            animate={{ x: [0, 0, 0, 120, 0], opacity: [0, 1, 1, 0, 0], rotate: [0, 0, 0, 360, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, times: [0, 0.3, 0.4, 0.8, 1], ease: "easeOut" }}
          >
            <div className="w-1 h-1 bg-neutral-300 rounded-full translate-x-1 translate-y-1" />
          </motion.div>
        </div>
      </div>
      <h2 className="text-lg font-bold tracking-widest uppercase text-neutral-200">One Shot</h2>
      <p className="text-xs text-neutral-500 tracking-widest uppercase mt-1 animate-pulse">Chalking the cue...</p>
    </div>
  );
}

function RootContent() {
  const { loading } = useAppContext();

  // 🚨 CHECK: Has the user seen the cinematic intro today?
  const [hasSeenIntroToday] = useState(() => {
    const today = new Date().toDateString();
    return localStorage.getItem('one_shot_intro_date') === today;
  });

  const [displayState, setDisplayState] = useState<'loading' | 'slogan' | 'done'>('loading');
  const [animIndex, setAnimIndex] = useState(0);

  // Cinematic Intro: Swap between Billiards and Drinks every 2.5 seconds
  useEffect(() => {
    if (hasSeenIntroToday || displayState !== 'loading') return;
    const interval = setInterval(() => setAnimIndex(prev => (prev + 1) % 2), 2500);
    return () => clearInterval(interval);
  }, [hasSeenIntroToday, displayState]);

  // Cinematic Intro: Trigger the slogan when loading finishes
  useEffect(() => {
    if (!hasSeenIntroToday && !loading && displayState === 'loading') {
      setDisplayState('slogan');
    }
  }, [loading, displayState, hasSeenIntroToday]);

  // Cinematic Intro: Timer for the slogan
  useEffect(() => {
    if (displayState === 'slogan') {
      const timer = setTimeout(() => {
        // Save today's date so they don't see it again until tomorrow!
        localStorage.setItem('one_shot_intro_date', new Date().toDateString());
        setDisplayState('done');
      }, 2500); 
      return () => clearTimeout(timer);
    }
  }, [displayState]);


  // ── ROUTE 1: USER ALREADY SAW THE INTRO TODAY ──
  if (hasSeenIntroToday) {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white overflow-hidden">
          <SimpleBilliardsLoader />
        </div>
      );
    }
    return <Outlet />;
  }

  // ── ROUTE 2: FIRST TIME TODAY (PLAY FULL CINEMATIC SEQUENCE) ──
  if (displayState === 'done') {
    return <Outlet />;
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-neutral-950 text-white overflow-hidden">
      <AnimatePresence mode="wait">
        
        {/* PHASE 1: THE ANIMATIONS */}
        {displayState === 'loading' && (
          <motion.div
            key="loader-container"
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="text-center flex flex-col items-center"
          >
            <div className="relative w-64 h-32 flex items-center justify-center mb-2">
              <AnimatePresence mode="wait">
                {animIndex === 0 ? (
                  /* 🎱 BILLIARDS ANIMATION */
                  <motion.div
                    key="billiards"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="relative w-64 h-16 flex items-center">
                      <motion.div className="absolute left-4 w-32 h-1.5 flex rounded-full overflow-hidden shadow-lg z-10" animate={{ x: [0, -30, 16, 16, 0], opacity: [0, 1, 1, 0, 0] }} transition={{ duration: 1.8, repeat: Infinity, times: [0, 0.3, 0.4, 0.8, 1], ease: "easeInOut" }}>
                        <div className="w-[75%] bg-amber-900" /><div className="w-[5%] bg-amber-400" /><div className="w-[15%] bg-neutral-200" /><div className="w-[5%] bg-blue-500" />
                      </motion.div>
                      <motion.div className="absolute left-40 w-5 h-5 bg-neutral-100 rounded-full shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.4)] z-20 flex items-center justify-center" animate={{ x: [0, 0, 0, 120, 0], opacity: [0, 1, 1, 0, 0], rotate: [0, 0, 0, 360, 0] }} transition={{ duration: 1.8, repeat: Infinity, times: [0, 0.3, 0.4, 0.8, 1], ease: "easeOut" }}>
                        <div className="w-1 h-1 bg-neutral-300 rounded-full translate-x-1 translate-y-1" />
                      </motion.div>
                    </div>
                  </motion.div>
                ) : (
                  /* 🥂 CHAMPAGNE ANIMATION */
                  <motion.div
                    key="drinks"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <motion.div className="absolute flex flex-col items-center origin-bottom z-10" animate={{ x: [-30, -10, -30], rotate: [-15, 12, -15] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                        <div className="w-6 h-12 border-2 border-amber-100/50 rounded-b-full relative overflow-hidden flex items-end pb-1"><div className="w-full h-[70%] bg-amber-400/70 relative"><div className="absolute bottom-1 left-1 w-1 h-1 bg-white/80 rounded-full animate-[ping_1s_infinite]" /><div className="absolute bottom-3 right-1 w-1 h-1 bg-white/80 rounded-full animate-[ping_1.2s_infinite_0.2s]" /></div></div><div className="w-1 h-6 bg-amber-100/50" /><div className="w-5 h-1 bg-amber-100/50 rounded-t-sm" />
                      </motion.div>
                      <motion.div className="absolute flex flex-col items-center origin-bottom z-10" animate={{ x: [30, 10, 30], rotate: [15, -12, 15] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                        <div className="w-6 h-12 border-2 border-amber-100/50 rounded-b-full relative overflow-hidden flex items-end pb-1"><div className="w-full h-[70%] bg-amber-400/70 relative"><div className="absolute bottom-2 left-1 w-1 h-1 bg-white/80 rounded-full animate-[ping_1.1s_infinite]" /><div className="absolute bottom-1 right-1 w-1 h-1 bg-white/80 rounded-full animate-[ping_1.3s_infinite_0.4s]" /></div></div><div className="w-1 h-6 bg-amber-100/50" /><div className="w-5 h-1 bg-amber-100/50 rounded-t-sm" />
                      </motion.div>
                      <motion.div className="absolute top-8 w-6 h-6 bg-amber-200 rounded-full blur-[3px] z-20 mix-blend-screen" animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", times: [0, 0.5, 1] }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <h2 className="text-lg font-bold tracking-widest uppercase text-neutral-200">One Shot</h2>
            <p className="text-xs text-neutral-500 tracking-widest uppercase mt-1 transition-opacity duration-300">
              {animIndex === 0 ? 'Chalking the cue...' : 'Pouring the drinks...'}
            </p>
          </motion.div>
        )}

        {/* PHASE 2: THE SLOGAN */}
        {displayState === 'slogan' && (
          <motion.div
            key="slogan"
            initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 1.05, filter: "blur(4px)" }} transition={{ duration: 0.8, ease: "easeInOut" }}
            className="text-center px-4"
          >
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">
              All it takes is <span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">One Shot</span>
            </h1>
            <motion.div 
              initial={{ width: 0 }} animate={{ width: "6rem" }} transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
              className="h-1 bg-emerald-500 mx-auto rounded-full shadow-[0_0_10px_rgba(16,185,129,0.6)]" 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RootWrapper() {
  return (
    <AppProvider>
      <RootContent />
      {/* 🚨 FORCED HIGH Z-INDEX SO IT OVERLAYS ALL MODALS/SIDEBARS */}
      <Toaster 
        theme="dark"
        position="top-center" 
        expand={true} 
        richColors 
        closeButton 
        style={{ zIndex: 999999 }}
        toastOptions={{ 
          className: 'toast-with-progress',
          duration: 4000
        }} 
      />
    </AppProvider>
  );
}