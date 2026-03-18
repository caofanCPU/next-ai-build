import { getTranslations } from 'next-intl/server';
import { cn } from '@windrun-huaiin/lib/utils';
import { themeIconColor } from '@windrun-huaiin/base-ui/lib';
import { richText } from './rich-text-expert';
import { FAQInteractive } from './faq-interactive';
import { responsiveSection } from './section-layout';

interface FAQData {
  title: string;
  description: string;
  items: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
}

export async function FAQ({ 
  locale, 
  sectionClassName 
}: { 
  locale: string;
  sectionClassName?: string;
}) {
  const t = await getTranslations({ locale, namespace: 'faq' });
  
  // Process translation data
  const rawItems = t.raw('items') as Array<{
    question: string;
    answer: string;
  }>;
  
  const data: FAQData = {
    title: t('title'),
    description: richText(t, 'description'),
    items: rawItems.map((item, index) => ({
      id: `faq-item-${index}`,
      question: item.question,
      answer: richText(t, `items.${index}.answer`)
    }))
  };

  return (
    <section id="faq" className={cn(responsiveSection, sectionClassName)}>
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
        {data.title}
      </h2>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-12 text-base sm:text-lg mx-auto max-w-3xl">
        {data.description}
      </p>
      <div className="space-y-6">
        {data.items.map((item) => (
          <div
            key={item.id}
            data-faq-id={item.id}
            data-faq-open="false"
            className={cn(
              "bg-white dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 transition shadow-sm dark:shadow-none hover:border-current focus-within:border-current",
              themeIconColor
            )}
          >
            <button
              className="w-full p-6 flex items-center justify-between text-left focus:outline-none"
              data-faq-toggle={item.id}
              type="button"
              aria-expanded="false"
              aria-controls={`${item.id}-content`}
            >
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{item.question}</span>
              <svg 
                className="w-6 h-6 text-gray-400 ml-2 transition-transform duration-200" 
                data-faq-icon={item.id}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div 
              id={`${item.id}-content`}
              className="px-6 pb-6 text-gray-700 dark:text-gray-300 text-base hidden" 
              data-faq-content={item.id}
            >
              <div className="pt-1">
              {item.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <FAQInteractive data={data} />
    </section>
  );
} 
