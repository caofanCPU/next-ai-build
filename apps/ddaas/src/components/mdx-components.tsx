import { toSiteMdxFeatures } from '@windrun-huaiin/contracts/mdx';
import { createSiteMdxComponents } from '@third-ui/fuma/server/site-mdx-components';
import { globalLucideIcons } from '@base-ui/icons';
import { appConfig } from '@/lib/appConfig';
import { ddaasMdxCapabilities } from '@/lib/mdx-capabilities';

export const getMDXComponents = createSiteMdxComponents({
  features: toSiteMdxFeatures(ddaasMdxCapabilities),
  imageFallbackSrc: appConfig.style.placeHolder.image,
  cdnBaseUrl: appConfig.style.cdnBaseUrl,
  watermarkEnabled: appConfig.style.watermark.enabled,
  watermarkText: appConfig.style.watermark.text,
  additionalComponents: {
    ...globalLucideIcons,
  },
});

export const useMDXComponents = getMDXComponents;
