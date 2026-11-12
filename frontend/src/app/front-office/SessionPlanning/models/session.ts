export interface Session {
  id?: number;
  trainerId?: number;
  courseId?: number;
  maxParticipants: number;
  createdAt?: Date;
    status: SessionStatus;
 
}
export enum SessionStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}