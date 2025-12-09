import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CameraDevice, AppState } from '../types';
import { SwitchCamera, Camera, AlertCircle } from 'lucide-react';

interface CameraFeedProps {
  overlay: string | null;
  onCapture: (dataUrl: string) => void;
  isCountingDown: boolean;
  setAppState: (state: AppState) => void;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({ 
  overlay, 
  onCapture, 
  isCountingDown, 
  setAppState 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdownValue, setCountdownValue] = useState<number>(3);

  // Função de captura (precisa vir antes do useEffect que a usa)
  const captureImage = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Define output resolution (High Res)
    const OUTPUT_WIDTH = 1080;
    const OUTPUT_HEIGHT = 1350; // 4:5 Aspect Ratio

    canvas.width = OUTPUT_WIDTH;
    canvas.height = OUTPUT_HEIGHT;

    // 1. Draw Video (Center Crop logic)
    const videoAspect = video.videoWidth / video.videoHeight;
    const canvasAspect = OUTPUT_WIDTH / OUTPUT_HEIGHT;
    
    let drawWidth, drawHeight, offsetX, offsetY;

    if (videoAspect > canvasAspect) {
      // Video is wider than canvas (crop sides)
      drawHeight = OUTPUT_HEIGHT;
      drawWidth = OUTPUT_HEIGHT * videoAspect;
      offsetX = (OUTPUT_WIDTH - drawWidth) / 2; // will be negative
      offsetY = 0;
    } else {
      // Video is taller than canvas (crop top/bottom)
      drawWidth = OUTPUT_WIDTH;
      drawHeight = OUTPUT_WIDTH / videoAspect;
      offsetX = 0;
      offsetY = (OUTPUT_HEIGHT - drawHeight) / 2;
    }

    // Mirroring context for selfie mode feel
    ctx.save();
    ctx.translate(OUTPUT_WIDTH, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();

    // 2. Draw Overlay
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
  }, [overlay]);

  const finalizeCapture = (canvas: HTMLCanvasElement) => {
    const dataUrl = canvas.toDataURL('image/png', 0.9);
    onCapture(dataUrl);
  };

  // Initialize Camera
  useEffect(() => {
    const getCameras = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true }); // Request permission first
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices
          .filter(device => device.kind === 'videoinput')
          .map(d => ({ deviceId: d.deviceId, label: d.label || `Camera ${d.deviceId.slice(0, 5)}...` }));
        
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setCurrentDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        setError("Não foi possível acessar a câmera. Verifique as permissões.");
        console.error(err);
      }
    };
    getCameras();
  }, []);

  // Start Stream
  useEffect(() => {
    if (!currentDeviceId) return;

    const startStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: currentDeviceId },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing stream:", err);
        setError("Erro ao iniciar o vídeo da câmera.");
      }
    };

    startStream();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [currentDeviceId]);

  // Handle Countdown (usa captureImage já declarado acima)
  useEffect(() => {
    if (!isCountingDown) return;

    setCountdownValue(3);
    const interval = setInterval(() => {
      setCountdownValue(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          captureImage();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCountingDown, captureImage]);

  const switchCamera = () => {
    const currentIndex = devices.findIndex(d => d.deviceId === currentDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    setCurrentDeviceId(devices[nextIndex].deviceId);
  };

  return (
    <div className="relative flex flex-col items-center w-full max-w-[520px]">
      {/* Container for aspect ratio 4:5 - Mosaic Style (15px radius) */}
      <div className="relative w-full aspect-[4/5] bg-globo-gray rounded-mosaic overflow-hidden shadow-xl ring-1 ring-black/5">
        
        {/* Hidden processing canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Live Video Feed - sempre nítido */}
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted 
          className="absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100"
        />

        {/* Overlay Preview */}
        {overlay && (
          <img 
            src={overlay} 
            alt="Frame Overlay" 
            className="absolute top-0 left-0 w-full h-full object-cover z-10 pointer-events-none"
          />
        )}

        {/* Countdown lateral (sem escurecer a tela) */}
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

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 z-40 bg-globo-gray flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="w-12 h-12 text-globo-error mb-4" />
            <p className="text-globo-text">{error}</p>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="mt-6 flex items-center gap-6 z-20">
        {devices.length > 1 && (
          <button 
            onClick={switchCamera}
            disabled={isCountingDown}
            className="p-4 rounded-full bg-white text-globo-blue hover:bg-globo-gray transition-colors border-2 border-globo-blue shadow-sm disabled:opacity-50"
          >
            <SwitchCamera size={24} />
          </button>
        )}

        <button 
          onClick={() => setAppState('countdown')}
          disabled={isCountingDown || !!error}
          className="group relative flex items-center justify-center rounded-pill bg-globo-blue shadow-lg hover:shadow-xl hover:opacity-90 transition-all disabled:opacity-50 px-12 py-4"
        >
          <div className="flex items-center gap-3 text-white font-semibold text-lg">
            <Camera size={24} />
            <span>Tirar Foto</span>
          </div>
        </button>
        
        {devices.length <= 1 && <div className="w-[58px] hidden sm:block" />} 
      </div>
    </div>
  );
};