'use client';

interface SunoEmbedProps {
  src: string;
  ratio?: string;
}

function toSunoEmbedUrl(src: string): string {
  try {
    const url = new URL(src);

    if (url.hostname !== 'suno.com' && url.hostname !== 'www.suno.com') {
      return src;
    }

    const pathParts = url.pathname.split('/').filter(Boolean);
    const [kind, id] = pathParts;

    if (!id) {
      return src;
    }

    if (kind === 'embed') {
      return `https://suno.com/embed/${id}`;
    }

    if (kind === 'song') {
      return `https://suno.com/embed/${id}`;
    }

    return src;
  } catch {
    return src;
  }
}

export function SunoEmbed({ src, ratio = '30%' }: SunoEmbedProps) {
  const embedSrc = toSunoEmbedUrl(src);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 0,
        paddingBottom: ratio,
        overflow: 'hidden',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        margin: '1rem 0',
      }}
    >
      <iframe
        src={embedSrc}
        title="Suno audio player"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        allow="autoplay; encrypted-media; fullscreen"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        suppressHydrationWarning
      />
    </div>
  );
}
