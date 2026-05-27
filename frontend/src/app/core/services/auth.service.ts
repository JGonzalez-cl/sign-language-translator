// src/app/core/services/auth.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, switchMap, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  nombre_usuario: string;
  nombre: string;
  apellidos: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserProfile {
  id: number;
  email: string;
  nombre_usuario: string;
  nombre: string;
  apellidos: string;
  status: string;
  fecha_registro: string;
  fecha_ultimo_acceso: string | null;
  rol: {
    id: number;
    nombre: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  // Signal reactivo del perfil del usuario actual
  private _currentUser = signal<UserProfile | null>(null);
  currentUser = this._currentUser.asReadonly();

  // Computed signals derivados
  isLoggedIn = computed(() => this._currentUser() !== null);
  isAdmin = computed(() => this._currentUser()?.rol.nombre === 'admin');

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    // Al iniciar la app intenta restaurar la sesión si hay tokens en localStorage
    this.restoreSession();
  }

  // ── Autenticación ────────────────────────────────────────────────────────────

  login(data: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${environment.apiUrl}/auth/login`, data).pipe(
      tap(tokens => this.saveTokens(tokens)),
      switchMap(tokens =>
        this.http.get<UserProfile>(`${environment.apiUrl}/users/me`).pipe(
          tap(user => this._currentUser.set(user)),
          map(() => tokens),
        )
      ),
    );
  }

  register(data: RegisterRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${environment.apiUrl}/auth/register`, data).pipe(
      tap(tokens => {
        this.saveTokens(tokens);
        this.loadProfile();
      }),
    );
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      // Notifica al backend para revocar el token — fire and forget
      this.http.post(`${environment.apiUrl}/auth/logout`, { refresh_token: refreshToken })
        .pipe(catchError(() => throwError(() => null)))
        .subscribe({ error: () => {} });
    }
    this.clearSession();
    this.router.navigate(['/login']);
  }

  refreshToken(): Observable<TokenResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<TokenResponse>(
      `${environment.apiUrl}/auth/refresh`,
      { refresh_token: refreshToken },
    ).pipe(
      tap(tokens => this.saveTokens(tokens)),
      catchError(err => {
        this.clearSession();
        this.router.navigate(['/login']);
        return throwError(() => err);
      }),
    );
  }

  // ── Perfil ───────────────────────────────────────────────────────────────────

  loadProfile(): void {
    this.http.get<UserProfile>(`${environment.apiUrl}/users/me`).subscribe({
      next: user => this._currentUser.set(user),
      error: () => this.clearSession(),
    });
  }

  loadProfileForInit(): Promise<void> {
    return new Promise(resolve => {
      this.http.get<UserProfile>(`${environment.apiUrl}/users/me`).subscribe({
        next: user => {
          this._currentUser.set(user);
          resolve();
        },
        error: () => {
          localStorage.removeItem(this.ACCESS_TOKEN_KEY);
          localStorage.removeItem(this.REFRESH_TOKEN_KEY);
          resolve();
        },
      });
    });
  }

  // ── Tokens ───────────────────────────────────────────────────────────────────

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private saveTokens(tokens: TokenResponse): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.access_token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh_token);
  }

  private clearSession(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    this._currentUser.set(null);
  }

  private restoreSession(): void {
    
  }
}