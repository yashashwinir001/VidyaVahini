import { Timestamp } from 'firebase/firestore';

export interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  stops: Stop[];
}

export interface Stop {
  id: string;
  name: string;
  order: number;
  avgTimeToNext?: number; // in minutes
}

export interface StatusUpdate {
  id: string;
  stopId: string;
  timestamp: Timestamp;
  type: 'ping' | 'breakdown';
  reporterId: string;
  reporterName: string;
  message?: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  selectedRouteId?: string;
}
