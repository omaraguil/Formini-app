import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Planning } from '../models/planning';


@Injectable({
  providedIn: 'root'
})
export class PlanningService {
    private apiUrl = 'http://youssef:8085/api/plannings';

  constructor(private http: HttpClient) { }

  // POST /api/plannings
   createPlanning(planning: Planning, sessionId: number, locationId?: number): Observable<Planning> {
    let params = new HttpParams()
      .set('sessionId', sessionId.toString());
    
    // Add locationId only if provided (for ONSITE and HYBRID modes)
    if (locationId) {
      params = params.set('locationId', locationId.toString());
    }

    return this.http.post<Planning>(this.apiUrl, planning, { params });
  }

  // GET /api/plannings/session/{sessionId}
  getPlanningsBySession(sessionId: number): Observable<Planning[]> {
    return this.http.get<Planning[]>(`${this.apiUrl}/session/${sessionId}`);
  }

  // GET /api/plannings/{id}
  getPlanningById(id: number): Observable<Planning> {
    return this.http.get<Planning>(`${this.apiUrl}/${id}`);
  }

  // PUT /api/plannings/{id}
  updatePlanning(id: number, planning: Planning): Observable<Planning> {
    return this.http.put<Planning>(`${this.apiUrl}/${id}`, planning);
  }

  // DELETE /api/plannings/{id}
  deletePlanning(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}