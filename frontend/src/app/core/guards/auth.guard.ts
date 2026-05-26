import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  if (!authService.getAccessToken()) {
    router.navigate(['/login']);
    return false;
  }

  // Esperar hasta 3s a que el perfil cargue
  const result = await new Promise<boolean>(resolve => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (authService.isLoggedIn()) {
        clearInterval(interval);
        resolve(true);
      } else if (attempts >= 30) { // 30 * 100ms = 3s
        clearInterval(interval);
        resolve(false);
      }
    }, 100);
  });

  if (!result) {
    router.navigate(['/login']);
  }
  return result;
};

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};