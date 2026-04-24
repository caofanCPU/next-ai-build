import { getTranslations } from 'next-intl/server';
import { Banner } from '@third-ui/fuma/mdx/banner';

export async function FumaBannerSuit({
  locale,
  showBanner,
  floating = true,
}: {
  locale: string;
  showBanner: boolean;
  floating?: boolean;
}) {
  const heightValue = 3;
  const height = `${heightValue}rem`;

  if (!showBanner) {
    return (
      <div
        aria-hidden="true"
        className="m-0 rounded-none bg-neutral-100 dark:bg-neutral-900"
        style={{
          position: floating ? 'fixed' : 'relative',
          top: floating ? 0 : undefined,
          left: floating ? 0 : undefined,
          width: floating ? '100vw' : '100%',
          zIndex: floating ? 1001 : undefined,
          height,
          minHeight: height,
          maxHeight: height,
        }}
      />
    );
  }

  const t = await getTranslations({ locale, namespace: 'home' });
  const bannerText = t('banner');
  return (
    <Banner
      variant="rainbow"
      changeLayout={true}
      height={heightValue}
      floating={floating}
    >
      <p className="text-sm sm:text-xl md:text-xl">{bannerText}</p>
    </Banner>
  );
}
