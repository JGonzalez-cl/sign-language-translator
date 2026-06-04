import { Component, inject, signal, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { UsersService, UserStats } from '../../core/services/users.service';

@Component({
  selector: 'app-stats',
  imports: [DecimalPipe],
  templateUrl: 'stats.html',
})
export class Stats implements OnInit {
  private usersService = inject(UsersService);

  stats = signal<UserStats | null>(null);
  loading = signal(true);
  error = signal('');

  readonly MODO_LABELS: Record<string, string> = {
    IMAGEN_SUBIDA:  'Imagen subida',
    FOTO_CAPTURADA: 'Foto webcam',
    VIDEO_SUBIDO:   'Vídeo subido',
    VIDEO_GRABADO:  'Vídeo grabado',
    LIVE_SESSION:   'Sesión live',
  };

  readonly MODO_COLORS: Record<string, string> = {
    IMAGEN_SUBIDA:  '#6366f1',
    FOTO_CAPTURADA: '#818cf8',
    VIDEO_SUBIDO:   '#38bdf8',
    VIDEO_GRABADO:  '#7dd3fc',
    LIVE_SESSION:   '#a5b4fc',
  };

  ngOnInit() {
    this.usersService.getMyStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las estadísticas.');
        this.loading.set(false);
      },
    });
  }

  getActividadMax(): number {
    const s = this.stats();
    if (!s || s.actividad_reciente.length === 0) return 1;
    return Math.max(...s.actividad_reciente.map(d => d.count));
  }

  getTopGestoMax(): number {
    const s = this.stats();
    if (!s || s.top_gestos.length === 0) return 1;
    return Math.max(...s.top_gestos.map(g => g.count));
  }

  getModoEntries(): { modo: string; label: string; count: number; color: string; pct: number }[] {
    const s = this.stats();
    if (!s) return [];
    const total = Object.values(s.por_modo).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(s.por_modo)
      .filter(([, count]) => count > 0)
      .map(([modo, count]) => ({
        modo,
        label: this.MODO_LABELS[modo] ?? modo,
        count,
        color: this.MODO_COLORS[modo] ?? '#6366f1',
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }

  getDonutSegments(): { color: string; offset: number; dash: number }[] {
    const entries = this.getModoEntries();
    const total = entries.reduce((a, b) => a + b.count, 0) || 1;
    const circunferencia = 2 * Math.PI * 36;
    let offset = 0;
    return entries.map(e => {
      const dash = (e.count / total) * circunferencia;
      const seg = { color: e.color, offset: -offset, dash };
      offset += dash;
      return seg;
    });
  }

  getLast14Days(): { fecha: string; label: string; count: number }[] {
    const s = this.stats();
    const actividadMap = new Map(
      (s?.actividad_reciente ?? []).map(d => [d.fecha, d.count])
    );
    const days: { fecha: string; label: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      days.push({ fecha: key, label, count: actividadMap.get(key) ?? 0 });
    }
    return days;
  }
}