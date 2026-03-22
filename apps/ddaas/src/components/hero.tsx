import { getTranslations } from 'next-intl/server'
import { globalLucideIcons as icons} from '@base-ui/components/global-icon'
import { themeHeroEyesOnClass } from '@base-ui/lib'
import { GradientButton } from "@third-ui/fuma/mdx"
import { DelayedImg } from "@third-ui/main"

export async function Hero({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'hero' });

  return (
    <section className="mx-auto mt-12 flex max-w-6xl flex-col gap-10 px-6 py-8 md:min-w-[calc(100vw-22rem)] md:px-4 md:flex-row md:items-center md:gap-12">
      <div className="flex-1 space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          {t('mainTitle')}<br />{" "}
          <span className={`text-transparent bg-clip-text ${themeHeroEyesOnClass}`}>{t('mainEyesOn')}</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl">
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
      </div>
      <div className="flex-1 relative flex justify-center md:justify-end">
        <div className="w-full max-w-[500px]">
          <div className="group relative aspect-square overflow-hidden rounded-lg shadow-purple-500/20">
            <DelayedImg
              src={t('heroImageUrl')}
              alt={t('heroImageAlt')}
              fill
              preload
              sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 35vw"
              className="rounded-lg object-cover group-hover:scale-105"
              wrapperClassName="h-full w-full"
              placeholderClassName="rounded-lg"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
