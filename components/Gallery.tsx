import React, { useState } from 'react';
import { PhotoData } from '../types';
import { ChevronDown, ChevronUp, Images } from 'lucide-react';

interface GalleryProps {
  photos: PhotoData[];
  onSelect?: (photo: PhotoData) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ photos, onSelect }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!photos.length) return null;

  const toggleOpen = () => setIsOpen((prev) => !prev);

  return (
    <div className="w-full bg-globo-blue/90 text-white backdrop-blur-sm border-t border-white/20 shadow-[0_-4px_20px_rgba(0,0,0,0.25)]">
      <div className="w-full px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        {/* Cabeçalho da galeria */}
        <button
          type="button"
          onClick={toggleOpen}
          className="w-full flex items-center justify-between gap-2 text-left"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/15 flex items-center justify-center">
              <Images size={16} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase">
                Últimas fotos
              </span>
              <span className="text-[10px] sm:text-xs text-white/80">
                {photos.length} foto{photos.length > 1 ? 's' : ''} • armazenadas apenas neste computador
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs text-white/80 hidden sm:inline">
              {isOpen ? 'Recolher' : 'Expandir'}
            </span>
            <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
              {isOpen ? (
                <ChevronDown size={18} className="text-white" />
              ) : (
                <ChevronUp size={18} className="text-white" />
              )}
            </div>
          </div>
        </button>

        {/* Conteúdo da galeria */}
        {isOpen && (
          <div className="mt-3 sm:mt-3.5 rounded-mosaic border border-white/25 px-2.5 py-2 sm:px-3 sm:py-3 bg-white/5">
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5 sm:gap-2">
              {photos.map((photo) => (
                <button
                  key={photo.timestamp}
                  type="button"
                  onClick={() => onSelect?.(photo)}
                  className="relative group aspect-[4/5] rounded-[9px] sm:rounded-[10px] overflow-hidden bg-black/25 border border-white/10 hover:border-white/60 hover:bg-black/40 transition-all shadow-sm hover:shadow-md"
                >
                  <img
                    src={photo.dataUrl}
                    alt={`Foto ${new Date(photo.timestamp).toLocaleTimeString()}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors" />
                  <span className="absolute bottom-0.5 left-1 right-1 text-[8px] sm:text-[9px] text-white/90 drop-shadow-sm text-right px-0.5 sm:px-1">
                    {new Date(photo.timestamp).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};