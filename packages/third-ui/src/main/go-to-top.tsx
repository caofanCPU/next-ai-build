'use client';

import { useState, useEffect } from 'react';
import { ArrowUpIcon } from '@windrun-huaiin/base-ui/icons';
import { themeButtonGradientClass, themeButtonGradientHoverClass } from '@windrun-huaiin/base-ui/lib';

export function GoToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // listen to scroll event
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className={`fixed bottom-6 right-6 p-3 ${themeButtonGradientClass} ${themeButtonGradientHoverClass} text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50`}
          aria-label="Go to top"
        >
          <ArrowUpIcon size={20} className="text-white" />
        </button>
      )}
    </>
  );
} 
