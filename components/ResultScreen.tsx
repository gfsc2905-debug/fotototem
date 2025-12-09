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
    <div className="absolute inset-0 w-full h-full bg-globo-gradient flex items-center justify-center p-4 lg:p-12 overflow-y-auto">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-10 lg:gap-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
        {/* Left: The Photo */}
        <div className="flex-1 flex justify-center lg:justify-end">
          <div className="relative group max-w-[400px]">
            <img
              src={photoData.dataUrl}
              alt="Captured Result"
              className="w-full h-auto rounded-mosaic shadow-2xl border-[8px] border-white transform rotate-1 transition-transform group-hover:rotate-0 duration-300"
            />
          </div>
        </div>

        {/* Right: Actions & QR */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 max-w-md w-full text-white">
          <div>
            <h2 className="text-4xl font-bold mb-2">Ficou ótima! 🎉</h2>
            <p className="text-white/80 text-lg">
              {uploadStatus === 'success'
                ? 'Agora é só escanear para baixar.'
                : uploadStatus === 'error'
                ? 'Não conseguimos gerar o link. Mas você pode baixar direto no PC.'
                : 'Gerando link para você baixar pelo celular...'}
            </p>
          </div>

          {/* QR Code Card Area */}
          <div className="p-8 bg-white rounded-mosaic shadow-xl flex flex-col items-center justify-center gap-4 w-full min-h-[280px] transition-all text-globo-text">
            {uploadStatus === 'uploading' || uploadStatus === 'idle' ? (
              <div className="flex flex-col items-center gap-4 text-globo-textSec py-10">
                <Loader2 className="animate-spin text-globo-blue" size={48} />
                <p className="text-sm font-medium">Gerando seu link...</p>
              </div>
            ) : uploadStatus === 'success' && publicUrl ? (
              <>
                <div className="relative animate-in zoom-in duration-300">
                  <QRCode value={publicUrl} size={180} level="L" fgColor="#000000" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white p-1 rounded-full shadow-sm">
                      <CheckCircle2 size={24} className="text-globo-success" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-globo-textSec font-mono max-w-[200px] truncate">
                  {publicUrl}
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-globo-error py-6">
                <AlertCircle size={40} />
                <p className="text-sm font-bold">Erro ao gerar o QR Code</p>
                <p className="text-xs text-globo-textSec text-center">
                  Verifique sua conexão com a internet ou tente novamente tirando outra foto.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col w-full gap-3">
            <button
              onClick={handleDownload}
              className="w-full py-4 px-6 bg-white/10 hover:bg-white/20 text-white rounded-pill font-semibold flex items-center justify-center gap-2 transition-all border border-white/30"
            >
              <Download size={20} />
              Salvar Backup no PC
            </button>

            <button
              onClick={onRetake}
              className="w-full py-4 px-6 text-white/80 hover:text-white rounded-pill font-semibold flex items-center justify-center gap-2 transition-all hover:bg-white/5"
            >
              <RefreshCw size={20} />
              Tirar Outra Foto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};