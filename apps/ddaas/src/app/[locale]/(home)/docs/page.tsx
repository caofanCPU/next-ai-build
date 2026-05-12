import { SiteIcon } from '@/lib/site-config';
import { NotFoundPage } from '@third-ui/main';

export default async function D8gerPage() {
  return (
    <NotFoundPage siteIcon={<SiteIcon />} />
  );
}
