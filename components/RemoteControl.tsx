import React, { useEffect, useState } from 'react';
import { Camera as CameraIcon, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';

const CHANNEL_NAME = 'fotototem-remote-1';

export const RemoteControl: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastStatus, setLastStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLastStatus('Supabase não está configurado (.env ausente).');
      return;
    }

    const channel = supabase
      .channel(CHANNEL_NAME)
      .on('system', { event: 'SUBSCRIPTION_STATE_CHANGED' }, (payload) => {
        if (payload.new === 'SUBSCRIBED') {
          setIsConnected(true);
          setLastStatus('Conectado ao totem.');
        } else if (payload.new === 'CLOSED' || payload.new === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setLastStatus('Conexão perdida com o totem.');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleTriggerPhoto = async () => {
    if (!supabase || !isConnected || isSending) return;
    setIsSending(true);
    setLastStatus('Enviando comando para tirar foto...');

    await supabase.channel(CHANNEL_NAME).send({
      type: 'broadcast',
      event: 'remote-command',
      payload: { action: 'take_photo', at: Date.now() },
    });

    setIsSending(false);
    setLastStatus('Comando enviado! Veja a tela do totem.');
  };

  const handlePing = async () => {
    if (!supabase || !isConnected) return;
    setLastStatus('Enviando ping...');
    await supabase.channel(CHANNEL_NAME).send({
      type: 'broadcast',
      event: 'remote-command',
      payload: { action: 'ping', at: Date.now() },
    });
    setLastStatus('Ping enviado.');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-globo-gradient text-white px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-1">Controle Remoto</h1>
          <p className="text-sm text-white/80">
            Use esta tela no celular para disparar a foto no totem.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm">
          {isConnected ? (
            <>
              <Wifi size={18} className="text-globo-success" />
              <span>Conectado ao totem</span>
            </>
          ) : (
            <>
              <WifiOff size={18} className="text-globo-error" />
              <span>Conectando ao totem...</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleTriggerPhoto}
          disabled={!isConnected || isSending}
          className="w-full py-4 rounded-pill bg-white text-globo-blue font-semibold text-lg flex items-center justify-center gap-3 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <CameraIcon size={22} />
          {isSending ? 'Enviando...' : 'Tirar Foto'}
        </button>

        <button
          type="button"
          onClick={handlePing}
          disabled={!isConnected}
          className="inline-flex items-center gap-2 text-xs text-white/80 px-3 py-1.5 rounded-pill border border-white/30 bg-white/10 disabled:opacity-60"
        >
          <RefreshCw size={14} />
          Testar conexão
        </button>

        {lastStatus && (
          <p className="text-xs text-white/80 mt-2">{lastStatus}</p>
        )}

        <p className="text-[11px] text-white/70 mt-4">
          Certifique-se de que o totem está aberto na mesma rede, com esta mesma aplicação carregada
          (sem <span className="font-semibold">?view=remote</span>).
        </p>
      </div>
    </div>
  );
};