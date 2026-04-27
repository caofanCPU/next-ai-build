import { createOpenRouterRoute } from '@core/app/api/ai/route';
import { ddaasTestQueryService } from '@/server/services';

const TEST_USER_ID = '67d9531b-6223-4c1d-a306-dbb8c7ac53af';

export const POST = createOpenRouterRoute({
  hooks: {
    async beforeCall() {
      const user = await ddaasTestQueryService.findCoreUserByUserId(TEST_USER_ID);
      console.log('[ddaas ai/generate] test query result', {
        userId: TEST_USER_ID,
        found: Boolean(user),
        status: user?.status ?? null,
      });
    },
  },
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
