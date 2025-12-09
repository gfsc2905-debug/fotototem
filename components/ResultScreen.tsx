import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { PhotoData } from '../types';
import { Download, RefreshCw, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface ResultScreenProps {
  photoData: PhotoData;
  onRetake: () => void;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error' | 'disabled';

const BUCKET_NAME = 'fotototem'; // ajuste se usar outro nome de bucket

export const ResultScreen: React.FC<ResultScreenProps> = ({ photoData, onRetake }) => {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [publicUrl, setPublicUrl] = useState<string | null>(null);

  // Faz o upload automaticamente ao entrar na tela de resultado (se supabase estiver configurado)
  useEffect(() => {
    const uploadImage = async () => {
      if (!supabase) {
        // Supabase não configurado: desabilita upload/QR
        setUploadStatus('disabled');
        return;
      }

      setUploadStatus('uploading');

      // Converte dataURL para Blob
      const response = await fetch(photoData.dataUrl);
      const blob = await response.blob();

      const fileName = `foto_${photoData.timestamp}.png`;
      const filePath = `${new Date(photoData.timestamp).toISOString().slice(0, 10)}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, blob, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) {
        console.error('Erro ao enviar para Supabase Storage:', uploadError);
        setUploadStatus('error');
        return;
      }

      const {
        data: { publicUrl: url },
      } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

      setPublicUrl(url);
      setUploadStatus('success');
    };

    uploadImage();
  }, [photoData.dataUrl, photoData.timestamp]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = photoData.dataUrl;
    link.download = `fotototem_${photoData.timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStatusText = () => {
    if (uploadStatus === 'success') {
      return 'Agora é só escanear para baixar.';
    }
    if (uploadStatus === 'error') {
      return 'Não conseguimos gerar o link. Mas você pode baixar direto no PC.';
    }
    if (uploadStatus === 'disabled') {
      return 'QR Code desativado (Supabase não configurado). Você ainda pode salvar a foto no PC.';
    }
    return 'Gerando link para você baixar pelo celular...';
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-globo-gradient flex items-center justify-center p-3 sm:p-6 lg:p-10 overflow-y-auto">
      <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center gap-8 lg:gap-16 xl:gap-20 animate-in fade-in slide-in-from-bottom-8 duration-500">
        {/* Esquerda: Foto com moldura */}
        <div className="flex-1 flex justify-center lg:justify-end">
          <div className="relative group w-full max-w-[520px] sm:max-w-[620px]">
            <img
              src={photoData.dataUrl}
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
              {renderStatusText()}
            </p>
          </div>

          {/* Área do QR Code – maior */}
          <div className="p-6 sm:p-8 bg-white rounded-mosaic shadow-xl flex flex-col items-center justify-center gap-4 w-full min-h-[320px] sm:min-h-[380px] lg:min-h-[440px] transition-all text-globo-text">
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
                <p className="text-[11px] sm:text-xs text-globo-textSec font-mono max-w-[300px] truncate">
                  {publicUrl}
                </p>
                <p className="text-xs sm:text-sm text-globo-textSec text-center max-w-xs">
                  Aponte a câmera do seu celular para o QR Code para abrir a foto.
                </p>
              </>
            ) : uploadStatus === 'disabled' ? (
              <div className="flex flex-col items-center gap-3 text-globo-text py-6">
                <AlertCircle size={44} className="text-globo-textSec" />
                <p className="text-sm sm:text-base font-bold text-center max-w-xs">
                  QR Code desativado porque as variáveis do Supabase não estão configuradas.
                </p>
                <p className="text-xs sm:text-sm text-globo-textSec text-center max-w-xs">
                  Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para habilitar o QR, ou use apenas o botão de salvar no PC.
                </p>
              </div>
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

          {/* Botões de ação */}
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