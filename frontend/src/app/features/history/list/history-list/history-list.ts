// src/app/features/history/list/history-list/history-list.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass, DatePipe, SlicePipe } from '@angular/common';
import { PredictionsService, PrediccionResponse } from '../../../../core/services/predictions.service';

@Component({
  selector: 'app-history-list',
  imports: [NgClass, DatePipe, SlicePipe],
  templateUrl: './history-list.html',
  styleUrl: './history-list.scss',
})
export class HistoryList implements OnInit {
  private predictionsService = inject(PredictionsService);
  private router = inject(Router);

  items = signal<PrediccionResponse[]>([]);
  loading = signal(true);
  error = signal('');
  page = signal(1);
  limit = 20;
  hasMore = signal(false);

  readonly MODO_LABELS: Record<string, string> = {
    IMAGEN_SUBIDA: 'Imagen subida',
    FOTO_CAPTURADA: 'Foto capturada',
    VIDEO_SUBIDO: 'Vídeo subido',
    VIDEO_GRABADO: 'Vídeo grabado',
    LIVE_SESSION: 'Sesión live',
  };

  readonly STATUS_LABELS: Record<string, string> = {
    COMPLETADA: 'Completada',
    INTERRUMPIDA: 'Interrumpida',
  };

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.loading.set(true);
    this.error.set('');

    this.predictionsService.getHistory(this.page(), this.limit).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.hasMore.set(res.items.length === this.limit);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Error al cargar el historial.');
        this.loading.set(false);
      },
    });
  }

  goToDetail(id: number) {
    this.router.navigate(['/history', id]);
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.update(p => p - 1);
      this.loadHistory();
    }
  }

  nextPage() {
    if (this.hasMore()) {
      this.page.update(p => p + 1);
      this.loadHistory();
    }
  }

  getModoLabel(modo: string): string {
    return this.MODO_LABELS[modo] ?? modo;
  }

  getStatusLabel(status: string): string {
    return this.STATUS_LABELS[status] ?? status;
  }
}