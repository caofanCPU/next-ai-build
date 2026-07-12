/* eslint-disable @typescript-eslint/no-explicit-any */

// Fix BigInt serialization issue
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import type { CreditOverviewTranslations } from '@windrun-huaiin/third-ui/main/credit';
import { NextResponse } from 'next/server';
import { buildCreditOverviewPayload } from '@core/lib/credit-overview';

export type CreditOverviewTranslationsResolver = (
  locale: string,
) => CreditOverviewTranslations | Promise<CreditOverviewTranslations>;

export interface CreateGETOptions {
  defaultLocale?: string;
  localePrefixAsNeeded?: boolean;
  resolveTranslations: CreditOverviewTranslationsResolver;
  pricingPath?: string;
  checkoutApiEndpoint?: string;
  customerPortalApiEndpoint?: string;
  enabledBillingTypes?: string[];
}

export function createGET(options: CreateGETOptions) {
  return async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || options.defaultLocale || 'en';
    const requestEnabledBillingTypes = searchParams
      .getAll('enabledBillingTypes')
      .flatMap((value) => value.split(','))
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    const translations = await options.resolveTranslations(locale);

    const payload = await buildCreditOverviewPayload({
      locale,
      defaultLocale: options.defaultLocale,
      localePrefixAsNeeded: options.localePrefixAsNeeded,
      translations,
      pricingPath: options.pricingPath,
      checkoutApiEndpoint: options.checkoutApiEndpoint,
      customerPortalApiEndpoint: options.customerPortalApiEndpoint,
      enabledBillingTypes: requestEnabledBillingTypes.length
        ? requestEnabledBillingTypes
        : options.enabledBillingTypes,
    });

    return NextResponse.json(payload);
  };
}
