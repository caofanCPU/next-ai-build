'use client';

import { ImageZoom } from './image-zoom';

export function ImageGrid({
  type="url",
  images,
  altPrefix = '',
  cdnBaseUrl,
}: {
  type: "url" | "local";
  images: string[];
  altPrefix?: string;
  cdnBaseUrl?: string;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px',
        justifyItems: 'center',
        alignItems: 'center', 
      }}
    >
      {images.map((img, idx) => (
        <ImageZoom
          key={img}
          src={img.startsWith('http://') || img.startsWith('https://') ? img : (type === "url" ? `${cdnBaseUrl?.replace(/\/+$/, '')}/${img.replace(/^\/+/, '')}` : img)}
          alt={`${altPrefix}-${idx+1}`}
        />
      ))}
    </div>
  );
} 
