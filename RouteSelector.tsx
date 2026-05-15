import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Route } from '../types';
import { motion } from 'motion/react';
import { MapPin, ChevronRight, Search, Navigation } from 'lucide-react';
import { cn } from '../lib/utils';

export default function RouteSelector() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, refreshProfile } = useAuth();

  const mockRoutes: Route[] = [
    {
      id: "rural-exp-01",
      name: "Tiptur-Arasikere Express (Student Bus)",
      origin: "Tiptur Bus Stand",
      destination: "Arasikere Govt College",
      stops: [
        { id: "s1", name: "Tiptur Stand", order: 0, avgTimeToNext: 15 },
        { id: "s2", name: "Kere Kodi Bridge", order: 1, avgTimeToNext: 12 },
        { id: "s3", name: "Hosahalli Junction", order: 2, avgTimeToNext: 10 },
        { id: "s4", name: "Banashankari Temple", order: 3, avgTimeToNext: 8 },
        { id: "s5", name: "Arasikere College", order: 4 }
      ]
    },
    {
      id: "shivamogga-van-02",
      name: "Shivamogga-Bhadravathi Van-02",
      origin: "Shivamogga Main Market",
      destination: "Bhadravathi High School",
      stops: [
        { id: "s1", name: "Main Market", order: 0, avgTimeToNext: 8 },
        { id: "s2", name: "Old Railway Crossing", order: 1, avgTimeToNext: 10 },
        { id: "s3", name: "Factory Bypass", order: 2, avgTimeToNext: 15 },
        { id: "s4", name: "High School Gate", order: 3 }
      ]
    }
  ];

  useEffect(() => {
    async function fetchRoutes() {
      try {
        const snap = await getDocs(collection(db, 'routes'));
        if (snap.empty) {
          // SEEDING for demo
          for (const r of mockRoutes) {
            await setDoc(doc(db, 'routes', r.id), r);
          }
          setRoutes(mockRoutes);
        } else {
          setRoutes(snap.docs.map(d => d.data() as Route));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'routes');
      } finally {
        setLoading(false);
      }
    }
    fetchRoutes();
  }, []);

  const selectRoute = async (routeId: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { selectedRouteId: routeId });
      await refreshProfile();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const filteredRoutes = routes.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-serif font-bold mb-3 text-natural-primary italic">
           Select Your Route
        </h2>
        <p className="text-natural-muted font-medium uppercase tracking-widest text-[10px]">Choose the college bus or school van you travel in every day</p>
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-natural-muted">
          <Search size={20} />
        </div>
        <input
          type="text"
          placeholder="Search by college name or route..."
          className="w-full bg-white border border-natural-border rounded-[24px] py-5 pl-14 pr-6 focus:ring-2 focus:ring-natural-primary/20 focus:border-natural-primary outline-none transition-all shadow-sm text-lg font-serif italic"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-28 bg-white/50 rounded-[32px] border border-natural-border animate-pulse" />
          ))
        ) : filteredRoutes.length > 0 ? (
          filteredRoutes.map((route, idx) => (
            <motion.button
              key={route.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => selectRoute(route.id)}
              className="w-full bg-white border border-natural-border p-6 rounded-[32px] flex items-center justify-between group hover:border-natural-primary hover:shadow-xl hover:shadow-natural-primary/5 transition-all text-left active:scale-[0.98]"
            >
              <div className="flex gap-5">
                <div className="w-14 h-14 bg-natural-tag-bg rounded-2xl flex items-center justify-center text-natural-muted group-hover:bg-natural-primary group-hover:text-white transition-all shadow-inner">
                  <Navigation size={28} />
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="font-serif text-xl font-bold text-natural-text group-hover:text-natural-primary transition-colors leading-tight italic">{route.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-natural-muted uppercase font-black tracking-widest">{route.origin}</span>
                    <div className="w-1 h-1 bg-natural-border rounded-full" />
                    <span className="text-[10px] text-natural-muted uppercase font-black tracking-widest">{route.destination}</span>
                  </div>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full border border-natural-border flex items-center justify-center group-hover:bg-natural-primary group-hover:border-natural-primary transition-all">
                <ChevronRight size={18} className="text-natural-muted group-hover:text-white transition-all" />
              </div>
            </motion.button>
          ))
        ) : (
          <div className="text-center py-20 bg-white/20 rounded-[32px] border border-dashed border-natural-border">
            <p className="text-natural-muted font-serif italic text-lg">No routes found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
