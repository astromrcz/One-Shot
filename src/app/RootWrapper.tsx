import { Outlet } from 'react-router';
import { AppProvider, useAppContext } from './context/AppContext';
import { Toaster } from "sonner";
import { motion } from 'framer-motion';

function RootContent() {
  const { loading } = useAppContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white overflow-hidden">
        <div className="text-center flex flex-col items-center">
          
          {/* Billiards Animation Container */}
          <div className="relative w-64 h-16 flex items-center mb-2">
            
            {/* Cue Stick (Wood body, brass ring, white ferrule, blue chalk tip) */}
            <motion.div
              className="absolute left-4 w-32 h-1.5 flex rounded-full overflow-hidden shadow-lg z-10"
              animate={{
                x: [0, -30, 16, 16, 0], // Rest -> Pull back -> Strike -> Hold -> Reset
                opacity: [0, 1, 1, 0, 0]
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                times: [0, 0.3, 0.4, 0.8, 1],
                ease: "easeInOut"
              }}
            >
              <div className="w-[75%] bg-amber-900" />
              <div className="w-[5%] bg-amber-400" />
              <div className="w-[15%] bg-neutral-200" />
              <div className="w-[5%] bg-blue-500" />
            </motion.div>
            
            {/* Cue Ball */}
            <motion.div
              className="absolute left-40 w-5 h-5 bg-neutral-100 rounded-full shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.4)] z-20 flex items-center justify-center"
              animate={{
                x: [0, 0, 0, 120, 0], // Wait -> Get hit -> Roll away -> Reset
                opacity: [0, 1, 1, 0, 0],
                rotate: [0, 0, 0, 360, 0]
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                times: [0, 0.3, 0.4, 0.8, 1],
                ease: "easeOut" // Smooth rolling physics
              }}
            >
              {/* Little detail dot on the cue ball to show it spinning */}
              <div className="w-1 h-1 bg-neutral-300 rounded-full translate-x-1 translate-y-1" />
            </motion.div>
          </div>

          <h2 className="text-lg font-bold tracking-widest uppercase text-neutral-200">One Shot</h2>
          <p className="text-xs text-neutral-500 tracking-widest uppercase mt-1 animate-pulse">Chalking the cue...</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

export function RootWrapper() {
  return (
    <AppProvider>
      <RootContent />
      <Toaster 
        theme="dark"
        position="top-center" 
        expand={true} 
        richColors 
        closeButton 
        toastOptions={{ 
          className: 'toast-with-progress',
          duration: 4000
        }} 
      />
    </AppProvider>
  );
}