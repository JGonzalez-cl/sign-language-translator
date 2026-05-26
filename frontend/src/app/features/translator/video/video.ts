// src/app/features/translator/video/video.ts
import { Component, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { PredictionsService, PrediccionResponse } from '../../../core/services/predictions.service';

type Mode = 'upload' | 'record';
type State = 'idle' | 'loading' | 'result' | 'error';

@Component({
  selector: 'app-video',
  imports: [],
  templateUrl: './video.html',
  styleUrl: './video.scss',
})
export class Video {
  private predictionsService = inject(PredictionsService);

  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  mode = signal<Mode>('upload');
  state = signal<State>('idle');
  errorMessage = signal('');
  result = signal<PrediccionResponse | null>(null);

  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);

  // Grabación
  stream: MediaStream | null = null;
  mediaRecorder: MediaRecorder | null = null;
  recordedChunks: Blob[] = [];
  cameraActive = signal(false);
  recording = signal(false);
  recordingSeconds = signal(0);
  private recordingInterval: any = null;
  readonly MAX_SECONDS = 180;

  // ── Modo ─────────────────────────────────────────────────────────────────────

  setMode(m: Mode) {
    this.mode.set(m);
    this.reset();
    if (m === 'record') {
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
    this.previewUrl.set(URL.createObjectURL(file));
    this.state.set('idle');
    this.result.set(null);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (!file || !file.type.startsWith('video/')) return;
    this.selectedFile.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
    this.state.set('idle');
    this.result.set(null);
  }

  onDragOver(event: DragEvent) { event.preventDefault(); }

  submitUpload() {
    const file = this.selectedFile();
    if (!file) return;
    this.predict(file, 'VIDEO_SUBIDO');
  }

  // ── Grabación ─────────────────────────────────────────────────────────────────

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
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

  startRecording() {
    if (!this.stream) return;
    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream);
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordedChunks.push(e.data);
    };
    this.mediaRecorder.onstop = () => this.onRecordingStop();
    this.mediaRecorder.start();
    this.recording.set(true);
    this.recordingSeconds.set(0);

    this.recordingInterval = setInterval(() => {
      const secs = this.recordingSeconds() + 1;
      this.recordingSeconds.set(secs);
      if (secs >= this.MAX_SECONDS) {
        this.stopRecording();
      }
    }, 1000);
  }

  stopRecording() {
    clearInterval(this.recordingInterval);
    this.recording.set(false);
    this.mediaRecorder?.stop();
  }

  onRecordingStop() {
    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const file = new File([blob], 'grabacion.webm', { type: 'video/webm' });
    this.previewUrl.set(URL.createObjectURL(blob));
    this.stopCamera();
    this.predict(file, 'VIDEO_GRABADO');
  }

  // ── ML ────────────────────────────────────────────────────────────────────────

  predict(file: File, modo: 'VIDEO_SUBIDO' | 'VIDEO_GRABADO') {
    this.state.set('loading');
    this.result.set(null);
    this.errorMessage.set('');

    this.predictionsService.predictVideo(file, modo).subscribe({
      next: (res) => {
        this.result.set(res);
        this.state.set('result');
      },
      error: (err) => {
        this.errorMessage.set(err.error?.detail ?? 'Error al procesar el vídeo.');
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
    this.recording.set(false);
    this.recordingSeconds.set(0);
    clearInterval(this.recordingInterval);
    if (this.fileInput) this.fileInput.nativeElement.value = '';
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  ngOnDestroy() {
    this.stopCamera();
    clearInterval(this.recordingInterval);
  }
}