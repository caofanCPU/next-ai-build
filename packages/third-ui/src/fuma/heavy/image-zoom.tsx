'use client';

import { Image, type ImageProps } from 'fumadocs-core/framework';
import { type ImgHTMLAttributes, useState } from 'react';
import Zoom, { type UncontrolledProps } from 'react-medium-image-zoom';

export type ImageZoomProps = ImageProps & {
  /**
   * Image props when zoom in
   */
  zoomInProps?: ImgHTMLAttributes<HTMLImageElement>;

  /**
   * Props for `react-medium-image-zoom`
   */
  rmiz?: UncontrolledProps;

  /**
   * placeholder image path
   */
  fallbackSrc?: string;
};

function getImageSrc(src: ImageProps['src']): string {
  if (typeof src === 'string') return src;

  if (typeof src === 'object') {
    // Next.js
    if ('default' in src)
      return (src as { default: { src: string } }).default.src;
    return src.src;
  }

  return '';
}

/**
 * @example
 * <ImageZoom src="URL" fallbackSrc="/my-placeholder.png" />
 */
export function ImageZoom({
  zoomInProps,
  children,
  rmiz,
  fallbackSrc = 'https://r2.d8ger.com/default.webp',
  ...props
}: ImageZoomProps) {
  const [imgSrc, setImgSrc] = useState(getImageSrc(props.src));

  // fallback logic
  const handleError = () => {
    console.warn('ImageZoom check error:', imgSrc, fallbackSrc);
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <Zoom
      zoomMargin={20}
      wrapElement="span"
      {...rmiz}
      zoomImg={{
        src: imgSrc,
        sizes: undefined,
        ...zoomInProps,
        onError: handleError,
      }}
    >
      {children ?? (
        <Image
          {...props}
          src={imgSrc}
          onError={handleError}
          sizes="(max-width: 400px) 100vw, 300px"
          style={{ width: '100%', height: 'auto', maxWidth: 300 }}
          alt={props.alt ?? ''}
          width={300}
          height={225}
        />
      )}
    </Zoom>
  );
}