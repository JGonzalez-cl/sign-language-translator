// src/app/layout/main-layout/main-layout.ts
import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  authService = inject(AuthService);
  sidebarOpen = signal(false);

  openSidebar() { this.sidebarOpen.set(true); }
  closeSidebar() { this.sidebarOpen.set(false); }

  logout() {
    this.authService.logout();
  }
}