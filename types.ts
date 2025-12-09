export interface CameraDevice {
  deviceId: string;
  label: string;
}

export type AppState = 'setup' | 'countdown' | 'result';

export interface PhotoData {
  dataUrl: string;
  timestamp: number;
  publicUrl?: string | null;
}