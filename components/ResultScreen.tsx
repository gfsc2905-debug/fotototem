import React from 'react';
import QRCode from 'react-qr-code';
import { PhotoData } from '../types';
import { Download, RefreshCw, CheckCircle2 } from 'lucide-react';

interface ResultScreenProps {
  photoData: PhotoData;
  onRetake: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ photoData, onRetake }) => {
  const { dataUrl, timestamp } = photoData;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `fotototem_${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-globo-gradient flex items-center justify-center p-3 sm:p-6 lg:p-10 overflow-y-auto">
      <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center gap-8 lg:gap-16 xl:gap-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
        {/* Esquerda: Foto com moldura */}
        <div className="flex-1 flex justify-center lg:justify-end">
          <div className="relative group w-full max-w-[520px] sm:max-w-[620px]">
            <img
              src={dataUrl}
              alt="Captured Result"
              className="w-full h-auto rounded-mosaic shadow-2xl border-[10px] sm:border-[14px] border-white transform rotate-1 transition-transform group-hover:rotate-0 duration-300"
            />
          </div>
        </div>

        {/* Direita: QR + ações */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 max-w-xl w-full text-white">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 leading-tight">
              Ficou ótima! 🎉
            </h2>
            <p className="text-white/80 text-base sm:text-lg">
              Aponte a câmera do seu celular para o QR Code para abrir a foto.
            </p>
          </div>

          {/* Área do QR Code */}
          <div className="p-6 sm:p-8 bg-white rounded-mosaic shadow-xl flex flex-col items-center justify-center gap-4 w-full min-h-[320px] sm:min-h-[380px] lg:min-h-[440px] transition-all text-globo-text">
            <div className="relative animate-in zoom-in duration-300">
              <QRCode value={dataUrl} size={260} level="L" fgColor="#000000" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white p-1.5 rounded-full shadow-sm">
                  <CheckCircle2 size={26} className="text-globo-success" />
                </div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-globo-textSec text-center max-w-xs">
              Se preferir, use também o botão abaixo para salvar a imagem diretamente neste computador.
            </p>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col w-full gap-3 pt-1 sm:pt-2">
            <button
              onClick={handleDownload}
              className="w-full py-3.5 sm:py-4 px-6 bg-white/10 hover:bg-white/20 text-white rounded-pill font-semibold flex items-center justify-center gap-2 transition-all border border-white/30"
            >
              <Download size={20} />
              <span>Salvar no PC</span>
            </button>

            <button
              onClick={onRetake}
              className="w-full py-3.5 sm:py-4 px-6 text-white/80 hover:text-white rounded-pill font-semibold flex items-center justify-center gap-2 transition-all hover:bg-white/5"
            >
              <RefreshCw size={20} />
              <span>Tirar outra foto</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};