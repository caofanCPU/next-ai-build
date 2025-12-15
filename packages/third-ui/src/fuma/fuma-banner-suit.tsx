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
  const t = await getTranslations({ locale, namespace: 'home' });
  const heightValue = showBanner ? 3 : 0.5;
  const height = `${heightValue}rem`;
  const bannerText = t('banner');
  return (
    <>
      {showBanner ? (
        <Banner
          variant="rainbow"
          changeLayout={true}
          height={heightValue}
          floating={floating}
        >
          <p className="text-sm sm:text-xl md:text-xl">{bannerText}</p>
        </Banner>
      ) : (
        <div
          className="m-0 rounded-none bg-neutral-100 dark:bg-neutral-900"
          style={{
            position: floating ? 'fixed' : 'relative',
            top: floating ? 0 : undefined,
            left: floating ? 0 : undefined,
            width: floating ? '100vw' : '100%',
            zIndex: floating ? 1001 : undefined,
            height: height,
            minHeight: height,
            maxHeight: height,
          }}
        />
      )}
    </>
  );
}
