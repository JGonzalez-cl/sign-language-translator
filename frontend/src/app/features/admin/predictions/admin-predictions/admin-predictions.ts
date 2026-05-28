// src/app/features/admin/predictions/admin-predictions/admin-predictions.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AdminService, PaginatedPredictions } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-admin-predictions',
  imports: [DatePipe],
  templateUrl: './admin-predictions.html',
  styleUrl: './admin-predictions.scss',
})
export class AdminPredictions implements OnInit {
  private adminService = inject(AdminService);

  data = signal<PaginatedPredictions | null>(null);
  loading = signal(true);
  error = signal('');
  page = signal(1);
  limit = 20;

  readonly MODO_LABELS: Record<string, string> = {
    IMAGEN_SUBIDA: 'Imagen',
    FOTO_CAPTURADA: 'Foto',
    VIDEO_SUBIDO: 'Vídeo',
    VIDEO_GRABADO: 'Grabación',
    LIVE_SESSION: 'Live',
  };

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.adminService.getPredictions(this.page(), this.limit).subscribe({
      next: (res) => { this.data.set(res); this.loading.set(false); },
      error: (err) => { this.error.set(err.error?.detail ?? 'Error al cargar predicciones.'); this.loading.set(false); },
    });
  }

  prevPage() { if (this.page() > 1) { this.page.update(p => p - 1); this.load(); } }
  nextPage() {
    const d = this.data();
    if (d && this.page() * this.limit < d.total) { this.page.update(p => p + 1); this.load(); }
  }

  getModoLabel(modo: string): string {
    return this.MODO_LABELS[modo] ?? modo;
  }
}