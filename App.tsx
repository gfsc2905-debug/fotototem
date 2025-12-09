import React, { useState } from 'react';
import { CameraFeed } from './components/CameraFeed';
import { ResultScreen } from './components/ResultScreen';
import { PhotoData, AppState } from './types';
import { Image as ImageIcon } from 'lucide-react';

const GloboLogo = () => (
  <svg width="40" height="40" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-globo-blue">
    <g clipPath="url(#clip0_1_2)">
    <path fillRule="evenodd" clipRule="evenodd" d="M250 500C388.071 500 500 388.071 500 250C500 111.929 388.071 0 250 0C111.929 0 0 111.929 0 250C0 388.071 111.929 500 250 500Z" fill="currentColor"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M250 392.857C328.898 392.857 392.857 328.898 392.857 250C392.857 171.102 328.898 107.143 250 107.143C171.102 107.143 107.143 171.102 107.143 250C107.143 328.898 171.102 392.857 250 392.857Z" fill="white"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M250 335.714C297.335 335.714 335.714 297.335 335.714 250C335.714 202.665 297.335 164.286 250 164.286C202.665 164.286 164.286 202.665 164.286 250C164.286 297.335 202.665 335.714 250 335.714Z" fill="url(#paint0_linear_1_2)"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M192.857 250H107.143C107.143 171.102 171.102 107.143 250 107.143V192.857C218.442 192.857 192.857 218.442 192.857 250Z" fill="white"/>
    </g>
    <defs>
    <linearGradient id="paint0_linear_1_2" x1="164.286" y1="250" x2="335.714" y2="250" gradientUnits="userSpaceOnUse">
    <stop stopColor="#05A6FF"/>
    <stop offset="1" stopColor="#086DFF"/>
    </linearGradient>
    <clipPath id="clip0_1_2">
    <rect width="500" height="500" fill="white"/>
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

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden relative">
      
      {/* Header Institucional */}
      <header className={`w-full p-6 flex justify-between items-center z-20 transition-all duration-300 ${appState === 'result' ? 'absolute top-0 left-0 bg-transparent' : 'bg-white'}`}>
        <div className="flex items-center gap-4">
          <div className={appState === 'result' ? 'bg-white rounded-full p-1' : ''}>
            <GloboLogo />
          </div>
          <h1 className={`text-2xl font-normal tracking-tight ${appState === 'result' ? 'text-white' : 'text-globo-text'}`}>
            Fotototem
          </h1>
        </div>
        
        {appState === 'setup' && (
          <div className="flex items-center gap-4">
            <label className="cursor-pointer bg-white hover:bg-globo-gray text-globo-blue border-2 border-globo-blue px-6 py-3 rounded-pill flex items-center gap-2 transition-all text-sm font-medium shadow-sm hover:shadow-md">
              <ImageIcon size={18} />
              <span>{overlayImage ? 'Trocar Moldura' : 'Carregar Moldura (.png)'}</span>
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
      <main className="flex-1 w-full flex flex-col items-center justify-center">
        {appState === 'result' && capturedPhoto ? (
          <ResultScreen 
            photoData={capturedPhoto} 
            onRetake={handleRetake} 
          />
        ) : (
          <div className="flex flex-col items-center gap-6 w-full max-w-4xl px-4 animate-in fade-in duration-500">
            <div className="text-center space-y-2 mb-2">
              <h2 className="text-3xl font-bold text-globo-text">Que bom ter você aqui.</h2>
              <p className="text-globo-textSec text-lg">Vamos registrar esse momento?</p>
            </div>
            
            <CameraFeed 
              overlay={overlayImage} 
              onCapture={handleCapture}
              isCountingDown={appState === 'countdown'}
              setAppState={setAppState}
            />
          </div>
        )}
      </main>

      {/* Footer / Barra Multicolorida */}
      <footer className="w-full h-2 bg-multicolor-bar sticky bottom-0 z-50"></footer>
    </div>
  );
};

export default App;