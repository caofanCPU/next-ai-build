import { createSiteDocs } from '@/lib/site-docs-base';

export const siteDocs = createSiteDocs({
  features: {
    code: false,
    math: false,
    npm: false,
    mermaid: false,
    typeTable: false,
  },
});
