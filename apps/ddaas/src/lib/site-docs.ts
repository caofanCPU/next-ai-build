import { createSiteDocs } from '@/lib/site-docs-base';

export const siteDocs = createSiteDocs({
  features: {
    code: true,
    math: true,
    npm: true,
    mermaid: true,
    typeTable: true,
  },
  additionalComponents: {},
});
