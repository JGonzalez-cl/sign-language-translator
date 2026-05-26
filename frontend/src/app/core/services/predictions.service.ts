// src/app/core/services/predictions.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SesionResponse {
  id: number;
  usuario_id: number;
  modo: string;
  status: string;
  fecha: string;
  eliminado: boolean;
}

export interface DetalleResultadoResponse {
  id: number;
  resultado_id: number;
  gesto: string;
  confianza: number;
  posicion_secuencia: number;
  timestamp_frame: number | null;
}

export interface ResultadoResponse {
  id: number;
  sesion_id: number;
  secuencia_texto: string;
  confianza_media: number;
  total_frames: number;
  detalles: DetalleResultadoResponse[];
}

export interface PrediccionResponse {
  sesion: SesionResponse;
  resultado: ResultadoResponse | null;
}

export interface HistorialResponse {
  page: number;
  limit: number;
  items: PrediccionResponse[];
}

@Injectable({ providedIn: 'root' })
export class PredictionsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ── Predicciones ─────────────────────────────────────────────────────────────

  predictImage(file: File, modo: 'IMAGEN_SUBIDA' | 'FOTO_CAPTURADA'): Observable<PrediccionResponse> {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('modo', modo);
    return this.http.post<PrediccionResponse>(`${this.apiUrl}/predictions/image`, formData);
  }

  predictVideo(file: File, modo: 'VIDEO_SUBIDO' | 'VIDEO_GRABADO'): Observable<PrediccionResponse> {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('modo', modo);
    return this.http.post<PrediccionResponse>(`${this.apiUrl}/predictions/video`, formData);
  }

  // ── Historial ─────────────────────────────────────────────────────────────────

  getHistory(page: number = 1, limit: number = 20): Observable<HistorialResponse> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<HistorialResponse>(`${this.apiUrl}/predictions`, { params });
  }

  getDetail(sesionId: number): Observable<PrediccionResponse> {
    return this.http.get<PrediccionResponse>(`${this.apiUrl}/predictions/${sesionId}`);
  }

  getSignedUrl(sesionId: number): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.apiUrl}/predictions/files/${sesionId}`);
  }

  delete(sesionId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/predictions/${sesionId}`);
  }
}