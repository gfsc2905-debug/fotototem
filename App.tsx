import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CameraFeed, CameraFeedHandle } from './components/CameraFeed';
import { ResultScreen } from './components/ResultScreen';
import { PhotoData, AppState, CameraDevice } from './types';
import { Image as ImageIcon, Sparkles, Camera as CameraIcon, Clock, SwitchCamera } from 'lucide-react';
import { Gallery } from './components/Gallery';
import { supabase } from './supabaseClient';
import { RemoteControl } from './components/RemoteControl';

const GloboLogo = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 500 500"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-globo-blue flex-shrink-0"
  >
    <g clipPath="url(#clip0_1_2)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M250 500C388.071 500 500 388.071 500 250C500 111.929 388.071 0 250 0C111.929 0 0 111.929 0 250C0 388.071 111.929 500 250 500Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M250 392.857C328.898 392.857 392.857 328.898 392.857 250C392.857 171.102 328.898 107.143 250 107.143C171.102 107.143 107.143 171.102 107.143 250C107.143 328.898 171.102 392.857 250 392.857Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M250 335.714C297.335 335.714 335.714 297.335 335.714 250C335.714 202.665 297.335 164.286 250 164.286C202.665 164.286 164.286 202.665 164.286 250C164.286 297.335 202.665 335.714 250 335.714Z"
        fill="url(#paint0_linear_1_2)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M192.857 250H107.143C107.143 171.102 171.102 107.143 250 107.143V192.857C218.442 192.857 192.857 218.442 192.857 250Z"
        fill="white"
      />
    </g>
    <defs>
      <linearGradient
        id="paint0_linear_1_2"
        x1="164.286"
        y1="250"
        x2="335.714"
        y2="250"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#05A6FF" />
        <stop offset="1" stopColor="#086DFF" />
      </linearGradient>
      <clipPath id="clip0_1_2">
        <rect width="500" height="500" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const MAX_GALLERY_ITEMS = 20;
const BUCKET_NAME = 'fotototem';

type FrameMode = 'portrait' | 'landscape';

const generateSessionCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

const App: React.FC = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const isRemoteView = searchParams.get('view') === 'remote';

  if (isRemoteView) {
    return <RemoteControl />;
  }

  const [sessionCode] = useState<string>(() => generateSessionCode());
  const channelName = useMemo(
    () => `fotototem-remote-${sessionCode}`,
    [sessionCode]
  );

  const [appState, setAppState] = useState<AppState>('setup');
  const [capturedPhoto, setCapturedPhoto] = useState<PhotoData | null>(null);
  const [portraitOverlay, setPortraitOverlay] = useState<string | null>(null);
  const [landscapeOverlay, setLandscapeOverlay] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<PhotoData[]>([]);
  const [frameMode, setFrameMode] = useState<FrameMode>('portrait');

  const [countdownDuration, setCountdownDuration] = useState<3 | 5 | 10>(3);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [portraitPreviewWidth, setPortraitPreviewWidth] = useState<number>(600);
  const [landscapePreviewWidth, setLandscapePreviewWidth] = useState<number>(800);

  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const isResizingRef = useRef(false);

  const [globalCountdownValue, setGlobalCountdownValue] = useState<number | null>(null);

  const cameraRef = useRef<CameraFeedHandle | null>(null);

  const handleResetToSetup = () => {
    setCapturedPhoto(null);
    setAppState('setup');
  };

  // Canal de controle remoto
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'remote-command' }, (payload) => {
        const {
          action,
          mode,
          timer,
        } = payload.payload as {
          action?: 'take_photo' | 'ping' | 'set_mode' | 'set_timer' | 'reset';
          mode?: FrameMode;
          timer?: 3 | 5 | 10;
        };

        if (action === 'take_photo') {
          handleStartCountdown();
        } else if (action === 'set_mode' && mode) {
          setFrameMode(mode);
        } else if (action === 'set_timer' && timer) {
          setCountdownDuration(timer);
        } else if (action === 'reset') {
          handleResetToSetup();
        }
      });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (!previewContainerRef.current) return;
      const rect = previewContainerRef.current.getBoundingClientRect();
      const nearRightEdge = event.clientX > rect.right - 16 && event.clientX <= rect.right + 4;
      if (nearRightEdge) {
        isResizingRef.current = true;
      }
    };

    const handleMouseUp = () => {
      if (!isResizingRef.current || !previewContainerRef.current) {
        isResizingRef.current = false;
        return;
      }
      const rect = previewContainerRef.current.getBoundingClientRect();
      const newWidth = rect.width;

      if (frameMode === 'portrait') {
        setPortraitPreviewWidth(newWidth);
      } else {
        setLandscapePreviewWidth(newWidth);
      }

      isResizingRef.current = false;
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [frameMode]);

  useEffect(() => {
    if (appState !== 'countdown') {
      setGlobalCountdownValue(null);
      return;
    }

    setGlobalCountdownValue(countdownDuration);
    const interval = setInterval(() => {
      setGlobalCountdownValue((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          const next = 0;
          if (cameraRef.current) {
            cameraRef.current.capture();
          }
          return next;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [appState, countdownDuration]);

  const handleCapture = (dataUrl: string) => {
    const photo: PhotoData = {
      dataUrl,
      timestamp: Date.now(),
    };

    setCapturedPhoto(photo);
    setAppState('result');

    setGalleryPhotos((prev) => {
      const updated = [photo, ...prev];
      return updated.slice(0, MAX_GALLERY_ITEMS);
    });
  };

  const handleRetake = () => {
    handleResetToSetup();
  };

  const readOverlayFile = (
    file: File,
    setter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setter(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePortraitOverlayUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readOverlayFile(file, setPortraitOverlay);
    }
  };

  const handleLandscapeOverlayUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readOverlayFile(file, setLandscapeOverlay);
    }
  };

  const handlePublicUrlReady = (updatedPhoto: PhotoData, publicUrl: string) => {
    setCapturedPhoto(updatedPhoto);
    setGalleryPhotos((prev) =>
      prev.map((p) =>
        p.timestamp === updatedPhoto.timestamp ? { ...p, publicUrl } : p
      )
    );
  };

  const handleSelectFromGallery = async (photo: PhotoData) => {
    let photoWithUrl = photo;

    if (!photo.publicUrl && supabase) {
      const fileName = `foto_${photo.timestamp}.png`;
      const dateFolder = new Date(photo.timestamp).toISOString().slice(0, 10);
      const filePath = `${dateFolder}/${fileName}`;

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

      if (publicUrl) {
        photoWithUrl = { ...photo, publicUrl };
        setGalleryPhotos((prev) =>
          prev.map((p) =>
            p.timestamp === photo.timestamp ? { ...p, publicUrl } : p
          )
        );
      }
    }

    setCapturedPhoto(photoWithUrl);
    setAppState('result');
  };

  const isResult = appState === 'result';

  const currentOverlay = frameMode === 'portrait' ? portraitOverlay : landscapeOverlay;

  const handleStartCountdown = () => {
    if (cameraError) return;
    if (appState === 'countdown') return;
    setAppState('countdown');
  };

  const handleChangeDuration = (value: 3 | 5 | 10) => {
    if (appState === 'countdown') return;
    setCountdownDuration(value);
  };

  const handleSwitchCamera = () => {
    if (!devices.length) return;

    if (!activeDeviceId) {
      setActiveDeviceId(devices[0].deviceId);
      return;
    }

    const currentIndex = devices.findIndex((d) => d.deviceId === activeDeviceId);
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = (safeIndex + 1) % devices.length;
    setActiveDeviceId(devices[nextIndex].deviceId);
  };

  const currentPreviewWidth =
    frameMode === 'portrait' ? portraitPreviewWidth : landscapePreviewWidth;

  return (
    <div className="min-h-screen flex flex-col bg-globo-gradient overflow-hidden relative">
      {appState === 'countdown' && globalCountdownValue !== null && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none bg-black/30">
          <div className="flex flex-col items-center gap-4">
            <span className="text-xl sm:text-2xl font-semibold uppercase tracking-[0.2em] text-white/90">
              Foto em
            </span>
            <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-full bg-black/65 flex items-center justify-center shadow-[0_0_60px_rgba(0,0,0,0.7)] border-4 border-white/70">
              <span className="text-6xl sm:text-7xl md:text-8xl font-bold text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.9)]">
                {globalCountdownValue > 0 ? globalCountdownValue : '📸'}
              </span>
            </div>
          </div>
        </div>
      )}

      <header className="w-full px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center z-20 absolute top-0 left-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="bg-white rounded-full p-1 shadow-sm">
            <GloboLogo />
          </div>
          <div className="flex flex-col leading-tight">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
              Fotototem
            </h1>
            <span className="text-xs sm:text-sm font-medium text-white/80">
              Globo • Uso interno
            </span>
            <span className="mt-1 text-[11px] sm:text-xs text-white/80">
              Código do totem:{' '}
              <span className="font-semibold tracking-[0.3em] bg-white/10 rounded-pill px-2 py-0.5">
                {sessionCode}
              </span>
            </span>
          </div>
        </div>

      {appState === 'setup' && (
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1 bg-white/10 border border-white/40 rounded-pill px-2 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs text-white shadow-sm">
              <span className="hidden sm:inline text-white/80 mr-1">Modo</span>
              <button
                type="button"
                onClick={() => setFrameMode('portrait')}
                className={[
                  'px-2 py-1 rounded-full font-semibold transition-all',
                  frameMode === 'portrait'
                    ? 'bg-white text-globo-blue'
                    : 'text-white/70 hover:bg-white/10',
                ].join(' ')}
              >
                Em pé
              </button>
              <button
                type="button"
                onClick={() => setFrameMode('landscape')}
                className={[
                  'px-2 py-1 rounded-full font-semibold transition-all',
                  frameMode === 'landscape'
                    ? 'bg-white text-globo-blue'
                    : 'text-white/70 hover:bg-white/10',
                ].join(' ')}
              >
                Deitado
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white border border-white/40 px-3 sm:px-4 py-1.5 sm:py-2 rounded-pill flex items-center gap-2 transition-all text-[11px] sm:text-xs font-medium shadow-sm hover:shadow-md">
                <ImageIcon size={14} />
                <span className="whitespace-nowrap">
                  {portraitOverlay ? 'Trocar moldura em pé' : 'Moldura em pé (.png)'}
                </span>
                <input
                  type="file"
                  accept="image/png"
                  className="hidden"
                  onChange={handlePortraitOverlayUpload}
                />
              </label>

              <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white border border-white/40 px-3 sm:px-4 py-1.5 sm:py-2 rounded-pill flex items-center gap-2 transition-all text-[11px] sm:text-xs font-medium shadow-sm hover:shadow-md">
                <ImageIcon size={14} />
                <span className="whitespace-nowrap">
                  {landscapeOverlay ? 'Trocar moldura deitada' : 'Moldura deitada (.png)'}
                </span>
                <input
                  type="file"
                  accept="image/png"
                  className="hidden"
                  onChange={handleLandscapeOverlayUpload}
                />
              </label>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 w-full flex flex-col">
        {isResult && capturedPhoto ? (
          <ResultScreen
            photoData={capturedPhoto}
            onRetake={handleRetake}
            onPublicUrlReady={handlePublicUrlReady}
          />
        ) : (
          <>
            <div className="flex-1 w-full flex items-center justify-center px-4 sm:px-6 lg:px-10 pt-20 sm:pt-24 pb-2 sm:pb-3">
              <div className="w-full max-w-7xl flex flex-col lg:flex-row items-start lg:items-center justify-center gap-8 lg:gap-12 xl:gap-16 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="w-full lg:w-auto flex justify-center lg:justify-start">
                  <div
                    ref={previewContainerRef}
                    className="bg-transparent"
                    style={{
                      width: `${currentPreviewWidth}px`,
                      maxWidth: '100%',
                      minWidth: 260,
                      resize: 'horizontal',
                      overflow: 'hidden',
                    }}
                  >
                    <CameraFeed
                      ref={cameraRef}
                      overlay={currentOverlay}
                      onCapture={handleCapture}
                      isCountingDown={appState === 'countdown'}
                      mode={frameMode}
                      countdownDuration={countdownDuration}
                      activeDeviceId={activeDeviceId}
                      onDevicesChange={setDevices}
                      onActiveDeviceChange={setActiveDeviceId}
                      onErrorChange={setCameraError}
                    />
                  </div>
                </div>

                <div className="w-full lg:flex-1 flex flex-col justify-center gap-6 text-white">
                  <div className="text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-white/10 text-white text-xs sm:text-sm font-medium mb-3">
                      <Sparkles size={16} />
                      <span>Registre sua presença com uma foto especial</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 leading-tight">
                      Que bom ter você aqui.
                    </h2>
                    <p className="text-white/85 text-sm sm:text-base lg:text-lg max-w-xl mx-auto lg:mx-0">
                      Posicione-se em frente à câmera, ajuste a moldura e clique em{' '}
                      <span className="font-semibold">“Tirar Foto”</span> para registrar esse momento com a Globo.
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-white/80 max-w-sm mx-auto lg:mx-0">
                    Dica: centralize-se no quadro e aguarde a contagem regressiva antes da captura.
                  </p>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <button
                        onClick={handleStartCountdown}
                        disabled={appState === 'countdown' || !!cameraError}
                        className="flex-1 group relative flex items-center justify-center rounded-pill bg-white text-globo-blue shadow-lg hover:shadow-xl hover:opacity-95 transition-all disabled:opacity-60 px-8 py-3.5 sm:py-4"
                      >
                        <div className="flex items-center gap-3 font-semibold text-base sm:text-lg">
                          <CameraIcon size={22} />
                          <span>Tirar Foto</span>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 bg-white/15 rounded-pill px-3 py-1.5 shadow-sm border border-white/30">
                        <Clock size={16} className="text-white" />
                        <span className="text-[11px] text-white/80 mr-1 hidden sm:inline">
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
                                disabled={appState === 'countdown'}
                                className={[
                                  'px-2 py-1 rounded-full text-[11px] font-semibold transition-all border',
                                  isActive
                                    ? 'bg-white text-globo-blue border-white'
                                    : 'bg-transparent text-white/80 border-white/30 hover:bg-white/10',
                                  appState === 'countdown' ? 'opacity-60 cursor-not-allowed' : '',
                                ].join(' ')}
                              >
                                {v}s
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {devices.length > 1 && (
                      <button
                        type="button"
                        onClick={handleSwitchCamera}
                        disabled={appState === 'countdown'}
                        className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-white/10 border border-white/40 text-white text-xs sm:text-sm font-medium hover:bg-white/20 transition-all disabled:opacity-60"
                      >
                        <SwitchCamera size={18} />
                        <span>Trocar câmera</span>
                      </button>
                    )}

                    {cameraError && (
                      <p className="text-xs sm:text-sm text-red-100 max-w-sm">
                        {cameraError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Gallery photos={galleryPhotos} onSelect={handleSelectFromGallery} />
          </>
        )}
      </main>

      <footer className="w-full h-3 sm:h-3.5 bg-multicolor-bar sticky bottom-0 z-50"></footer>
    </div>
  );
};

export default App;