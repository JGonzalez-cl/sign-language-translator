// src/app/features/history/detail/history-detail/history-detail.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PredictionsService, PrediccionResponse } from '../../../../core/services/predictions.service';

@Component({
  selector: 'app-history-detail',
  imports: [DatePipe],
  templateUrl: './history-detail.html',
  styleUrl: './history-detail.scss',
})
export class HistoryDetail implements OnInit {
  private predictionsService = inject(PredictionsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  item = signal<PrediccionResponse | null>(null);
  loading = signal(true);
  error = signal('');
  signedUrl = signal<string | null>(null);
  deleting = signal(false);
  showDeleteConfirm = signal(false);

  readonly MODO_LABELS: Record<string, string> = {
    IMAGEN_SUBIDA: 'Imagen subida',
    FOTO_CAPTURADA: 'Foto capturada',
    VIDEO_SUBIDO: 'Vídeo subido',
    VIDEO_GRABADO: 'Vídeo grabado',
    LIVE_SESSION: 'Sesión live',
  };

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadDetail(id);
  }

  loadDetail(id: number) {
    this.loading.set(true);
    this.error.set('');

    this.predictionsService.getDetail(id).subscribe({
      next: (res) => {
        this.item.set(res);
        this.loading.set(false);

        // Cargar URL firmada si tiene archivo
        if (res.sesion.modo !== 'LIVE_SESSION') {
          this.loadSignedUrl(id);
        }
      },
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Error al cargar la sesión.');
        this.loading.set(false);
      },
    });
  }

  loadSignedUrl(id: number) {
    this.predictionsService.getSignedUrl(id).subscribe({
      next: (res) => this.signedUrl.set(res.url),
      error: () => {}, // silencioso — puede que no tenga archivo
    });
  }

  confirmDelete() {
    this.showDeleteConfirm.set(true);
  }

  cancelDelete() {
    this.showDeleteConfirm.set(false);
  }

  delete() {
    const id = this.item()?.sesion.id;
    if (!id) return;

    this.deleting.set(true);
    this.predictionsService.delete(id).subscribe({
      next: () => this.router.navigate(['/history']),
      error: (err) => {
        this.error.set(err.error?.detail ?? 'Error al eliminar la sesión.');
        this.deleting.set(false);
        this.showDeleteConfirm.set(false);
      },
    });
  }

  goBack() {
    this.router.navigate(['/history']);
  }

  getModoLabel(modo: string): string {
    return this.MODO_LABELS[modo] ?? modo;
  }

  getSecuenciaLimpia(texto: string): string {
    console.log('secuencia raw:', texto);
    const tokens = texto.match(/del|space|[A-Z]/g) ?? [];
    console.log('tokens:', tokens);
    const resultado: string[] = [];
    for (const token of tokens) {
      if (token === 'del') {
        resultado.pop();
      } else if (token === 'space') {
        resultado.push(' ');
      } else {
        resultado.push(token);
      }
    }
    return resultado.join('');
  }
}