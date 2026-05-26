// src/app/features/translator/image/image.ts
import { Component, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { PredictionsService, PrediccionResponse } from '../../../core/services/predictions.service';

type Mode = 'upload' | 'capture';
type State = 'idle' | 'loading' | 'result' | 'error';

@Component({
  selector: 'app-image',
  imports: [],
  templateUrl: './image.html',
  styleUrl: './image.scss',
})
export class Image {
  private predictionsService = inject(PredictionsService);

  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasEl!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  mode = signal<Mode>('upload');
  state = signal<State>('idle');
  errorMessage = signal('');
  result = signal<PrediccionResponse | null>(null);

  // Preview de la imagen
  previewUrl = signal<string | null>(null);
  selectedFile = signal<File | null>(null);

  // Cámara
  stream: MediaStream | null = null;
  cameraActive = signal(false);

  // ── Modo ─────────────────────────────────────────────────────────────────────

  setMode(m: Mode) {
    this.mode.set(m);
    this.reset();
    if (m === 'capture') {
      this.startCamera();
    } else {
      this.stopCamera();
    }
  }

  // ── Upload ────────────────────────────────────────────────────────────────────

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.selectedFile.set(file);
    const url = URL.createObjectURL(file);
    this.previewUrl.set(url);
    this.state.set('idle');
    this.result.set(null);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    this.selectedFile.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
    this.state.set('idle');
    this.result.set(null);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  submitUpload() {
    const file = this.selectedFile();
    if (!file) return;
    this.predict(file, 'IMAGEN_SUBIDA');
  }

  // ── Cámara ────────────────────────────────────────────────────────────────────

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.cameraActive.set(true);
      setTimeout(() => {
        if (this.videoEl) {
          this.videoEl.nativeElement.srcObject = this.stream;
        }
      }, 100);
    } catch {
      this.errorMessage.set('No se pudo acceder a la cámara.');
      this.state.set('error');
    }
  }

  stopCamera() {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    this.cameraActive.set(false);
  }

  captureAndPredict() {
    const video = this.videoEl?.nativeElement;
    const canvas = this.canvasEl?.nativeElement;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d')!;
    // Voltear horizontalmente para corregir el efecto espejo
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    this.previewUrl.set(canvas.toDataURL('image/jpeg', 0.9));

    canvas.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], 'captura.jpg', { type: 'image/jpeg' });
      this.stopCamera();
      this.predict(file, 'FOTO_CAPTURADA');
    }, 'image/jpeg', 0.9);
  }

  // ── ML ────────────────────────────────────────────────────────────────────────

  predict(file: File, modo: 'IMAGEN_SUBIDA' | 'FOTO_CAPTURADA') {
    this.state.set('loading');
    this.result.set(null);
    this.errorMessage.set('');

    this.predictionsService.predictImage(file, modo).subscribe({
      next: (res) => {
        this.result.set(res);
        this.state.set('result');
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail ?? 'Error al procesar la imagen.');
        this.state.set('error');
      },
    });
  }

  reset() {
    this.state.set('idle');
    this.result.set(null);
    this.previewUrl.set(null);
    this.selectedFile.set(null);
    this.errorMessage.set('');
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  ngOnDestroy() {
    this.stopCamera();
  }
}