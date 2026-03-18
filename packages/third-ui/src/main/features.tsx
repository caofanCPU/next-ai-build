import { getTranslations } from 'next-intl/server';
import { getGlobalIcon } from '@windrun-huaiin/base-ui/components/server';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { themeIconColor } from '@windrun-huaiin/base-ui/lib';
import { cn } from '@windrun-huaiin/lib/utils';
import { richText } from './rich-text-expert';
import { responsiveSection } from './section-layout';

interface FeaturesData {
  title: string;
  eyesOn: string;
  description: string;
  items: Array<{
    id: string;
    title: string;
    description: string;
    iconKey: keyof typeof icons;
  }>;
}

export async function Features({ 
  locale, 
  sectionClassName 
}: { 
  locale: string;
  sectionClassName?: string;
}) {
  const t = await getTranslations({ locale, namespace: 'features' });
  
  // Process translation data
  const featureItems = t.raw('items') as Array<{
    title: string;
    description: string;
    iconKey: keyof typeof icons;
  }>;
  
  const data: FeaturesData = {
    title: t('title'),
    eyesOn: t('eyesOn'),
    description: richText(t, 'description'),
    items: featureItems.map((feature, index) => ({
      id: `feature-item-${index}`,
      title: feature.title,
      description: richText(t, `items.${index}.description`),
      iconKey: feature.iconKey
    }))
  };

  return (
    <section id="features" className={cn(responsiveSection, sectionClassName)}>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
        {data.title} <span className={themeIconColor}>{data.eyesOn}</span>
      </h2>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-12 text-base sm:text-lg mx-auto max-w-3xl">
        {data.description}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 gap-y-12">
        {data.items.map((feature) => {
          const Icon = getGlobalIcon(feature.iconKey);
          return (
            <div
              key={feature.id}
              data-feature-id={feature.id}
              className="bg-white dark:bg-gray-800/60 p-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500/50 transition shadow-sm dark:shadow-none"
            >
              <div className="text-4xl mb-4 flex items-center justify-start">
                <Icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">{feature.title}</h3>
              <p className="text-gray-700 dark:text-gray-300">{feature.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
