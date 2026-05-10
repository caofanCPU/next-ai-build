import { getTranslations } from 'next-intl/server';
import { GradientButton } from "./buttons";
import { cn } from '@windrun-huaiin/lib/utils';
import { themeIconColor, themeName, themeSvgIconColor } from '@windrun-huaiin/base-ui/lib';
import { richText } from './rich-text-expert';
import { responsiveSection } from './section-layout';
import type { CSSProperties } from 'react';

interface CTAData {
  title: string;
  eyesOn: string;
  description1: string;
  description2: string;
  button: string;
  url: string;
}

type CTAThemePalette = {
  b: string;
  c: string;
};

const CTA_THEME_PALETTES: Record<string, CTAThemePalette> = {
  purple: { b: '#EC4899', c: '#6366F1' },
  orange: { b: '#F59E0B', c: '#EF4444' },
  indigo: { b: '#3B82F6', c: '#06B6D4' },
  emerald: { b: '#14B8A6', c: '#22C55E' },
  rose: { b: '#EC4899', c: '#FB7185' },
};

function createCTAStyle(): CSSProperties {
  const palette = CTA_THEME_PALETTES[themeName] ?? CTA_THEME_PALETTES.purple;

  return {
    '--cta-color-a': themeSvgIconColor,
    '--cta-color-b': palette.b,
    '--cta-color-c': palette.c,
  } as CSSProperties;
}

export async function CTA({ 
  locale, 
  sectionClassName 
}: { 
  locale: string;
  sectionClassName?: string;
}) {
  const t = await getTranslations({ locale, namespace: 'cta' });
  
  const data: CTAData = {
    title: t('title'),
    eyesOn: t('eyesOn'),
    description1: richText(t, 'description1'),
    description2: t('description2'),
    button: t('button'),
    url: t('url')
  };

  return (
    <section id="cta" className={cn(responsiveSection, sectionClassName)}>
      <div
        className="
          third-ui-cta-surface
          relative overflow-hidden rounded-2xl border border-black/5 py-3 text-center shadow-sm
          animate-cta-gradient-wave
          sm:py-6 md:py-8
          dark:border-white/10 dark:shadow-none
        "
        style={createCTAStyle()}
      >
        <div className="relative z-10 px-4 sm:px-6">
          <h2 className="mb-6 text-3xl font-bold text-neutral-950 md:text-4xl dark:text-neutral-50">
            {data.title} <span className={themeIconColor}>{data.eyesOn}</span>?
          </h2>
          <p className="mx-auto mb-8 max-w-3xl text-base text-neutral-700 sm:text-xl dark:text-neutral-300">
            {data.description1}
            <br />
            <span className={cn(themeIconColor, "text-xl sm:text-2xl")}>{data.description2}</span>
          </p>
          <GradientButton
            title={data.button}
            href={data.url}
            align="center"
          />
        </div>
      </div>
    </section>
  )
}
