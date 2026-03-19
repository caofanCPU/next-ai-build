import { enUS, zhCN } from '@clerk/localizations';
import type { LocalizationResource } from '@clerk/shared/types';

// https://github.com/clerk/javascript/blob/main/packages/localizations/src/en-US.ts#L492
// https://clerk.com/docs/customization/localization
const customZH: LocalizationResource = {
  ...zhCN,
}

export const clerkIntl = {
  en: enUS,
  zh: customZH,
}