import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { PhotoData } from '../types';
import { Download, RefreshCw, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ResultScreenProps {
  photoData: PhotoData;
  onRetake: () => void;
  onPublicUrlReady?: (photo: PhotoData, publicUrl: string) => void;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error' | 'disabled';

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY as string | undefined;

export const ResultScreen: React.FC<ResultScreenProps> = ({ photoData, onRetake, onPublicUrlReady }) => {
  const { dataUrl, timestamp, publicUrl: initialPublicUrl } = photoData;

  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [publicUrl, setPublicUrl] = useState<string | null>(initialPublicUrl ?? null);

  useEffect(() => {
    const run = async () => {
      if (!IMGBB_API_KEY) {
        setUploadStatus('disabled');
        return;
      }

      if (initialPublicUrl) {
        setPublicUrl(initialPublicUrl);
        setUploadStatus('success');
        return;
      }

      setUploadStatus('uploading');

      // dataUrl está em formato data:image/png;base64,...
      const base64 = dataUrl.split(',')[1];

      const formData = new FormData();
      formData.append('image', base64);
      formData.append('name', `fotototem_${timestamp}`);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(IMGBB_API_KEY)}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.error('Erro HTTP ao enviar para ImgBB:', response.status, response.statusText);
        setUploadStatus('error');
        return;
      }

      const result = await response.json();

      if (!result.success || !result.data?.url) {
        console.error('Resposta inesperada do ImgBB:', result);
        setUploadStatus('error');
        return;
      }

      const url: string = result.data.url;

      setPublicUrl(url);
      setUploadStatus('success');

      if (url && onPublicUrlReady) {
        onPublicUrlReady(
          { ...photoData, publicUrl: url },
          url
        );
      }
    };

    run();
  }, [dataUrl, timestamp, initialPublicUrl, photoData, onPublicUrlReady]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `fotototem_${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderHelperText = () => {
    if (uploadStatus === 'success') {
      return 'Aponte a câmera do seu celular para o QR Code para abrir a foto.';
    }
    if (uploadStatus === 'uploading' || uploadStatus === 'idle') {
      return 'Gerando seu link para compartilhamento...';
    }
    if (uploadStatus === 'disabled') {
      return 'Não foi possível gerar um link na nuvem (ImgBB não configurado), mas você ainda pode salvar a foto neste computador.';
    }
    return 'Não conseguimos gerar o link automaticamente. Você ainda pode salvar a foto neste computador.';
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-globo-gradient flex items-center justify-center p-3 sm:p-6 lg:p-10 overflow-y-auto">
      <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center gap-8 lg:gap-16 xl:gap-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
        {/* Esquerda: Foto */}
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
              {renderHelperText()}
            </p>
          </div>

          {/* QR / Status */}
          <div className="p-6 sm:p-8 bg-white rounded-mosaic shadow-xl flex flex-col items-center justify-center gap-4 w-full min-h-[320px] sm:minh-[380px] lg:min-h-[440px] transition-all text-globo-text">
            {uploadStatus === 'uploading' || uploadStatus === 'idle' ? (
              <div className="flex flex-col items-center gap-4 text-globo-textSec py-10">
                <Loader2 className="animate-spin text-globo-blue" size={60} />
                <p className="text-sm sm:text-base font-medium text-center max-w-xs">
                  Gerando seu link...
                </p>
              </div>
            ) : uploadStatus === 'success' && publicUrl ? (
              <>
                <div className="relative animate-in zoom-in duration-300">
                  <QRCode value={publicUrl} size={260} level="L" fgColor="#000000" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white p-1.5 rounded-full shadow-sm">
                      <CheckCircle2 size={26} className="text-globo-success" />
                    </div>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-globo-textSec text-center max-w-xs">
                  Aponte a câmera do seu celular para o QR Code para abrir a foto.
                </p>
              </>
            ) : uploadStatus === 'disabled' ? (
              <div className="flex flex-col items-center gap-3 text-globo-text py-6">
                <AlertCircle size={44} className="text-globo-textSec" />
                <p className="text-sm sm:text-base font-bold text-center max-w-xs">
                  QR Code desativado porque a chave do ImgBB não está configurada.
                </p>
                <p className="text-xs sm:text-sm text-globo-textSec text-center max-w-xs">
                  Configure VITE_IMGBB_API_KEY para habilitar o QR, ou use apenas o botão de salvar no PC.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-globo-error py-6">
                <AlertCircle size={44} />
                <p className="text-sm sm:text-base font-bold text-center max-w-xs">
                  Não foi possível gerar o QR Code nesta tentativa.
                </p>
                <p className="text-xs sm:text-sm text-globo-textSec text-center max-w-xs">
                  Verifique sua conexão ou tente tirar outra foto. Você ainda pode salvar a imagem no PC.
                </p>
              </div>
            )}
          </div>

          {/* Botões */}
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