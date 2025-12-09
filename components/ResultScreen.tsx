import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { PhotoData } from '../types';
import { Download, RefreshCw, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

// API key fixa do ImgBB fornecida pelo usuário
const IMGBB_API_KEY = '9877b1250225b299b704b0e01d4ccd53';

interface ResultScreenProps {
  photoData: PhotoData;
  onRetake: () => void;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export const ResultScreen: React.FC<ResultScreenProps> = ({ photoData, onRetake }) => {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [publicUrl, setPublicUrl] = useState<string | null>(null);

  // Faz o upload automaticamente ao entrar na tela de resultado
  useEffect(() => {
    const uploadImage = async () => {
      setUploadStatus('uploading');

      // Remove prefixo data URL
      const base64Image = photoData.dataUrl.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');

      const formData = new FormData();
      formData.append('image', base64Image);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setPublicUrl(data.data.url);
        setUploadStatus('success');
      } else {
        console.error('Erro ImgBB:', data);
        setUploadStatus('error');
      }
    };

    uploadImage();
  }, [photoData.dataUrl]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = photoData.dataUrl;
    link.download = `fotototem_${photoData.timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-globo-gradient flex items-center justify-center p-3 sm:p-6 lg:p-10 overflow-y-auto">
      <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center gap-8 lg:gap-16 xl:gap-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
        {/* Left: The Photo */}
        <div className="flex-1 flex justify-center lg:justify-end">
          <div className="relative group w-full max-w-[460px] sm:max-w-[520px]">
            <img
              src={photoData.dataUrl}
              alt="Captured Result"
              className="w-full h-auto rounded-mosaic shadow-2xl border-[10px] sm:border-[12px] border-white transform rotate-1 transition-transform group-hover:rotate-0 duration-300"
            />
          </div>
        </div>

        {/* Right: Actions & QR */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 max-w-lg w-full text-white">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 leading-tight">
              Ficou ótima! 🎉
            </h2>
            <p className="text-white/80 text-base sm:text-lg">
              {uploadStatus === 'success'
                ? 'Agora é só escanear para baixar.'
                : uploadStatus === 'error'
                ? 'Não conseguimos gerar o link. Mas você pode baixar direto no PC.'
                : 'Gerando link para você baixar pelo celular...'}
            </p>
          </div>

          {/* QR Code Card Area */}
          <div className="p-6 sm:p-8 bg-white rounded-mosaic shadow-xl flex flex-col items-center justify-center gap-4 w-full min-h-[260px] sm:min-h-[320px] lg:min-h-[360px] transition-all text-globo-text">
            {uploadStatus === 'uploading' || uploadStatus === 'idle' ? (
              <div className="flex flex-col items-center gap-4 text-globo-textSec py-8 sm:py-10">
                <Loader2 className="animate-spin text-globo-blue" size={52} />
                <p className="text-sm sm:text-base font-medium text-center max-w-xs">
                  Gerando seu link...
                </p>
              </div>
            ) : uploadStatus === 'success' && publicUrl ? (
              <>
                <div className="relative animate-in zoom-in duration-300">
                  <QRCode value={publicUrl} size={210} level="L" fgColor="#000000" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white p-1.5 rounded-full shadow-sm">
                      <CheckCircle2 size={26} className="text-globo-success" />
                    </div>
                  </div>
                </div>
                <p className="text-[11px] sm:text-xs text-globo-textSec font-mono max-w-[260px] truncate">
                  {publicUrl}
                </p>
                <p className="text-xs sm:text-sm text-globo-textSec text-center max-w-xs">
                  Aponte a câmera do seu celular para o QR Code para abrir a foto.
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-globo-error py-6">
                <AlertCircle size={44} />
                <p className="text-sm sm:text-base font-bold">Erro ao gerar o QR Code</p>
                <p className="text-xs sm:text-sm text-globo-textSec text-center max-w-xs">
                  Verifique sua conexão com a internet ou tente novamente tirando outra foto.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col w-full gap-3 pt-1 sm:pt-2">
            <button
              onClick={handleDownload}
              className="w-full py-3.5 sm:py-4 px-6 bg-white/10 hover:bg-white/20 text-white rounded-pill font-semibold flex items-center justify-center gap-2 transition-all border border-white/30"
            >
              <Download size={20} />
              <span>Salvar Backup no PC</span>
            </button>

            <button
              onClick={onRetake}
              className="w-full py-3.5 sm:py-4 px-6 text-white/80 hover:text-white rounded-pill font-semibold flex items-center justify-center gap-2 transition-all hover:bg-white/5"
            >
              <RefreshCw size={20} />
              <span>Tirar Outra Foto</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};