import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bus, Clock } from 'lucide-react';
import { Route, StatusUpdate } from '../types';
import { cn } from '../lib/utils';

interface BusRouteLineProps {
  route: Route;
  latestUpdate: StatusUpdate | null;
  etas: Record<string, number>;
}

export default function BusRouteLine({ route, latestUpdate, etas }: BusRouteLineProps) {
  const currentStopIdx = latestUpdate 
    ? route.stops.findIndex(s => s.id === latestUpdate.stopId)
    : -1;

  return (
    <div className="relative pt-16 pb-12 px-6 sm:px-12">
      {/* The Base Line */}
      <div className="absolute top-1/2 left-6 right-6 h-1.5 bg-natural-tag-bg -translate-y-1/2 rounded-full overflow-hidden border border-natural-border/50">
        {/* Progress Fill */}
        <motion.div
           initial={{ width: '0%' }}
           animate={{ 
             width: currentStopIdx === -1 
               ? '0%' 
               : `${(currentStopIdx / (route.stops.length - 1)) * 100}%` 
           }}
           className="h-full bg-natural-primary rounded-full shadow-sm"
           transition={{ type: 'spring', stiffness: 50, damping: 20 }}
        />
      </div>

      {/* Stops */}
      <div className="relative flex justify-between h-8 items-center">
        {route.stops.map((stop, index) => {
          const isPassed = index <= currentStopIdx;
          const isCurrent = index === currentStopIdx;
          const isNext = index === currentStopIdx + 1;
          const eta = etas[stop.id];

          return (
            <div key={stop.id} className="relative flex flex-col items-center">
              {/* Stop Indicator */}
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.5 : isPassed ? 1.2 : 1,
                  backgroundColor: isPassed ? '#5A5A40' : '#E0E0D6',
                  borderColor: isPassed ? '#EBEBE0' : '#F5F5F0',
                }}
                className={cn(
                  "w-4 h-4 rounded-full border-2 z-10 transition-colors shadow-sm",
                  isCurrent && "border-white ring-4 ring-natural-primary/10 shadow-lg"
                )}
              />

              {/* Bus Icon */}
              <AnimatePresence>
                {isCurrent && (
                  <motion.div
                    layoutId="bus-icon"
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: -50, opacity: 1 }}
                    exit={{ y: -30, opacity: 0 }}
                    className="absolute z-20 text-white bg-natural-primary p-2 rounded-xl shadow-xl shadow-natural-primary/20 border border-white/20"
                  >
                    <Bus size={20} />
                    {/* Tooltip triangle */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-natural-primary rotate-45" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stop Info */}
              <div className="absolute top-10 flex flex-col items-center min-w-[100px] text-center">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest leading-tight transition-colors",
                  isPassed ? "text-natural-text" : "text-natural-muted/60"
                )}>
                  {stop.name}
                </span>
                
                {isPassed && isCurrent && (
                   <span className="text-[8px] font-black uppercase text-natural-primary mt-2 animate-pulse tracking-[0.2em] bg-natural-tag-bg px-2 py-0.5 rounded-full border border-natural-border">
                     Live
                   </span>
                )}

                {isNext && eta !== undefined && (
                  <motion.span 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1 text-[9px] font-black text-natural-accent mt-2 bg-natural-accent/5 px-2 py-1 rounded-full border border-natural-accent/10 uppercase tracking-widest"
                  >
                    <Clock size={10} />
                    {eta}m
                  </motion.span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
