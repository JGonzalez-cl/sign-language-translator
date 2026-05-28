import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <p class="text-8xl font-bold text-blue-600 mb-4">404</p>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Página no encontrada</h1>
      <p class="text-gray-500 mb-8">La página que buscas no existe.</p>
      <button
        (click)="router.navigate(['/translator'])"
        class="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
      >
        Volver al inicio
      </button>
    </div>
  `,
})
export class NotFound {
  constructor(public router: Router) {}
}