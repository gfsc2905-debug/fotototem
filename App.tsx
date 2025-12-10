import React, { useState } from 'react';
import { CameraFeed } from './components/CameraFeed';
import { ResultScreen } from './components/ResultScreen';
import { PhotoData, AppState } from './types';
import { Image as ImageIcon, Sparkles } from 'lucide-react';
import { Gallery } from './components/Gallery';
import { supabase } from './supabaseClient';

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

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('setup');
  const [capturedPhoto, setCapturedPhoto] = useState<PhotoData | null>(null);
  const [portraitOverlay, setPortraitOverlay] = useState<string | null>(null);
  const [landscapeOverlay, setLandscapeOverlay] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<PhotoData[]>([]);
  const [frameMode, setFrameMode] = useState<FrameMode>('portrait');

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
    setCapturedPhoto(null);
    setAppState('setup');
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

  // Escolhe a moldura correta para o modo atual
  const currentOverlay = frameMode === 'portrait' ? portraitOverlay : landscapeOverlay;

  return (
    <div className="min-h-screen flex flex-col bg-globo-gradient overflow-hidden relative">
      {/* Header em cima do fundo azul */}
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
          </div>
        </div>

        {appState === 'setup' && (
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Seletor de modo: em pé / deitado */}
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

            {/* Upload das duas molduras */}
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

      {/* Main Content */}
      <main className="flex-1 w-full flex flex-col">
        {isResult && capturedPhoto ? (
          <ResultScreen
            photoData={capturedPhoto}
            onRetake={handleRetake}
            onPublicUrlReady={handlePublicUrlReady}
          />
        ) : (
          <>
            {/* Tela de captura 100% azul, conteúdo centralizado */}
            <div className="flex-1 w-full flex items-center justify-center px-3 sm:px-6 lg:px-10 pt-20 sm:pt-24 pb-6">
              <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 xl:gap-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
                {/* Esquerda: Live preview grande */}
                <div className="flex-1 flex justify-center">
                  <div className="relative w-full max-w-[540px] sm:max-w-[620px]">
                    <CameraFeed
                      overlay={currentOverlay}
                      onCapture={handleCapture}
                      isCountingDown={appState === 'countdown'}
                      setAppState={setAppState}
                      mode={frameMode}
                    />
                  </div>
                </div>

                {/* Direita: instruções em branco */}
                <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 max-w-xl w-full text-white">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-white/10 text-white text-xs sm:text-sm font-medium mb-3">
                      <Sparkles size={16} />
                      <span>Registre sua presença com uma foto especial</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 leading-tight">
                      Que bom ter você aqui.
                    </h2>
                    <p className="text-white/85 text-sm sm:text-base lg:text-lg max-w-xl">
                      Posicione-se em frente à câmera, ajuste a moldura e clique em{' '}
                      <span className="font-semibold">“Tirar Foto”</span> para registrar esse momento com a Globo.
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm text-white/80 max-w-sm">
                    Dica: centralize-se no quadro e aguarde a contagem regressiva antes da captura.
                  </p>
                </div>
              </div>
            </div>

            {/* Galeria sobre fundo azul (cartão branco) */}
            <div className="pb-4 sm:pb-6">
              <Gallery photos={galleryPhotos} onSelect={handleSelectFromGallery} />
            </div>
          </>
        )}
      </main>

      {/* Footer / Barra Multicolorida */}
      <footer className="w-full h-3 sm:h-3.5 bg-multicolor-bar sticky bottom-0 z-50"></footer>
    </div>
  );
};

export default App;