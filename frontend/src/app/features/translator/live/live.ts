// src/app/features/translator/live/live.ts
import { Component, inject, signal, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

type State = 'idle' | 'connecting' | 'connected' | 'finished' | 'error';

@Component({
  selector: 'app-live',
  imports: [],
  templateUrl: './live.html',
  styleUrl: './live.scss',
})
export class Live implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);

  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasEl!: ElementRef<HTMLCanvasElement>;

  state = signal<State>('idle');
  errorMessage = signal('');
  secuencia = signal('');
  ultimoGesto = signal('');
  ultimaConfianza = signal(0);
  sessionId = signal<number | null>(null);

  private stream: MediaStream | null = null;
  private ws: WebSocket | null = null;
  private frameInterval: any = null;
  readonly FPS_INTERVAL = 150; // ~6-7 FPS

  // ── Sesión ────────────────────────────────────────────────────────────────────

  async startSession() {
    this.state.set('connecting');
    this.errorMessage.set('');
    this.secuencia.set('');
    this.ultimoGesto.set('');

  // 1. Abrir cámara
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    } catch {
      this.errorMessage.set('No se pudo acceder a la cámara.');
      this.state.set('error');
      return;
    }

  // 2. Conectar WebSocket
    const wsUrl = `${environment.wsUrl}/predictions/live`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      const token = this.authService.getAccessToken();
      this.ws!.send(JSON.stringify({ type: 'auth', token }));
    };

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'auth_ok') {
        this.sessionId.set(msg.sesion_id);
        this.state.set('connected');
        // Esperar a que Angular renderice el <video> tras cambiar el estado
        this.waitForVideoAndAssign();
      } else if (msg.type === 'prediction') {
        this.ultimoGesto.set(msg.gesto);
        this.ultimaConfianza.set(msg.confianza);
        this.secuencia.set(msg.secuencia);
      } else if (msg.type === 'error') {
        console.warn('WS error:', msg.detail);
      }
    };

    this.ws.onclose = () => {
      this.stopSendingFrames();
      this.stopCamera();
      this.state.set('finished');
      const id = this.sessionId();
      if (id) {
        setTimeout(() => this.router.navigate(['/history', id]), 1500);
      }
    };

    this.ws.onerror = () => {
      this.errorMessage.set('Error en la conexión WebSocket.');
      this.state.set('error');
      this.stopSendingFrames();
      this.stopCamera();
    };
  }

  private waitForVideoAndAssign() {
    // Reintenta hasta que el elemento <video> esté en el DOM
    const interval = setInterval(() => {
      if (this.videoEl?.nativeElement) {
        this.videoEl.nativeElement.srcObject = this.stream;
        clearInterval(interval);
        this.startSendingFrames();
      }
    }, 50);

    // Timeout de seguridad — para si el elemento nunca aparece
    setTimeout(() => clearInterval(interval), 3000);
  }

  stopSession() {
    this.ws?.close();
  }

  // ── Frames ────────────────────────────────────────────────────────────────────

  startSendingFrames() {
    const canvas = this.canvasEl?.nativeElement;
    const video = this.videoEl?.nativeElement;
    if (!canvas || !video) return;

    this.frameInterval = setInterval(() => {
      if (!video.videoWidth) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d')!;
      // Voltear horizontalmente para corregir efecto espejo
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);

      const data = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'frame', data }));
      }
    }, this.FPS_INTERVAL);
  }

  stopSendingFrames() {
    clearInterval(this.frameInterval);
    this.frameInterval = null;
  }

  stopCamera() {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }

  reset() {
    this.state.set('idle');
    this.secuencia.set('');
    this.ultimoGesto.set('');
    this.ultimaConfianza.set(0);
    this.sessionId.set(null);
    this.errorMessage.set('');
  }

  ngOnDestroy() {
    this.stopSendingFrames();
    this.stopCamera();
    this.ws?.close();
  }
}