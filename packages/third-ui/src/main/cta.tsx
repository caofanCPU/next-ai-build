import { getTranslations } from 'next-intl/server';
import { GradientButton } from "@third-ui/fuma/mdx/gradient-button";
import { cn } from '@windrun-huaiin/lib/utils';
import { themeIconColor } from '@windrun-huaiin/base-ui/lib';
import { richText } from './rich-text-expert';
import { responsiveSection } from './section-layout';

interface CTAData {
  title: string;
  eyesOn: string;
  description1: string;
  description2: string;
  button: string;
  url: string;
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
      <div className="
        py-3 sm:py-6 md:8
        bg-linear-to-r from-[#f7f8fa] via-[#e0c3fc] to-[#b2fefa]
        dark:bg-linear-to-r dark:from-[#2d0b4e] dark:via-[#6a3fa0] dark:to-[#3a185a]
        rounded-2xl text-center
        bg-size[200%_auto] animate-cta-gradient-wave
        ">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          {data.title} <span className={themeIconColor}>{data.eyesOn}</span>?
        </h2>
        <p className="text-base sm:text-xl mx-auto mb-8 max-w-3xl">
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
    </section>
  )
}
