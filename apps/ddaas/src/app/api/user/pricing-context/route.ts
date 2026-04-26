import { getMoneyPriceInitUserContext } from '@windrun-huaiin/backend-core/pricing/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const initUserContext = await getMoneyPriceInitUserContext();
  return NextResponse.json(initUserContext);
}
