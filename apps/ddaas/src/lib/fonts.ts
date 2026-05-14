import localFont from 'next/font/local';

// Just use local font，no more remote Google-font
export const montserrat = localFont({
  src: [
    { path: '../../public/asserts/Montserrat-Regular.otf', weight: '400', style: 'normal' },
  ],
  display: 'swap',
  fallback: ['system-ui', 'Arial', 'sans-serif'],
});
