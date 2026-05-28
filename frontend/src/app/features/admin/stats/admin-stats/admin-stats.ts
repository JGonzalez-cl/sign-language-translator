// src/app/features/admin/stats/admin-stats/admin-stats.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { AdminService, StatGesto, StatUser, StatActivity, StatMode, StatConfidence, StatRegistration } from '../../../../core/services/admin.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

@Component({
  selector: 'app-admin-stats',
  imports: [BaseChartDirective],
  templateUrl: './admin-stats.html',
  styleUrl: './admin-stats.scss',
})
export class AdminStats implements OnInit {
  private adminService = inject(AdminService);

  loading = signal(true);
  error = signal('');
  periodo = signal<'day' | 'week' | 'month'>('week');

  // Datos crudos
  gestures = signal<StatGesto[]>([]);
  users = signal<StatUser[]>([]);
  activity = signal<StatActivity[]>([]);
  modes = signal<StatMode[]>([]);
  confidence = signal<StatConfidence[]>([]);
  registrations = signal<StatRegistration[]>([]);

  // ── Chart configs ─────────────────────────────────────────────────────────────

  get gesturesChart(): ChartData<'bar'> {
    const data = this.gestures().slice(0, 10);
    return {
      labels: data.map(d => d.gesto),
      datasets: [{ label: 'Detecciones', data: data.map(d => d.total), backgroundColor: '#3b82f6' }],
    };
  }

  get modesChart(): ChartData<'doughnut'> {
    const data = this.modes().filter(d => d.total > 0);
    const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'];
    return {
      labels: data.map(d => d.modo),
      datasets: [{ data: data.map(d => d.total), backgroundColor: COLORS }],
    };
  }

  get activityChart(): ChartData<'line'> {
    const data = this.activity();
    return {
      labels: data.map(d => new Date(d.intervalo).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })),
      datasets: [{ label: 'Sesiones', data: data.map(d => d.total), borderColor: '#3b82f6', backgroundColor: '#eff6ff', fill: true, tension: 0.3 }],
    };
  }

  get registrationsChart(): ChartData<'line'> {
    const data = this.registrations();
    return {
      labels: data.map(d => new Date(d.dia).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })),
      datasets: [{ label: 'Registros', data: data.map(d => d.total), borderColor: '#10b981', backgroundColor: '#ecfdf5', fill: true, tension: 0.3 }],
    };
  }

  get confidenceChart(): ChartData<'bar'> {
    const data = this.confidence().slice(0, 10);
    return {
      labels: data.map(d => d.gesto),
      datasets: [{ label: 'Confianza media', data: data.map(d => d.confianza_media), backgroundColor: '#8b5cf6' }],
    };
  }

  barOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  lineOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  doughnutOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
  };

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.error.set('');

    Promise.all([
      this.adminService.getStatsGestures().toPromise(),
      this.adminService.getStatsUsers().toPromise(),
      this.adminService.getStatsActivity(this.periodo()).toPromise(),
      this.adminService.getStatsModes().toPromise(),
      this.adminService.getStatsConfidence().toPromise(),
      this.adminService.getStatsRegistrations().toPromise(),
    ]).then(([gestures, users, activity, modes, confidence, registrations]) => {
      this.gestures.set(gestures ?? []);
      this.users.set(users ?? []);
      this.activity.set(activity ?? []);
      this.modes.set(modes ?? []);
      this.confidence.set(confidence ?? []);
      this.registrations.set(registrations ?? []);
      this.loading.set(false);
    }).catch(err => {
      this.error.set('Error al cargar estadísticas.');
      this.loading.set(false);
    });
  }

  changePeriodo(p: string) {
    this.periodo.set(p as 'day' | 'week' | 'month');
    this.adminService.getStatsActivity(p).subscribe({
      next: (data) => this.activity.set(data),
    });
  }
}