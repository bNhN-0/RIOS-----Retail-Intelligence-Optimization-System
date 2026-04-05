import { redirect } from "next/navigation";

export default async function LocalizedInventoryIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/inventory/overview`);
}
