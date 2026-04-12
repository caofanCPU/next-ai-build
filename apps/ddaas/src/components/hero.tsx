import { getTranslations } from 'next-intl/server'
import { globalLucideIcons as icons} from '@base-ui/components/global-icon'
import { themeHeroEyesOnClass } from '@base-ui/lib'
import { GradientButton } from "@third-ui/fuma/mdx"
import { HeroMedia, HeroSection } from "@third-ui/main"

export async function Hero({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'hero' });

  return (
    <HeroSection
      content={
        <>
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">
            {t('mainTitle')}<br />{" "}
            <span className={`bg-clip-text text-transparent ${themeHeroEyesOnClass}`}>{t('mainEyesOn')}</span>
          </h1>
          <p className="max-w-2xl text-lg text-gray-400">
            {t('description')}
          </p>
          <GradientButton
            title={t('button')}
            href="https://preview.reve.art/"
            align="center"
            className="md:w-full"
          />
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <icons.Zap className="h-4 w-4" />
            <span>{t('about')}</span>
          </div>
        </>
      }
      media={
        <HeroMedia
          src={t('heroImageUrl')}
          alt={t('heroImageAlt')}
          width={1}
          height={1}
          preload
        />
      }
    />
  )
}
