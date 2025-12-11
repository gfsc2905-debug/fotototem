import React, { useEffect, useState } from 'react';
import { Camera as CameraIcon, Wifi, WifiOff, RefreshCw, Clock, Smartphone } from 'lucide-react';
import { supabase } from '../supabaseClient';

type FrameMode = 'portrait' | 'landscape';
type TimerValue = 3 | 5 | 10;

export const RemoteControl: React.FC = () => {
  const [sessionCodeInput, setSessionCodeInput] = useState('');
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null);

  const [remoteMode, setRemoteMode] = useState<FrameMode>('portrait');
  const [remoteTimer, setRemoteTimer] = useState<TimerValue>(3);

  const handleConnect = () => {
    const code = sessionCodeInput.trim().toUpperCase();
    if (!code || !supabase) {
      setLastStatus('Informe um código válido do totem.');
      return;
    }
    setSessionCode(code);
  };

  useEffect(() => {
    if (!supabase) {
      setLastStatus('Supabase não está configurado.');
      return;
    }
    if (!sessionCode) {
      return;
    }

    const channelName = `fotototem-remote-${sessionCode}`;
    const channel = supabase
      .channel(channelName)
      .on('system', { event: 'SUBSCRIPTION_STATE_CHANGED' }, (payload) => {
        if (payload.new === 'SUBSCRIBED') {
          setIsConnected(true);
          setLastStatus(`Conectado ao totem (${sessionCode}).`);
        } else if (payload.new === 'CLOSED' || payload.new === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setLastStatus('Conexão perdida com o totem.');
        }
      })
      .subscribe((status) => {
        if (status === 'TIMED_OUT' || status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setLastStatus('Não foi possível conectar ao totem. Verifique o código e tente novamente.');
        }
      });

    setChannelId(channelName);

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
      setChannelId(null);
    };
  }, [sessionCode]);

  const sendRemoteCommand = async (
    action: 'take_photo' | 'ping' | 'set_mode' | 'set_timer',
    extra?: { mode?: FrameMode; timer?: TimerValue }
  ) => {
    if (!supabase || !isConnected || !channelId) return;

    await supabase.channel(channelId).send({
      type: 'broadcast',
      event: 'remote-command',
      payload: {
        action,
        ...extra,
        at: Date.now(),
      },
    });
  };

  const handleTriggerPhoto = async () => {
    if (!supabase || !isConnected || isSending) return;
    setIsSending(true);
    setLastStatus('Enviando comando para tirar foto...');
    await sendRemoteCommand('take_photo');
    setIsSending(false);
    setLastStatus('Comando enviado! Veja a tela do totem.');
  };

  const handlePing = async () => {
    if (!supabase || !isConnected) return;
    setLastStatus('Enviando ping...');
    await sendRemoteCommand('ping');
    setLastStatus('Ping enviado.');
  };

  const handleDisconnect = () => {
    setSessionCode(null);
    setChannelId(null);
    setIsConnected(false);
    setLastStatus('Desconectado do totem.');
  };

  const handleChangeMode = async (mode: FrameMode) => {
    if (!isConnected) return;
    setRemoteMode(mode);
    setLastStatus(
      mode === 'portrait'
        ? 'Mudando orientação para em pé no totem...'
        : 'Mudando orientação para deitado no totem...'
    );
    await sendRemoteCommand('set_mode', { mode });
  };

  const handleChangeTimer = async (value: TimerValue) => {
    if (!isConnected) return;
    setRemoteTimer(value);
    setLastStatus(`Ajustando timer do totem para ${value}s...`);
    await sendRemoteCommand('set_timer', { timer: value });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-globo-gradient text-white px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-1">Controle Remoto</h1>
          <p className="text-sm text-white/80">
            Use esta tela no celular para disparar a foto e ajustar o totem.
          </p>
        </div>

        {!sessionCode ? (
          <div className="space-y-3 bg-white/10 rounded-mosaic p-4 border border-white/20">
            <p className="text-xs text-white/80 mb-1">
              Digite o <span className="font-semibold">código do totem</span> exibido na tela principal.
            </p>
            <input
              type="text"
              value={sessionCodeInput}
              onChange={(e) => setSessionCodeInput(e.target.value)}
              maxLength={6}
              className="w-full px-3 py-2 rounded-pill text-center text-lg tracking-[0.3em] font-semibold bg-white text-globo-blue outline-none border border-white/40"
              placeholder="XXXX"
            />
            <button
              type="button"
              onClick={handleConnect}
              className="w-full py-2.5 rounded-pill bg-white text-globo-blue font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              Conectar ao totem
            </button>
          </div>
        ) : (
          <div className="space-y-3 bg-white/10 rounded-mosaic p-4 border border-white/20">
            <p className="text-xs text-white/80">
              Conectado ao código:{' '}
              <span className="font-semibold tracking-[0.25em]">{sessionCode}</span>
            </p>
            <button
              type="button"
              onClick={handleDisconnect}
              className="w-full py-2 rounded-pill bg-white/10 text-white text-xs border border-white/40 hover:bg-white/20 transition-all"
            >
              Trocar código do totem
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-sm">
          {isConnected ? (
            <>
              <Wifi size={18} className="text-globo-success" />
              <span>Conectado ao totem</span>
            </>
          ) : (
            <>
              <WifiOff size={18} className="text-globo-error" />
              <span>{sessionCode ? 'Conectando ao totem...' : 'Aguardando código do totem'}</span>
            </>
          )}
        </div>

        {/* Controles de orientação e timer */}
        <div className="space-y-3 bg-white/10 rounded-mosaic p-4 border border-white/15">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-xs text-white/80">
              <Smartphone size={14} />
              <span>Orientação da câmera</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!isConnected}
              onClick={() => handleChangeMode('portrait')}
              className={[
                'flex-1 px-3 py-2 rounded-pill text-xs font-semibold border transition-all',
                remoteMode === 'portrait'
                  ? 'bg-white text-globo-blue border-white shadow-md'
                  : 'bg-white/10 text-white/80 border-white/30 hover:bg-white/20',
                !isConnected ? 'opacity-60 cursor-not-allowed' : '',
              ].join(' ')}
            >
              Em pé
            </button>
            <button
              type="button"
              disabled={!isConnected}
              onClick={() => handleChangeMode('landscape')}
              className={[
                'flex-1 px-3 py-2 rounded-pill text-xs font-semibold border transition-all',
                remoteMode === 'landscape'
                  ? 'bg-white text-globo-blue border-white shadow-md'
                  : 'bg-white/10 text-white/80 border-white/30 hover:bg-white/20',
                !isConnected ? 'opacity-60 cursor-not-allowed' : '',
              ].join(' ')}
            >
              Deitado
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-white/80">
              <Clock size={14} />
              <span>Timer</span>
            </div>
          </div>
          <div className="flex gap-2">
            {[3, 5, 10].map((v) => {
              const value = v as TimerValue;
              const isActive = remoteTimer === value;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={!isConnected}
                  onClick={() => handleChangeTimer(value)}
                  className={[
                    'flex-1 px-2 py-2 rounded-pill text-xs font-semibold border transition-all',
                    isActive
                      ? 'bg-white text-globo-blue border-white shadow-md'
                      : 'bg-white/10 text-white/80 border-white/30 hover:bg-white/20',
                    !isConnected ? 'opacity-60 cursor-not-allowed' : '',
                  ].join(' ')}
                >
                  {value}s
                </button>
              );
            })}
          </div>
        </div>

        {/* Botão principal de tirar foto */}
        <button
          type="button"
          onClick={handleTriggerPhoto}
          disabled={!isConnected || isSending}
          className="w-full py-4 rounded-pill bg-white text-globo-blue font-semibold text-lg flex items-center justify-center gap-3 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <CameraIcon size={22} />
          {isSending ? 'Enviando...' : 'Tirar Foto'}
        </button>

        {/* Botão de ping */}
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
          Abra o totem na TV/computador em{' '}
          <span className="font-semibold">https://seu-app.vercel.app/</span> e use o código exibido lá.
        </p>
      </div>
    </div>
  );
};