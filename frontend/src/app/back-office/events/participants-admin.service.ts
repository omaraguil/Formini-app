import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

export interface AdminEvent {
  id: number;
  name: string;
  location?: string;
  date?: string;
}

export interface AdminParticipant {
  id: number;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class ParticipantsAdminService {
  private apiGateway = 'http://localhost:8085/api/events';
  private apiDirect = 'http://localhost:8080/api/events';
  constructor(private http: HttpClient) {}

  getEvents(): Observable<AdminEvent[]> {
    // Prefer direct to avoid gateway routing issues, fallback to gateway
    return this.http.get<AdminEvent[]>(this.apiDirect).pipe(
      catchError(() => this.http.get<AdminEvent[]>(this.apiGateway)),
      catchError(() => of([]))
    );
  }

  getParticipants(eventId: number): Observable<AdminParticipant[]> {
    // Prefer direct calls to forum-service (8080), with gateway as safety net.
    const directConfirmed = `${this.apiDirect}/${eventId}/participants`;
    const directAll = `${this.apiDirect}/${eventId}/participants/all`;
    const gwConfirmed = `${this.apiGateway}/${eventId}/participants`;
    const gwAll = `${this.apiGateway}/${eventId}/participants/all`;

    // Robust fallback chain:
    // 1) gateway confirmed
    // 2) gateway all
    // 3) direct confirmed (8080)
    // 4) direct all (8080)
    return this.http.get<AdminParticipant[]>(directConfirmed).pipe(
      catchError(() => this.http.get<AdminParticipant[]>(directAll)),
      switchMap(list => (list && list.length) ? of(list) : this.http.get<AdminParticipant[]>(gwConfirmed)),
      catchError(() => this.http.get<AdminParticipant[]>(gwAll)),
      catchError(() => of([]))
    );
  }

  addParticipant(eventId: number, payload: { name: string; email: string }): Observable<AdminParticipant> {
    // Use direct service to avoid gateway instability
    return this.http.post<AdminParticipant>(`${this.apiDirect}/${eventId}/participants`, payload);
  }

  deleteParticipant(eventId: number, participantId: number): Observable<void> {
    // Use direct service to avoid gateway instability
    return this.http.delete<void>(`${this.apiDirect}/${eventId}/participants/${participantId}`);
  }
}
