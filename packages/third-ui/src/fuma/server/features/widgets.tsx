import type { MDXComponents } from 'mdx/types';
import { lazy } from 'react';
import { TrophyCard } from '../../mdx/trophy-card';
import { ZiaCard } from '../../mdx/zia-card';
import { GradientButton } from '../../../main/buttons';
import { ZiaFile, ZiaFolder } from '../../mdx/zia-file';
import { SunoEmbed } from '../../mdx/suno-embed';

const ImageGrid = lazy(() =>
  import('../../heavy/image-grid').then((mod) => ({ default: mod.ImageGrid })),
);
const ImageZoom = lazy(() =>
  import('../../heavy/image-zoom').then((mod) => ({ default: mod.ImageZoom })),
);

export function createWidgetMdxComponents(
  cdnBaseUrl?: string,
  imageFallbackSrc?: string,
): MDXComponents {
  return {
    TrophyCard,
    ZiaCard,
    GradientButton,
    ZiaFile,
    ZiaFolder,
    SunoEmbed,
    ImageGrid: (props) => (
      <ImageGrid {...props} cdnBaseUrl={cdnBaseUrl} />
    ),
    ImageZoom: (props) => (
      <ImageZoom {...props} fallbackSrc={imageFallbackSrc} />
    ),
  };
}
