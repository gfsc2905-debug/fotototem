import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CameraDevice, AppState } from '../types';
import { SwitchCamera, Camera, AlertCircle, Clock } from 'lucide-react';

interface CameraFeedProps {
  overlay: string | null;
  onCapture: (dataUrl: string) => void;
  isCountingDown: boolean;
  setAppState: (state: AppState) => void;
  mode: 'portrait' | 'landscape';
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
  overlay,
  onCapture,
  isCountingDown,
  setAppState,
  mode,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdownValue, setCountdownValue] = useState<number>(3);
  const [countdownDuration, setCountdownDuration] = useState<3 | 5 | 10>(3);

  // Função de captura ajustando resolução conforme o modo
  const captureImage = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resolução de saída dependente do modo
    let OUTPUT_WIDTH: number;
    let OUTPUT_HEIGHT: number;

    if (mode === 'portrait') {
      // 4:5 vertical
      OUTPUT_WIDTH = 1080;
      OUTPUT_HEIGHT = 1350;
    } else {
      // landscape: 5:4 horizontal (mais largo para caber mais gente)
      OUTPUT_WIDTH = 1350;
      OUTPUT_HEIGHT = 1080;
    }

    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;

    // 1. Desenhar vídeo com crop central
    const videoAspect = video.videoWidth / video.videoHeight;
    const canvasAspect = OUTPUT_WIDTH / OUTPUT_HEIGHT;

    let drawWidth: number;
    let drawHeight: number;
    let offsetX: number;
    let offsetY: number;

    if (videoAspect > canvasAspect) {
      // Vídeo mais largo que o canvas: corta laterais
      drawHeight = OUTPUT_HEIGHT;
      drawWidth = OUTPUT_HEIGHT * videoAspect;
      offsetX = (OUTPUT_WIDTH - drawWidth) / 2;
      offsetY = 0;
    } else {
      // Vídeo mais alto que o canvas: corta topo/fundo
      drawWidth = OUTPUT_WIDTH;
      drawHeight = OUTPUT_WIDTH / videoAspect;
      offsetX = 0;
      offsetY = (OUTPUT_HEIGHT - drawHeight) / 2;
    }

    // Espelhar horizontalmente para selfie (sempre)
    ctx.save();
    ctx.translate(OUTPUT_WIDTH, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();

    // 2. Desenhar moldura (overlay) se houver
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
  }, [overlay, onCapture, mode]);

  const finalizeCapture = (canvas: HTMLCanvasElement) => {
    const dataUrl = canvas.toDataURL('image/png');
    onCapture(dataUrl);
  };

  // Inicializar câmeras
  useEffect(() => {
    const getCameras = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices
          .filter((device) => device.kind === 'videoinput')
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${d.deviceId.slice(0, 5)}...`,
          }));

        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setCurrentDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        setError('Não foi possível acessar a câmera. Verifique as permissões.');
        console.error(err);
      }
    };
    getCameras();
  }, []);

  // Iniciar stream
  useEffect(() => {
    if (!currentDeviceId) return;

    const startStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: currentDeviceId },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing stream:', err);
        setError('Erro ao iniciar o vídeo da câmera.');
      }
    };

    startStream();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [currentDeviceId]);

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

  const switchCamera = () => {
    const currentIndex = devices.findIndex((d) => d.deviceId === currentDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    setCurrentDeviceId(devices[nextIndex].deviceId);
  };

  const handleStartCountdown = () => {
    if (error) return;
    if (isCountingDown) return;
    setAppState('countdown');
  };

  const handleChangeDuration = (value: 3 | 5 | 10) => {
    if (isCountingDown) return;
    setCountdownDuration(value);
  };

  // Classe de aspecto da área de preview conforme o modo
  const aspectClass =
    mode === 'portrait'
      ? 'aspect-[4/5]'
      : 'aspect-[5/4]'; // deitado, mais largo

  return (
    <div className="relative flex flex-col items-center w-full max-w-[520px]">
      {/* Container com proporção variável por modo */}
      <div
        className={`relative w-full ${aspectClass} bg-globo-gray rounded-mosaic overflow-hidden shadow-xl ring-1 ring-black/5`}
      >
        {/* Canvas escondido para processamento */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Vídeo ao vivo */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100"
        />

        {/* Preview da moldura */}
        {overlay && (
          <img
            src={overlay}
            alt="Frame Overlay"
            className="absolute top-0 left-0 w-full h-full object-cover z-10 pointer-events-none"
          />
        )}

        {/* Contagem regressiva */}
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

        {/* Estado de erro */}
        {error && (
          <div className="absolute inset-0 z-40 bg-globo-gray flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="w-12 h-12 text-globo-error mb-4" />
            <p className="text-globo-text">{error}</p>
          </div>
        )}
      </div>

      {/* Barra de controles */}
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 z-20">
        {devices.length > 1 && (
          <button
            onClick={switchCamera}
            disabled={isCountingDown}
            className="p-4 rounded-full bg-white text-globo-blue hover:bg-globo-gray transition-colors border-2 border-globo-blue shadow-sm disabled:opacity-50"
          >
            <SwitchCamera size={24} />
          </button>
        )}

        {/* Botão principal de captura */}
        <button
          onClick={handleStartCountdown}
          disabled={isCountingDown || !!error}
          className="group relative flex items-center justify-center rounded-pill bg-globo-blue shadow-lg hover:shadow-xl hover:opacity-90 transition-all disabled:opacity-50 px-10 sm:px-12 py-3.5 sm:py-4"
        >
          <div className="flex items-center gap-3 text-white font-semibold text-base sm:text-lg">
            <Camera size={22} className="sm:size-24" />
            <span>Tirar Foto</span>
          </div>
        </button>

        {/* Seletor de tempo do timer */}
        <div className="flex items-center gap-2 bg-white/90 rounded-pill px-3 py-1.5 shadow-sm border border-black/5">
          <Clock size={16} className="text-globo-blue" />
          <span className="text-[11px] text-globo-textSec mr-1 hidden sm:inline">
            Timer
          </span>
          <div className="flex gap-1">
            {[3, 5, 10].map((value) => {
              const v = value as 3 | 5 | 10;
              const isActive = countdownDuration === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleChangeDuration(v)}
                  disabled={isCountingDown}
                  className={[
                    'px-2 py-1 rounded-full text-[11px] font-semibold transition-all border',
                    isActive
                      ? 'bg-globo-blue text-white border-globo-blue'
                      : 'bg-white text-globo-textSec border-black/5 hover:bg-globo-gray/60',
                    isCountingDown ? 'opacity-60 cursor-not-allowed' : '',
                  ].join(' ')}
                >
                  {v}s
                </button>
              );
            })}
          </div>
        </div>

        {devices.length <= 1 && <div className="w-[58px] hidden sm:block" />}
      </div>
    </div>
  );
};