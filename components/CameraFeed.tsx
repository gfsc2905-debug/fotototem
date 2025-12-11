import React, {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { CameraDevice } from '../types';

export interface CameraFeedHandle {
  capture: () => void;
}

interface CameraFeedProps {
  overlay: string | null;
  onCapture: (dataUrl: string) => void;
  isCountingDown: boolean;
  mode: 'portrait' | 'landscape';
  countdownDuration: 3 | 5 | 10;
  activeDeviceId: string | null;
  onDevicesChange: (devices: CameraDevice[]) => void;
  onActiveDeviceChange: (deviceId: string | null) => void;
  onErrorChange: (message: string | null) => void;
}

export const CameraFeed = forwardRef<CameraFeedHandle, CameraFeedProps>(
  (
    {
      overlay,
      onCapture,
      isCountingDown, // mantido só para compatibilidade/estilo futuro
      mode,
      countdownDuration, // idem
      activeDeviceId,
      onDevicesChange,
      onActiveDeviceChange,
      onErrorChange,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Captura com tamanho EXATO do frame conforme o modo
    const captureImage = useCallback(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let OUTPUT_WIDTH: number;
      let OUTPUT_HEIGHT: number;

      if (mode === 'portrait') {
        // Formato em pé: 1080x1920 (largura x altura)
        OUTPUT_WIDTH = 1080;
        OUTPUT_HEIGHT = 1920;
      } else {
        // Deitado: 1440x1080
        OUTPUT_WIDTH = 1440;
        OUTPUT_HEIGHT = 1080;
      }

      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;

      const videoAspect = video.videoWidth / video.videoHeight;
      const canvasAspect = OUTPUT_WIDTH / OUTPUT_HEIGHT;

      let drawWidth: number;
      let drawHeight: number;
      let offsetX: number;
      let offsetY: number;

      if (videoAspect > canvasAspect) {
        drawHeight = OUTPUT_HEIGHT;
        drawWidth = OUTPUT_HEIGHT * videoAspect;
        offsetX = (OUTPUT_WIDTH - drawWidth) / 2;
        offsetY = 0;
      } else {
        drawWidth = OUTPUT_WIDTH;
        drawHeight = OUTPUT_WIDTH / videoAspect;
        offsetX = 0;
        offsetY = (OUTPUT_HEIGHT - drawHeight) / 2;
      }

      ctx.save();
      ctx.translate(OUTPUT_WIDTH, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
      ctx.restore();

      if (overlay) {
        const img = new Image();
        img.src = overlay;
        img.onload = () => {
          ctx.drawImage(img, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
          finalizeCapture(canvas);
        };
        img.onerror = () => {
          finalizeCapture(canvas);
        };
      } else {
        finalizeCapture(canvas);
      }
    }, [overlay, mode, onCapture]);

    const finalizeCapture = (canvas: HTMLCanvasElement) => {
      const dataUrl = canvas.toDataURL('image/png');
      onCapture(dataUrl);
    };

    // Expor o método capture para o App via ref
    useImperativeHandle(ref, () => ({
      capture: () => {
        captureImage();
      },
    }));

    // Inicializar câmeras e informar para o App
    useEffect(() => {
      const getCameras = async () => {
        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices: CameraDevice[] = devices
            .filter((device) => device.kind === 'videoinput')
            .map((d) => ({
              deviceId: d.deviceId,
              label: d.label || `Camera ${d.deviceId.slice(0, 5)}...`,
            }));

          onDevicesChange(videoDevices);

          if (!activeDeviceId && videoDevices.length > 0) {
            onActiveDeviceChange(videoDevices[0].deviceId);
          }
        } catch (err) {
          onErrorChange('Não foi possível acessar a câmera. Verifique as permissões.');
          console.error(err);
        }
      };
      getCameras();
    }, [activeDeviceId, onActiveDeviceChange, onDevicesChange, onErrorChange]);

    // Iniciar stream sempre que activeDeviceId mudar
    useEffect(() => {
      if (!activeDeviceId) return;

      const startStream = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              deviceId: { exact: activeDeviceId },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          onErrorChange(null);
        } catch (err) {
          console.error('Error accessing stream:', err);
          onErrorChange('Erro ao iniciar o vídeo da câmera.');
        }
      };

      startStream();

      return () => {
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
        }
      };
    }, [activeDeviceId, onErrorChange]);

    // Proporção visual do preview
    const aspectClass = mode === 'portrait' ? 'aspect-[9/16]' : 'aspect-[4/3]';

    return (
      <div className="relative flex flex-col items-center w-full h-full">
        <div
          className={`relative w-full ${aspectClass} bg-globo-gray rounded-mosaic overflow-hidden shadow-xl ring-1 ring-black/5`}
        >
          <canvas ref={canvasRef} className="hidden" />

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100"
          />

          {overlay && (
            <img
              src={overlay}
              alt="Frame Overlay"
              className="absolute top-0 left-0 w-full h-full object-cover z-10 pointer-events-none"
            />
          )}
        </div>
      </div>
    );
  }
);

CameraFeed.displayName = 'CameraFeed';