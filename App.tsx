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

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('setup');
  const [capturedPhoto, setCapturedPhoto] = useState<PhotoData | null>(null);
  const [overlayImage, setOverlayImage] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<PhotoData[]>([]);

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

  const handleOverlayUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setOverlayImage(event.target.result);
        }
      };
      reader.readAsDataURL(file);
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

  return (
    <div className="min-h-screen flex flex-col bg-globo-gradient overflow-hidden relative">
      {/* Header em cima do fundo azul */}
      <header
        className="w-full px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center z-20 absolute top-0 left-0"
      >
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
          <div className="flex items-center gap-4">
            <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white border border-white/40 px-4 sm:px-6 py-2 sm:py-3 rounded-pill flex items-center gap-2 transition-all text-xs sm:text-sm font-medium shadow-sm hover:shadow-md">
              <ImageIcon size={16} className="sm:hidden" />
              <ImageIcon size={18} className="hidden sm:block" />
              <span className="whitespace-nowrap">
                {overlayImage ? 'Trocar moldura (.png)' : 'Carregar moldura (.png)'}
              </span>
              <input
                type="file"
                accept="image/png"
                className="hidden"
                onChange={handleOverlayUpload}
              />
            </label>
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
            {/* Tela de captura 100% azul, mesma lógica visual da tela de resultado */}
            <div className="flex-1 w-full flex items-center justify-center p-3 sm:p-6 lg:p-10 pt-16 sm:pt-20">
              <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center gap-8 lg:gap-16 xl:gap-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
                {/* Esquerda: Live preview grande */}
                <div className="flex-1 flex justify-center lg:justify-end">
                  <div className="relative w-full max-w-[520px] sm:max-w-[620px]">
                    <CameraFeed
                      overlay={overlayImage}
                      onCapture={handleCapture}
                      isCountingDown={appState === 'countdown'}
                      setAppState={setAppState}
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
                    Dica: centralize-se no quadro 4:5 e aguarde a contagem regressiva antes da captura.
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