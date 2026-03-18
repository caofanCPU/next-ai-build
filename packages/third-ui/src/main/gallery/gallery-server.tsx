import { getTranslations } from 'next-intl/server';
import { cn } from '@windrun-huaiin/lib/utils';
import { responsiveSection } from '../section-layout';
import { GalleryInteractive } from './gallery-interactive';
import { GalleryDesktopGrid } from './gallery-desktop-grid';
import { GalleryMobileSwiper } from './gallery-mobile-swiper';
import type { GalleryProps, GalleryData } from './gallery-types';
import { themeIconColor } from '@windrun-huaiin/base-ui/lib';

export async function Gallery({ locale, sectionClassName, button }: GalleryProps) {
  const t = await getTranslations({ locale, namespace: 'gallery' });

  const galleryItems = t.raw('prompts') as Array<{ url: string; altMsg: string }>;

  const data: GalleryData = {
    titleL: t('titleL'),
    eyesOn: t('eyesOn'),
    titleR: t('titleR'),
    description: t('description'),
    items: galleryItems.map((item, index) => ({
      id: `gallery-item-${index}`,
      url: item.url,
      altMsg: item.altMsg,
    })),
    defaultImgUrl: t.raw('defaultImgUrl') as string,
    downloadPrefix: t('downloadPrefix'),
  };

  return (
    <section id="gallery" className={cn(responsiveSection, sectionClassName)}>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">
        {data.titleL} <span className={themeIconColor}>{data.eyesOn}</span> {data.titleR}
      </h2>
      <p className="text-center max-w-2xl mx-auto mb-16">{data.description}</p>

      {/* 移动端轮播 */}
      <GalleryMobileSwiper items={data.items} />

      {/* 桌面端网格 */}
      <GalleryDesktopGrid items={data.items} />

      {button && <div className="text-center mx-auto mt-12 max-w-[85vw]">{button}</div>}

      <GalleryInteractive data={data} />
    </section>
  );
}