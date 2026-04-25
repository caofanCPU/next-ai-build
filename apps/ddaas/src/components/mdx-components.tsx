import { createSiteMdxComponents } from '@windrun-huaiin/third-ui/fuma/server/site-mdx/base';
import { createCodeMdxComponents } from '@windrun-huaiin/third-ui/fuma/server/site-mdx/features/code';
import { createMathMdxComponents } from '@windrun-huaiin/third-ui/fuma/server/site-mdx/features/math';
import { createMermaidMdxComponents } from '@windrun-huaiin/third-ui/fuma/server/site-mdx/features/mermaid';
import { createTypeTableMdxComponents } from '@windrun-huaiin/third-ui/fuma/server/site-mdx/features/type-table';
import { globalLucideIcons } from '@base-ui/icons';
import { appConfig } from '@/lib/appConfig';

export const getMDXComponents = createSiteMdxComponents({
  baseOptions: {
    imageFallbackSrc: appConfig.style.placeHolder.image,
    cdnBaseUrl: appConfig.style.cdnBaseUrl,
  },
  features: [
    // code
    createCodeMdxComponents(),

    // math
    createMathMdxComponents(),

    // npm, no need components render, just need source handler

    // mermaid
    createMermaidMdxComponents(appConfig.style.watermark.enabled, appConfig.style.watermark.text),

    // type-table
    createTypeTableMdxComponents(),
  ],
  additionalComponents: {
    ...globalLucideIcons,
  },
});

export const useMDXComponents = getMDXComponents;
