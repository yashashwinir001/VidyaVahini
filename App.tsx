import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bus, MapPin, AlertTriangle, CheckCircle, Navigation, LogOut, ChevronRight, User as UserIcon } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { signIn, logOut, testConnection } from './lib/firebase';
import RouteSelector from './components/RouteSelector';
import Dashboard from './components/Dashboard';

function AppContent() {
  const { user, profile, loading } = useAuth();

  React.useEffect(() => {
    testConnection();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-[#4a4a4a]"
        >
          <Bus size={48} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text font-sans selection:bg-orange-100">
      {/* Header */}
      <header className="bg-white border-b border-natural-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-serif text-natural-primary font-bold tracking-tight italic">Vidya-Vahini</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-natural-muted font-bold">Student Commute Buddy</p>
            </div>
          </div>

          {user ? (
            <div className="flex items-center gap-4">
               <div className="hidden sm:block text-right">
                <p className="text-sm font-bold text-natural-text">{profile?.displayName}</p>
                <button 
                  onClick={logOut}
                  className="text-[10px] text-natural-muted font-black uppercase tracking-widest hover:text-red-500 transition-colors"
                >
                  Sign Out
                </button>
              </div>
              <div className="w-10 h-10 rounded-full bg-natural-primary border-2 border-white shadow-md flex items-center justify-center overflow-hidden text-white font-bold">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" referrerPolicy="no-referrer" />
                ) : (
                  profile?.displayName?.charAt(0).toUpperCase() || 'S'
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={signIn}
              className="bg-natural-primary text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-opacity-90 transition-all active:scale-95 shadow-lg shadow-natural-primary/20"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 pb-24">
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.section
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-24 h-24 bg-natural-primary text-white rounded-[32px] flex items-center justify-center mb-8 rotate-3 shadow-2xl shadow-natural-primary/20">
                <Bus size={48} />
              </div>
              <h2 className="text-5xl sm:text-7xl font-serif text-natural-primary font-bold tracking-tight mb-6 leading-tight max-w-2xl italic">
                Never miss your bus <br /> 
                <span className="text-natural-muted opacity-50">shared by students</span>
              </h2>
              <p className="text-lg text-natural-muted mb-12 max-w-md bg-white p-6 rounded-[24px] shadow-sm border border-natural-border">
                A crowdsourced status tracker for student-specific routes. See where the bus is, real-time.
              </p>
              <button
                onClick={signIn}
                className="bg-natural-primary text-white px-10 py-5 rounded-[24px] font-bold text-xl hover:bg-opacity-90 transition-all shadow-xl shadow-natural-primary/20 active:scale-95"
              >
                Get Started
              </button>
            </motion.section>
          ) : !profile?.selectedRouteId ? (
            <motion.section
              key="route-selector"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <RouteSelector />
            </motion.section>
          ) : (
            <motion.section
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Dashboard />
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Meta */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 pointer-events-none sm:relative sm:pointer-events-auto">
        <div className="max-w-7xl mx-auto flex justify-center">
           <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-full py-2 px-6 flex items-center gap-4 shadow-2xl shadow-black/5">
             <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-green-600">
               <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
               Live Updates Active
             </span>
             <span className="w-px h-3 bg-gray-200" />
             <p className="text-[10px] text-gray-400 font-medium">Vidya-Vahini v1.0</p>
           </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
