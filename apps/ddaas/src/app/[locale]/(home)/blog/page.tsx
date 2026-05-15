import { BlogHome } from './blog-home';

export default async function BlogHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return BlogHome({ locale });
}
