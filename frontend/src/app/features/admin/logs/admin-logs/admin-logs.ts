// src/app/features/admin/logs/admin-logs/admin-logs.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AdminService, PaginatedLogs } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-admin-logs',
  imports: [DatePipe],
  templateUrl: './admin-logs.html',
  styleUrl: './admin-logs.scss',
})
export class AdminLogs implements OnInit {
  private adminService = inject(AdminService);

  data = signal<PaginatedLogs | null>(null);
  loading = signal(true);
  error = signal('');
  page = signal(1);
  limit = 50;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.adminService.getLogs(this.page(), this.limit).subscribe({
      next: (res) => { this.data.set(res); this.loading.set(false); },
      error: (err) => { this.error.set(err.error?.detail ?? 'Error al cargar logs.'); this.loading.set(false); },
    });
  }

  prevPage() { if (this.page() > 1) { this.page.update(p => p - 1); this.load(); } }
  nextPage() {
    const d = this.data();
    if (d && this.page() * this.limit < d.total) { this.page.update(p => p + 1); this.load(); }
  }
}