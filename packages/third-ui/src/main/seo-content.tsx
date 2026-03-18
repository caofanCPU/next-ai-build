/* eslint-disable react/no-unescaped-entities */
import { getTranslations } from 'next-intl/server';
import { cn } from '@windrun-huaiin/lib/utils';
import { richText } from './rich-text-expert';
import { responsiveSection } from './section-layout';
import { themeIconColor } from '@windrun-huaiin/base-ui/lib';

interface SeoSection {
  id: string;
  title: string;
  content: string;
}

interface SeoContentData {
  title: string;
  eyesOn: string;
  description: string;
  intro: string;
  sections: SeoSection[];
  conclusion: string;
}

export async function SeoContent({ 
  locale, 
  sectionClassName 
}: { 
  locale: string;
  sectionClassName?: string;
}) {
  const t = await getTranslations({ locale, namespace: 'seoContent' });
  
  // Process translation data
  const rawSections = t.raw('sections') as Array<{
    title: string;
    content: string;
  }>;
  
  const data: SeoContentData = {
    title: t('title'),
    eyesOn: t('eyesOn'),
    description: t('description'),
    intro: richText(t, 'intro'),
    sections: rawSections.map((section, index) => ({
      id: `seo-section-${index}`,
      title: section.title,
      content: richText(t, `sections.${index}.content`)
    })),
    conclusion: richText(t, 'conclusion')
  };

  return (
    <section id="seo" className={cn(responsiveSection, sectionClassName)}>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
        {data.title} <span className={themeIconColor}>{data.eyesOn}</span>
      </h2>
      <h3 className="text-center text-gray-600 dark:text-gray-400 mb-12 text-lg">
        {data.description}
      </h3>
      <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 md:p-12 shadow-sm dark:shadow-none">
        <div className="space-y-10">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {data.intro}
          </p>
          {data.sections.map((section) => (
            <div key={section.id} data-seo-section={section.id}>
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center">
                {section.title}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">{section.content}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-gray-600 dark:text-gray-400 text-lg">
          {data.conclusion}
        </p>
      </div>
    </section>
  )
}
