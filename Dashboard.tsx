import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Route, StatusUpdate, Stop } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Bus, MapPin, AlertTriangle, CheckCircle, Navigation, Clock, User, ArrowLeft, Send, ThumbsUp, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import BusRouteLine from './BusRouteLine';

export default function Dashboard() {
  const { profile, user, refreshProfile } = useAuth();
  const [route, setRoute] = useState<Route | null>(null);
  const [latestUpdate, setLatestUpdate] = useState<StatusUpdate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPinging, setIsPinging] = useState(false);
  const [isSafe, setIsSafe] = useState(false);

  useEffect(() => {
    if (!profile?.selectedRouteId) return;

    // Fetch route details
    const routeRef = doc(db, 'routes', profile.selectedRouteId);
    getDoc(routeRef).then((snap) => {
      if (snap.exists()) {
        setRoute(snap.data() as Route);
      }
      setLoading(false);
    });

    // Sub to updates
    const updatesRef = collection(db, 'routes', profile.selectedRouteId, 'updates');
    const q = query(updatesRef, orderBy('timestamp', 'desc'), limit(1));

    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setLatestUpdate(snap.docs[0].data() as StatusUpdate);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `routes/${profile.selectedRouteId}/updates`);
    });

    return () => unsubscribe();
  }, [profile?.selectedRouteId]);

  const changeRoute = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { selectedRouteId: null });
      await refreshProfile();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handlePing = async (stopId: string, type: 'ping' | 'breakdown' = 'ping') => {
    if (!profile?.selectedRouteId || !user) return;
    setIsPinging(true);
    try {
      const updatesRef = collection(db, 'routes', profile.selectedRouteId, 'updates');
      const id = doc(updatesRef).id;
      await addDoc(updatesRef, {
        id,
        stopId,
        type,
        timestamp: serverTimestamp(),
        reporterId: user.uid,
        reporterName: profile.displayName,
      });
      // Simple feedback
      setTimeout(() => setIsPinging(false), 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `routes/${profile.selectedRouteId}/updates`);
      setIsPinging(false);
    }
  };

  const etas = useMemo(() => {
    if (!route || !latestUpdate) return {};
    const currentStopIdx = route.stops.findIndex(s => s.id === latestUpdate.stopId);
    if (currentStopIdx === -1) return {};

    const res: Record<string, number> = {};
    let runningTotal = 0;
    
    // Calculate for subsequent stops
    for (let i = currentStopIdx; i < route.stops.length - 1; i++) {
       const stop = route.stops[i];
       runningTotal += stop.avgTimeToNext || 0;
       res[route.stops[i+1].id] = runningTotal;
    }
    return res;
  }, [route, latestUpdate]);

  if (loading || !route) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Bus className="text-orange-500 animate-bounce" size={48} />
        <p className="text-gray-400 font-medium">Connecting to route data...</p>
      </div>
    );
  }

  const currentStop = route.stops.find(s => s.id === latestUpdate?.stopId) || route.stops[0];

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
        <button 
          onClick={changeRoute}
          className="flex items-center gap-2 text-natural-muted hover:text-natural-primary transition-colors font-bold text-[10px] uppercase tracking-widest group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Change Route
        </button>
        <div className="sm:text-right">
           <h2 className="text-4xl font-serif font-bold text-natural-primary tracking-tight italic">{route.name}</h2>
           <p className="text-[10px] font-black text-natural-muted uppercase tracking-[0.3em]">{route.origin} → {route.destination}</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Route Tracking & Action Hub */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
          {/* Main Status Card */}
          <section className="bg-white rounded-[40px] p-10 shadow-sm border border-natural-border relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-10">
                 <span className="px-4 py-1.5 bg-natural-tag-bg text-natural-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-natural-border shadow-sm">Live Status</span>
                 {latestUpdate && (
                   <span className="text-xs font-medium text-natural-muted">
                     Last Ping: <span className="text-natural-text font-bold">
                       {Math.floor((Date.now() - latestUpdate.timestamp?.toDate().getTime()) / 60000)} mins ago
                     </span> by <span className="font-bold text-natural-primary italic">{latestUpdate.reporterName.split(' ')[0]}</span>
                   </span>
                 )}
              </div>

              <div className="mb-10">
                <h3 className="text-7xl sm:text-8xl font-serif text-natural-primary font-bold italic mb-4">
                  {Object.values(etas)[0] || 12} <span className="text-2xl not-italic text-natural-muted uppercase tracking-widest font-black ml-2">mins away</span>
                </h3>
                <p className="text-xl text-natural-muted max-w-xl leading-relaxed">
                  The bus just passed <span className="font-serif italic text-natural-text font-bold leading-none">{currentStop?.name || "Main Market"}</span>. 
                  Traffic is <span className="text-green-600 font-bold italic">flowing smooth</span>.
                </p>
              </div>
            </div>
            
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-natural-bg rounded-full opacity-50 group-hover:scale-110 transition-transform duration-1000 ease-in-out" />
          </section>

          {/* Route Progress section (Moved from original component structure into its own card) */}
          <section className="bg-white rounded-[40px] p-10 shadow-sm border border-natural-border flex flex-col h-full">
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-natural-muted font-black mb-12">Route Progress</h3>
            
            <BusRouteLine 
              route={route} 
              latestUpdate={latestUpdate} 
              etas={etas}
            />

            <div className="mt-20 pt-8 border-t border-natural-bg flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-natural-tag-bg flex items-center justify-center text-natural-primary">
                    <Clock size={20} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-natural-muted tracking-widest">Expected at Stop</p>
                    <p className="text-lg font-serif italic font-bold">
                       {latestUpdate 
                         ? new Date(latestUpdate.timestamp.toDate().getTime() + (Object.values(etas)[0] || 0) * 60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                         : "08:42 AM"}
                    </p>
                 </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-natural-tag-bg rounded-full border border-natural-border">
                <span className="w-2 h-2 rounded-full bg-natural-primary animate-pulse"></span>
                <span className="text-[10px] uppercase font-black tracking-widest text-natural-primary">Real-time Tracking Active</span>
              </div>
            </div>
          </section>

          {/* Action Hub - Grid style */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
             <button
                disabled={isPinging}
                onClick={() => handlePing(currentStop.id)}
                className="group relative w-full bg-natural-primary hover:bg-[#4A4A35] text-white rounded-[32px] p-10 flex flex-col items-center justify-center gap-6 transition-all shadow-2xl shadow-natural-primary/20 active:scale-95 overflow-hidden"
              >
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform">
                  <Bus size={32} />
                </div>
                <div className="text-center">
                  <span className="text-2xl font-serif italic font-bold block mb-1">I saw the Bus!</span>
                  <span className="text-xs opacity-60 uppercase font-black tracking-widest">Tap to Ping for everyone</span>
                </div>
                {/* Decorative circle */}
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/5 rounded-full" />
              </button>

              <div className="flex flex-col gap-4">
                <button
                  disabled={isPinging}
                  onClick={() => handlePing(currentStop.id, 'breakdown')}
                  className="w-full bg-natural-accent hover:bg-[#C26A45] text-white rounded-[24px] p-6 flex items-center gap-5 transition-all shadow-xl shadow-natural-accent/10 active:scale-[0.98] border border-white/10"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-serif italic text-xl font-bold">Breakdown</p>
                    <p className="text-[10px] opacity-80 uppercase font-black tracking-widest">Report Route Issue</p>
                  </div>
                </button>

                <div className="flex-1 bg-natural-card-bg rounded-[32px] p-8 border border-natural-border flex flex-col justify-between">
                   <div>
                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-natural-muted mb-6">Safety Dashboard</h4>
                     <div className="space-y-4">
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-natural-primary shadow-sm"></div>
                           <p className="text-xs font-bold text-natural-text uppercase tracking-wider">42 students active</p>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-natural-primary shadow-sm"></div>
                           <p className="text-xs font-bold text-natural-text uppercase tracking-wider">District Admin: 1091</p>
                        </div>
                     </div>
                   </div>
                   <button 
                      onClick={() => setIsSafe(!isSafe)}
                      className={cn(
                        "mt-8 w-full rounded-full py-4 font-black flex items-center justify-center gap-2 transition-all uppercase tracking-[0.2em] text-xs shadow-sm",
                        isSafe 
                          ? "bg-green-600 text-white shadow-green-500/20" 
                          : "bg-white text-natural-primary border-2 border-natural-primary hover:bg-natural-primary hover:text-white"
                      )}
                    >
                      {isSafe ? <CheckCircle size={18} /> : <Navigation size={18} />}
                      {isSafe ? "Reached Safely" : "Safe-Reach"}
                   </button>
                </div>
              </div>
          </section>
        </div>

        {/* Right Column: Feed / Notifications */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
          <div className="bg-white p-10 rounded-[40px] shadow-sm border border-natural-border min-h-[400px] flex flex-col">
             <h3 className="text-[10px] uppercase tracking-[0.3em] text-natural-muted font-black mb-8">Live Feed</h3>
             <div className="flex-1 space-y-10">
                {latestUpdate ? (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-5"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border",
                      latestUpdate.type === 'breakdown' ? 'bg-natural-accent/10 border-natural-accent/20 text-natural-accent' : 'bg-natural-tag-bg border-natural-border text-natural-primary'
                    )}>
                      {latestUpdate.type === 'breakdown' ? <AlertTriangle size={20} /> : <ThumbsUp size={20} />}
                    </div>
                    <div>
                       <p className="text-sm font-bold text-natural-text leading-tight mb-1">
                         {latestUpdate.reporterName.split(' ')[0]} {latestUpdate.type === 'breakdown' ? 'reported a breakdown' : 'pinged the bus'}
                       </p>
                       <p className="text-xs font-medium text-natural-muted">at <span className="text-natural-text font-bold italic font-serif leading-none">{route.stops.find(s => s.id === latestUpdate.stopId)?.name}</span></p>
                       <p className="text-[10px] font-black uppercase text-natural-muted/50 mt-4 tracking-widest">{latestUpdate.timestamp?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 text-center opacity-40">
                    <div className="w-16 h-16 bg-natural-tag-bg rounded-full flex items-center justify-center mb-4">
                       <Navigation size={32} className="text-natural-muted" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">No activity yet</p>
                  </div>
                )}
             </div>
             
             {/* Simple stats footer in sidebar */}
             <div className="mt-10 pt-8 border-t border-natural-bg">
                <div className="flex justify-between items-center opacity-60">
                   <span className="text-[8px] font-black uppercase tracking-widest">Offline Maps Ready</span>
                   <span className="w-1 h-1 bg-natural-border rounded-full" />
                   <span className="text-[8px] font-black uppercase tracking-widest">v1.2 Stable</span>
                </div>
             </div>
          </div>

          {/* Impact goal card */}
          <div className="bg-natural-primary text-white p-10 rounded-[40px] shadow-2xl shadow-natural-primary/20 overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-[2000ms] ease-in-out pointer-events-none">
               <Bus size={200} />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-6 italic">Support Network</p>
             <h4 className="text-2xl font-serif font-bold italic mb-6 leading-tight">Educational Access Project</h4>
             <p className="text-white/70 text-sm leading-relaxed mb-8">
                Your pings help prevent classmates from missing exams and classes. Every update matters.
             </p>
             <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-natural-primary bg-natural-tag-bg flex items-center justify-center overflow-hidden">
                    <div className="text-[10px] font-black text-natural-primary">S{i}</div>
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-natural-primary bg-white/10 backdrop-blur-sm flex items-center justify-center text-[10px] font-black text-white">
                  +12
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
