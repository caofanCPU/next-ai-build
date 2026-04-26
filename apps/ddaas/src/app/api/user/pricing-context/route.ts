// Fix BigInt serialization issue
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import { getMoneyPriceInitUserContext } from '@core/pricing/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const initUserContext = await getMoneyPriceInitUserContext();
  return NextResponse.json(initUserContext);
}
