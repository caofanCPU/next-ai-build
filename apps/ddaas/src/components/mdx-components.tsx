import { toSiteMdxFeatures } from '@windrun-huaiin/contracts/mdx';
import { createSiteMdxComponents } from '@third-ui/fuma/server/site-mdx-components';
import { SiteX } from '@third-ui/fuma/server';
import {
  CSSIcon,
  CSVIcon,
  DiffIcon,
  HtmlIcon,
  HttpIcon,
  JavaIcon,
  JsonIcon,
  LogIcon,
  MDXIcon,
  RegexIcon,
  SQLIcon,
  SchemeIcon,
  SquareDashedBottomCodeIcon,
  TxtIcon,
  XMLIcon,
  YamlIcon,
  globalLucideIcons,
} from '@base-ui/icons';
import { appConfig } from '@/lib/appConfig';
import { ddaasMdxCapabilities } from '@/lib/mdx-capabilities';

const languageToIconMap = {
  css: <CSSIcon />,
  csv: <CSVIcon />,
  diff: <DiffIcon />,
  html: <HtmlIcon />,
  http: <HttpIcon />,
  java: <JavaIcon />,
  json: <JsonIcon />,
  jsonc: <SquareDashedBottomCodeIcon />,
  log: <LogIcon />,
  mdx: <MDXIcon />,
  regex: <RegexIcon />,
  sql: <SQLIcon />,
  text: <TxtIcon />,
  txt: <TxtIcon />,
  plaintext: <TxtIcon />,
  scheme: <SchemeIcon />,
  xml: <XMLIcon />,
  yaml: <YamlIcon />,
  yml: <YamlIcon />,
};

export const getMDXComponents = createSiteMdxComponents({
  features: toSiteMdxFeatures(ddaasMdxCapabilities),
  imageFallbackSrc: appConfig.style.placeHolder.image,
  cdnBaseUrl: appConfig.style.cdnBaseUrl,
  watermarkEnabled: appConfig.style.watermark.enabled,
  watermarkText: appConfig.style.watermark.text,
  additionalComponents: {
    SiteX,
    ...globalLucideIcons,
  },
  iconMap: languageToIconMap,
});

export const useMDXComponents = getMDXComponents;
