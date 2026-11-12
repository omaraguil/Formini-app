// src/app/services/location.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Location, LocationType } from  '../models/location';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private apiUrl = 'http://youssef:8085/api/locations';

  constructor(private http: HttpClient) { }

  // POST /api/locations
  createLocation(location: Location): Observable<Location> {
    return this.http.post<Location>(this.apiUrl, location);
  }

  // PUT /api/locations/{id}
  updateLocation(id: number, location: Location): Observable<Location> {
    return this.http.put<Location>(`${this.apiUrl}/${id}`, location);
  }

  // DELETE /api/locations/{id}
  deleteLocation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // GET /api/locations/{id}
  getLocationById(id: number): Observable<Location> {
    return this.http.get<Location>(`${this.apiUrl}/${id}`);
  }

  // GET /api/locations
  getAllLocations(): Observable<Location[]> {
    return this.http.get<Location[]>(this.apiUrl);
  }

  // GET /api/locations/type/{type}
  getLocationsByType(type: LocationType): Observable<Location[]> {
    return this.http.get<Location[]>(`${this.apiUrl}/type/${type}`);
  }
}
