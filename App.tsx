import React, { useState } from 'react';
import { CameraFeed } from './components/CameraFeed';
import { ResultScreen } from './components/ResultScreen';
import { PhotoData, AppState } from './types';
import { Image as ImageIcon, Sparkles } from 'lucide-react';

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

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('setup');
  const [capturedPhoto, setCapturedPhoto] = useState<PhotoData | null>(null);
  const [overlayImage, setOverlayImage] = useState<string | null>(null);

  const handleCapture = (dataUrl: string) => {
    setCapturedPhoto({
      dataUrl,
      timestamp: Date.now(),
    });
    setAppState('result');
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

  const isResult = appState === 'result';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-globo-blue/10 via-white to-globo-blue/5 overflow-hidden relative">
      {/* Header Institucional */}
      <header
        className={`w-full px-4 sm:px-8 py-3 sm:py-4 flex justify-between items-center z-20 transition-all duration-300 ${
          isResult ? 'absolute top-0 left-0 bg-transparent' : 'bg-white/90 backdrop-blur'
        } shadow-sm`}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={isResult ? 'bg-white rounded-full p-1 shadow-sm' : 'bg-white rounded-full p-1 shadow-sm'}>
            <GloboLogo />
          </div>
          <div className="flex flex-col leading-tight">
            <h1
              className={`text-xl sm:text-2xl font-semibold tracking-tight ${
                isResult ? 'text-white' : 'text-globo-text'
              }`}
            >
              Fotototem
            </h1>
            <span
              className={`text-xs sm:text-sm font-medium ${
                isResult ? 'text-white/80' : 'text-globo-textSec'
              }`}
            >
              Globo • Uso interno
            </span>
          </div>
        </div>

        {/* Botão de moldura só na tela de setup */}
        {appState === 'setup' && (
          <div className="flex items-center gap-4">
            <label className="cursor-pointer bg-white hover:bg-globo-gray text-globo-blue border border-globo-blue px-4 sm:px-6 py-2 sm:py-3 rounded-pill flex items-center gap-2 transition-all text-xs sm:text-sm font-medium shadow-sm hover:shadow-md">
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
      <main className="flex-1 w-full flex flex-col items-center justify-center pt-20 sm:pt-24 pb-4 sm:pb-6">
        {isResult && capturedPhoto ? (
          <ResultScreen photoData={capturedPhoto} onRetake={handleRetake} />
        ) : (
          <div className="flex flex-col items-center gap-6 sm:gap-8 w-full max-w-6xl px-3 sm:px-6 lg:px-10 animate-in fade-in duration-500">
            {/* Bloco de boas-vindas azul */}
            <div className="w-full max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-globo-blue/10 text-globo-blue text-xs sm:text-sm font-medium mb-3">
                <Sparkles size={16} />
                <span>Registre sua presença com uma foto especial</span>
              </div>
              <div className="bg-globo-blue text-white rounded-mosaic px-5 sm:px-8 py-5 sm:py-6 shadow-lg inline-flex flex-col items-center gap-2 w-full">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                  Que bom ter você aqui.
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-white/90 max-w-2xl">
                  Posicione-se em frente à câmera, sorria e clique em <span className="font-semibold">“Tirar Foto”</span> para registrar esse momento com a Globo.
                </p>
              </div>
            </div>

            {/* Câmera centralizada */}
            <div className="w-full flex justify-center">
              <CameraFeed
                overlay={overlayImage}
                onCapture={handleCapture}
                isCountingDown={appState === 'countdown'}
                setAppState={setAppState}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer / Barra Multicolorida */}
      <footer className="w-full h-3 sm:h-3.5 bg-multicolor-bar sticky bottom-0 z-50"></footer>
    </div>
  );
};

export default App;