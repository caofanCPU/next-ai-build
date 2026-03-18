'use client';

import { useEffect } from 'react';

interface FAQData {
  title: string;
  description: string;
  items: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
}

export function FAQInteractive({ data }: { data: FAQData }) {
  useEffect(() => {
    const cleanups: Array<() => void> = [];

    data.items.forEach((item) => {
      const toggleButton = document.querySelector(`[data-faq-toggle="${item.id}"]`) as HTMLButtonElement;
      const contentDiv = document.querySelector(`[data-faq-content="${item.id}"]`) as HTMLDivElement;
      const iconSvg = document.querySelector(`[data-faq-icon="${item.id}"]`) as SVGElement;
      const cardDiv = document.querySelector(`[data-faq-id="${item.id}"]`) as HTMLDivElement;

      if (toggleButton && contentDiv && iconSvg && cardDiv) {
        const syncOpenState = (isOpen: boolean) => {
          contentDiv.classList.toggle('hidden', !isOpen);
          toggleButton.setAttribute('aria-expanded', String(isOpen));
          iconSvg.style.transform = isOpen ? 'rotate(90deg)' : 'rotate(0deg)';
          cardDiv.setAttribute('data-faq-open', String(isOpen));
        };

        const handleClick = () => {
          const isOpen = toggleButton.getAttribute('aria-expanded') === 'true';
          syncOpenState(!isOpen);
        };

        syncOpenState(toggleButton.getAttribute('aria-expanded') === 'true');
        toggleButton.addEventListener('click', handleClick);
        cleanups.push(() => {
          toggleButton.removeEventListener('click', handleClick);
        });
      }
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [data.items]);

  return null; // Progressive enhancement - no additional DOM rendering
}
