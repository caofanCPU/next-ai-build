import { getTranslations } from 'next-intl/server';
import { cn } from '@windrun-huaiin/lib/utils';
import { richText } from './rich-text-expert';
import { responsiveSection } from './section-layout';
import { themeIconColor } from '@windrun-huaiin/base-ui/lib';

interface TipSection {
  id: string;
  title: string;
  description: string;
}

interface TipsData {
  title: string;
  eyesOn: string;
  leftColumn: TipSection[];
  rightColumn: TipSection[];
}

export async function Tips({ 
  locale, 
  sectionClassName 
}: { 
  locale: string;
  sectionClassName?: string;
}) {
  const t = await getTranslations({ locale, namespace: 'tips' });
  
  // Process translation data
  const sections = t.raw('sections') as Array<{
    title: string;
    description: string;
  }>;
  
  const processedSections = sections.map((section, index) => ({
    id: `tip-section-${index}`,
    title: section.title,
    description: richText(t, `sections.${index}.description`)
  }));
  
  const midPoint = Math.ceil(processedSections.length / 2);
  const leftColumn = processedSections.slice(0, midPoint);
  const rightColumn = processedSections.slice(midPoint);
  
  const data: TipsData = {
    title: t('title'),
    eyesOn: t('eyesOn'),
    leftColumn,
    rightColumn
  };

  return (
    <section id="tips" className={cn(responsiveSection, sectionClassName)}>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
        {data.title} <span className={themeIconColor}>{data.eyesOn}</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 md:p-12 shadow-sm dark:shadow-none">
        {[data.leftColumn, data.rightColumn].map((column: TipSection[], colIndex) => (
          <div key={colIndex} className="space-y-8">
            {column.map((tip: TipSection) => (
              <div key={tip.id} data-tip-id={tip.id} className="space-y-4">
                <h3 className="text-2xl font-semibold">{tip.title}</h3>
                <p className="">{tip.description}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
