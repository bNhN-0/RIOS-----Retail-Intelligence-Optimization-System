import { redirect } from "next/navigation";

export default async function LocalizedSalesIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/sales/overview`);
}
