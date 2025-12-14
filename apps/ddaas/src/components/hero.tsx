 
import Image from "next/image"
import { getTranslations } from 'next-intl/server'
import { globalLucideIcons as icons} from '@base-ui/components/global-icon'
import { GradientButton } from "@third-ui/fuma/mdx"

export async function Hero({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'hero' });

  return (
    <section className="mx-auto mt-12 max-w-6xl flex flex-col gap-10 px-4 py-8 md:flex-row md:items-center md:gap-12">
      <div className="flex-1 space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight">
          {t('mainTitle')}<br />{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-600">{t('mainEyesOn')}</span>
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
        <div className="rounded-lg overflow-hidden shadow-purple-500/20 group">
          <Image
            src={t('heroImageUrl')}
            alt={t('heroImageAlt')}
            width={500}
            height={500}
            priority
            className="h-auto w-full rounded-lg transition duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 35vw"
          />
        </div>
      </div>
    </section>
  )
}
