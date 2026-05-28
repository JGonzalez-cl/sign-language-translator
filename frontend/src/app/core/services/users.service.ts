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

  deleteAccount(): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/users/me`);
  }
}