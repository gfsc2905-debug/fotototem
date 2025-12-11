import React from 'react';
import { PhotoData } from '../types';

interface GalleryProps {
  photos: PhotoData[];
  onSelect?: (photo: PhotoData) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ photos, onSelect }) => {
  if (!photos.length) return null;

  return (
    <div className="w-full bg-white/90 backdrop-blur-sm border-t border-globo-gray/70">
      <div className="w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm sm:text-base font-semibold text-globo-text flex items-center gap-2">
            Últimas fotos
            <span className="text-[11px] sm:text-xs font-normal text-globo-textSec">
              (somente neste computador)
            </span>
          </h3>
          <span className="text-[11px] sm:text-xs text-globo-textSec">
            {photos.length} foto{photos.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="rounded-mosaic border border-globo-gray/80 px-2.5 py-2 sm:px-3 sm:py-3 shadow-sm bg-white">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-3">
            {photos.map((photo) => (
              <button
                key={photo.timestamp}
                type="button"
                onClick={() => onSelect?.(photo)}
                className="relative group aspect-[4/5] rounded-[10px] overflow-hidden border border-black/5 bg-globo-gray hover:border-globo-blue/60 hover:shadow-md transition-all"
              >
                <img
                  src={photo.dataUrl}
                  alt={`Foto ${new Date(photo.timestamp).toLocaleTimeString()}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <span className="absolute bottom-1 left-1 right-1 text-[9px] sm:text-[10px] text-white/90 drop-shadow-sm text-right px-1">
                  {new Date(photo.timestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};