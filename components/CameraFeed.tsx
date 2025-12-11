import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CameraDevice } from '../types';

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

export const CameraFeed: React.FC<CameraFeedProps> = ({
  overlay,
  onCapture,
  isCountingDown,
  mode,
  countdownDuration,
  activeDeviceId,
  onDevicesChange,
  onActiveDeviceChange,
  onErrorChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [countdownValue, setCountdownValue] = useState<number>(3);

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
      OUTPUT_WIDTH = 1080;
      OUTPUT_HEIGHT = 1440;
    } else {
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

        // Se ainda não há câmera ativa, seleciona a primeira
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

  // Contagem regressiva
  useEffect(() => {
    if (!isCountingDown) return;

    setCountdownValue(countdownDuration);
    const interval = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          captureImage();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCountingDown, captureImage, countdownDuration]);

  // Proporção do preview alinhada com o tamanho exato do frame
  const aspectClass = mode === 'portrait' ? 'aspect-[3/4]' : 'aspect-[4/3]';

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

        {isCountingDown && (
          <div className="absolute top-4 right-4 z-30 flex flex-col items-center gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/80 bg-black/40 px-2 py-0.5 rounded-full">
              Foto em
            </span>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/50 flex items-center justify-center shadow-lg">
              <span className="text-3xl sm:text-4xl font-bold text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.6)]">
                {countdownValue > 0 ? countdownValue : '📸'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};