// src/app/features/admin/users/admin-users/admin-users.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AdminService, PaginatedUsers } from '../../../../core/services/admin.service';
import { UserProfile } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-admin-users',
  imports: [DatePipe],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.scss',
})
export class AdminUsers implements OnInit {
  private adminService = inject(AdminService);

  data = signal<PaginatedUsers | null>(null);
  loading = signal(true);
  error = signal('');
  page = signal(1);
  limit = 20;

  selectedUser = signal<UserProfile | null>(null);
  showDeleteConfirm = signal(false);
  actionLoading = signal(false);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.adminService.getUsers(this.page(), this.limit).subscribe({
      next: (res) => { this.data.set(res); this.loading.set(false); },
      error: (err) => { this.error.set(err.error?.detail ?? 'Error al cargar usuarios.'); this.loading.set(false); },
    });
  }

  prevPage() { if (this.page() > 1) { this.page.update(p => p - 1); this.load(); } }
  nextPage() {
    const d = this.data();
    if (d && this.page() * this.limit < d.total) { this.page.update(p => p + 1); this.load(); }
  }

  changeStatus(user: UserProfile, status: string) {
    this.actionLoading.set(true);
    this.adminService.updateUserStatus(user.id, status).subscribe({
      next: () => { this.actionLoading.set(false); this.load(); },
      error: (err) => { this.error.set(err.error?.detail ?? 'Error al cambiar status.'); this.actionLoading.set(false); },
    });
  }

  confirmDelete(user: UserProfile) {
    this.selectedUser.set(user);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete() {
    this.selectedUser.set(null);
    this.showDeleteConfirm.set(false);
  }

  deleteUser() {
    const user = this.selectedUser();
    if (!user) return;
    this.actionLoading.set(true);
    this.adminService.deleteUser(user.id).subscribe({
      next: () => { this.actionLoading.set(false); this.showDeleteConfirm.set(false); this.selectedUser.set(null); this.load(); },
      error: (err) => { this.error.set(err.error?.detail ?? 'Error al eliminar usuario.'); this.actionLoading.set(false); },
    });
  }
}