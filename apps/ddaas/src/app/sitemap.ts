import { appConfig } from "@/lib/appConfig";
import { resolveMdxSourceDir } from "@/lib/mdx-source";
import { createSitemapHandler } from "@third-ui/lib/server";

export default createSitemapHandler(
  appConfig.baseUrl,
  appConfig.i18n.locales as string[],
  resolveMdxSourceDir('blog'),
  true,
  appConfig.i18n.localePrefixAsNeeded,
  appConfig.i18n.defaultLocale
);
