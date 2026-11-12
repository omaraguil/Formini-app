import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Participant } from '../models/participant.model';

interface AddParticipantRequest {
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class ParticipationService {
  // Gateway endpoint
  private readonly apiBase = 'http://localhost:8080/api/events';
  private readonly http = inject(HttpClient);

  addParticipant(eventId: number, payload: AddParticipantRequest): Observable<Participant> {
    return this.http.post<Participant>(`${this.apiBase}/${eventId}/participants`, payload);
    }

  getParticipants(eventId: number): Observable<Participant[]> {
    return this.http.get<Participant[]>(`${this.apiBase}/${eventId}/participants`);
  }

  removeParticipant(eventId: number, participantId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/${eventId}/participants/${participantId}`);
  }

  confirm(eventId: number, token: string): Observable<void> {
    return this.http.get<void>(`${this.apiBase}/${eventId}/participants/confirm`, {
      params: { token }
    });
  }
}
