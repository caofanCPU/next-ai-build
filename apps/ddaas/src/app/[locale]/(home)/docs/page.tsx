import { SiteIcon } from '@/lib/site-config';
import { AnimeNotFoundPage } from '@third-ui/main/anime';

export default async function D8gerPage() {
  return (
    <AnimeNotFoundPage siteIcon={<SiteIcon />} />
  );
}
