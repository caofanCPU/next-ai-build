import { getTranslations } from 'next-intl/server';
import { cn } from '@windrun-huaiin/lib/utils';
import { globalLucideIcons as icons, getGlobalIcon } from '@windrun-huaiin/base-ui/components/server';
import { themeIconColor } from '@windrun-huaiin/base-ui/lib';
import { richText } from './rich-text-expert';
import { responsiveSection } from './section-layout';

interface UsageData {
  title: string;
  eyesOn: string;
  description: string;
  steps: Array<{
    id: string;
    title: string;
    description: string;
    iconKey: keyof typeof icons;
    stepNumber: number;
  }>;
}

export async function Usage({ 
  locale, 
  sectionClassName 
}: { 
  locale: string;
  sectionClassName?: string;
}) {
  const t = await getTranslations({ locale, namespace: 'usage' });
  
  // Process translation data
  const steps = t.raw('steps') as Array<{
    title: string;
    description: string;
    iconKey: keyof typeof icons;
  }>;
  
  const data: UsageData = {
    title: t('title'),
    eyesOn: t('eyesOn'),
    description: richText(t, 'description'),
    steps: steps.map((step, index) => ({
      id: `usage-step-${index}`,
      title: step.title,
      description: richText(t, `steps.${index}.description`),
      iconKey: step.iconKey,
      stepNumber: index + 1
    }))
  };

  return (
    <section id="usage" className={cn(responsiveSection, sectionClassName)}>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
        {data.title} <span className={themeIconColor}>{data.eyesOn}</span>
      </h2>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-12 text-base sm:text-lg mx-auto max-w-3xl">
        {data.description}
      </p>
      <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 md:p-12 shadow-sm dark:shadow-none">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 gap-y-12">
          {data.steps.map((step) => {
            const Icon = getGlobalIcon(step.iconKey);
            return (
              <div key={step.id} data-usage-step={step.id} className="flex items-start">
                <div className="shrink-0 mr-4">
                  <Icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center">
                    {`${step.stepNumber}. ${step.title}`}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">{step.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
