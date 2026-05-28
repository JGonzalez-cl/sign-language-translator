import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../core/services/users.service';
import { DatePipe } from '@angular/common';

type Tab = 'info' | 'password' | 'danger';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, DatePipe],
  templateUrl: 'profile.html',
  styleUrl: 'profile.scss',
})
export class Profile implements OnInit {
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private router = inject(Router);

  user = this.authService.currentUser;
  tab = signal<Tab>('info');

  // Editar datos
  editMode = signal(false);
  nombre = signal('');
  apellidos = signal('');
  nombreUsuario = signal('');
  savingInfo = signal(false);
  infoSuccess = signal('');
  infoError = signal('');

  // Cambiar contraseña
  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  savingPassword = signal(false);
  passwordSuccess = signal('');
  passwordError = signal('');

  // Eliminar cuenta
  showDeleteConfirm = signal(false);
  deleting = signal(false);
  deleteError = signal('');

  ngOnInit() {
    const u = this.user();
    if (u) {
      this.nombre.set(u.nombre);
      this.apellidos.set(u.apellidos);
      this.nombreUsuario.set(u.nombre_usuario);
    }
  }

  setTab(t: string) {
    this.tab.set(t as Tab);
    this.infoSuccess.set('');
    this.infoError.set('');
    this.passwordSuccess.set('');
    this.passwordError.set('');
  }

  saveInfo() {
    this.savingInfo.set(true);
    this.infoError.set('');
    this.infoSuccess.set('');

    this.usersService.updateMe({
      nombre: this.nombre(),
      apellidos: this.apellidos(),
      nombre_usuario: this.nombreUsuario(),
    }).subscribe({
      next: () => {
        this.authService.loadProfile();
        this.infoSuccess.set('Datos actualizados correctamente.');
        this.editMode.set(false);
        this.savingInfo.set(false);
      },
      error: (err) => {
        this.infoError.set(err.error?.detail ?? 'Error al actualizar los datos.');
        this.savingInfo.set(false);
      },
    });
  }

  savePassword() {
    this.passwordError.set('');
    this.passwordSuccess.set('');

    if (this.newPassword() !== this.confirmPassword()) {
      this.passwordError.set('Las contraseñas no coinciden.');
      return;
    }
    if (this.newPassword().length < 8) {
      this.passwordError.set('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    this.savingPassword.set(true);
    this.usersService.updatePassword({
      password_actual: this.currentPassword(),
      password_nuevo: this.newPassword(),
    }).subscribe({
      next: () => {
        this.passwordSuccess.set('Contraseña actualizada correctamente.');
        this.currentPassword.set('');
        this.newPassword.set('');
        this.confirmPassword.set('');
        this.savingPassword.set(false);
      },
      error: (err) => {
        this.passwordError.set(err.error?.detail ?? 'Error al cambiar la contraseña.');
        this.savingPassword.set(false);
      },
    });
  }

  deleteAccount() {
    this.deleting.set(true);
    this.usersService.deleteAccount().subscribe({
      next: () => {
        this.authService.logout();
      },
      error: (err) => {
        this.deleteError.set(err.error?.detail ?? 'Error al eliminar la cuenta.');
        this.deleting.set(false);
        this.showDeleteConfirm.set(false);
      },
    });
  }
  
    cancelDelete() {
        this.showDeleteConfirm.set(false);
    }
}