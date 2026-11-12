// src/app/models/location.model.ts

export enum LocationType {
  ROOM = 'ROOM',
  BUILDING = 'BUILDING',
  CAMPUS = 'CAMPUS',
  ONLINE = 'ONLINE'
}

export interface Location {
  id?: number;
  name: string;
  address: string;
  city: string;
  capacity: number;
  type: LocationType;
  platformUrl?: string; // URL de la plateforme pour les formations en ligne
}

// Labels pour l'affichage des types
export const LocationTypeLabels: Record<LocationType, string> = {
  [LocationType.ROOM]: 'Salle',
  [LocationType.BUILDING]: 'Bâtiment',
  [LocationType.CAMPUS]: 'Campus',
  [LocationType.ONLINE]: 'En ligne'
};

// Icônes pour les types
export const LocationTypeIcons: Record<LocationType, string> = {
  [LocationType.ROOM]: '🏢',
  [LocationType.BUILDING]: '🏛️',
  [LocationType.CAMPUS]: '🎓',
  [LocationType.ONLINE]: '💻'
};

// Couleurs pour les types
// Couleurs pour les types de lieux
export const LocationTypeColors: Record<LocationType, string> = {
  [LocationType.ROOM]: '#6366f1',
  [LocationType.BUILDING]: '#8b5cf6',
  [LocationType.CAMPUS]: '#ec4899',
  [LocationType.ONLINE]: '#10b981'
};