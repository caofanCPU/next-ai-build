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
}

export function createGET(options: CreateGETOptions) {
  return async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || options.defaultLocale || 'en';
    const translations = await options.resolveTranslations(locale);

    const payload = await buildCreditOverviewPayload({
      locale,
      defaultLocale: options.defaultLocale,
      localePrefixAsNeeded: options.localePrefixAsNeeded,
      translations,
      pricingPath: options.pricingPath,
      checkoutApiEndpoint: options.checkoutApiEndpoint,
      customerPortalApiEndpoint: options.customerPortalApiEndpoint,
    });

    return NextResponse.json(payload);
  };
}
