import { getUpstashSnapshot } from './actions';
import { TestPlayground } from './test-playground';

export default async function UpstashTestPage() {
  const snapshot = await getUpstashSnapshot();

  return <TestPlayground initialSnapshot={snapshot} />;
}
