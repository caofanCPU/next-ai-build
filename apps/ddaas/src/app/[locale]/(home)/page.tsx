
import { Hero } from "@/components/hero";
import { FingerprintStatus } from "@third-ui/clerk/fingerprint";
import { GradientButton } from "@third-ui/main/buttons";
import { CTA, FAQ, Features, Gallery, SeoContent, Tips, Usage } from "@third-ui/main/home/server";
import { getTranslations } from "next-intl/server";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const isDev = process.env.NODE_ENV !== 'production';
  const forceShow = process.env.SHOW_FINGERPRINT_STATUS === 'true'
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'gallery' });

  return (
    <>
      { (forceShow || isDev) && <FingerprintStatus />}
      <Hero locale={locale}/>
      <Gallery
        locale={locale}
        button={
          <GradientButton
            title={t("button.title")}
            href={t("button.href")}
            align={t("button.align") as "center" | "left" | "right"}
          />
        }
      />
      <Usage locale={locale} />
      <Features locale={locale} />
      <Tips locale={locale} />
      <FAQ locale={locale} />
      <SeoContent locale={locale} />
      <CTA locale={locale} />
    </>
  );
}
