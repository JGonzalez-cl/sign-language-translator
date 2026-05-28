// src/app/core/services/admin.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserProfile } from './auth.service';
import { PrediccionResponse } from './predictions.service';

export interface PaginatedUsers {
  page: number;
  limit: number;
  total: number;
  items: UserProfile[];
}

export interface PaginatedPredictions {
  page: number;
  limit: number;
  total: number;
  items: PrediccionResponse[];
}

export interface LogItem {
  id: number;
  usuario_id: number;
  accion: string;
  fecha: string;
  ip: string | null;
}

export interface PaginatedLogs {
  page: number;
  limit: number;
  total: number;
  items: LogItem[];
}

export interface StatGesto {
  gesto: string;
  total: number;
  confianza_media: number;
}

export interface StatUser {
  usuario_id: number;
  nombre_usuario: string;
  email: string;
  total_sesiones: number;
}

export interface StatActivity {
  intervalo: string;
  total: number;
}

export interface StatMode {
  modo: string;
  total: number;
}

export interface StatConfidence {
  gesto: string;
  confianza_media: number;
  total_muestras: number;
}

export interface StatRegistration {
  dia: string;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ── Gestión ───────────────────────────────────────────────────────────────────

  getUsers(page: number = 1, limit: number = 20): Observable<PaginatedUsers> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<PaginatedUsers>(`${this.apiUrl}/admin/users`, { params });
  }

  updateUserStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}/status`, { status });
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }

  getPredictions(page: number = 1, limit: number = 20): Observable<PaginatedPredictions> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<PaginatedPredictions>(`${this.apiUrl}/admin/predictions`, { params });
  }

  getLogs(page: number = 1, limit: number = 50): Observable<PaginatedLogs> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<PaginatedLogs>(`${this.apiUrl}/admin/logs`, { params });
  }

  // ── Estadísticas ──────────────────────────────────────────────────────────────

  getStatsGestures(): Observable<StatGesto[]> {
    return this.http.get<StatGesto[]>(`${this.apiUrl}/admin/stats/gestures`);
  }

  getStatsUsers(): Observable<StatUser[]> {
    return this.http.get<StatUser[]>(`${this.apiUrl}/admin/stats/users`);
  }

  getStatsActivity(periodo: string = 'week'): Observable<StatActivity[]> {
    const params = new HttpParams().set('periodo', periodo);
    return this.http.get<StatActivity[]>(`${this.apiUrl}/admin/stats/activity`, { params });
  }

  getStatsModes(): Observable<StatMode[]> {
    return this.http.get<StatMode[]>(`${this.apiUrl}/admin/stats/modes`);
  }

  getStatsConfidence(): Observable<StatConfidence[]> {
    return this.http.get<StatConfidence[]>(`${this.apiUrl}/admin/stats/confidence`);
  }

  getStatsRegistrations(): Observable<StatRegistration[]> {
    return this.http.get<StatRegistration[]>(`${this.apiUrl}/admin/stats/registrations`);
  }
}