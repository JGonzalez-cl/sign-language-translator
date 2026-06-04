import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserProfile } from './auth.service';

export interface UsuarioUpdate {
  nombre?: string;
  apellidos?: string;
  nombre_usuario?: string;
}

export interface PasswordUpdate {
  password_actual: string;
  password_nuevo: string;
}

export interface TopGesto {
  gesto: string;
  count: number;
}

export interface ActividadDia {
  fecha: string;
  count: number;
}

export interface UserStats {
  total_sesiones: number;
  completadas: number;
  interrumpidas: number;
  gestos_detectados: number;
  confianza_media: number;
  gesto_mas_detectado: string | null;
  top_gestos: TopGesto[];
  por_modo: Record<string, number>;
  actividad_reciente: ActividadDia[];
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private http: HttpClient) {}

  getMe(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${environment.apiUrl}/users/me`);
  }

  updateMe(data: UsuarioUpdate): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${environment.apiUrl}/users/me`, data);
  }

  updatePassword(data: PasswordUpdate): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/users/me/password`, data);
  }

  getMyStats(): Observable<UserStats> {
    return this.http.get<UserStats>(`${environment.apiUrl}/users/me/stats`);
  }

  deleteAccount(): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/users/me`);
  }
}