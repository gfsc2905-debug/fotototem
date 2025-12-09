import React from 'react';
import { PhotoData } from '../types';

interface GalleryProps {
  photos: PhotoData[];
  onSelect?: (photo: PhotoData) => void;
}

export const Gallery: React.FC<GalleryProps> = ({ photos, onSelect }) => {
  if (!photos.length) return null;

  return (
    <div className="w-full max-w-6xl px-3 sm:px-6 lg:px-10 mt-4 sm:mt-6">
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

      <div className="bg-white/80 backdrop-blur-sm rounded-mosaic border border-globo-gray/80 px-3 py-3 sm:px-4 sm:py-4 shadow-sm">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
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
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
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
  );
};