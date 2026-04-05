import { redirect } from "next/navigation";

type LocalizedSalesConversionRedirectProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function getFirstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LocalizedSalesConversionRedirect({
  params,
  searchParams,
}: LocalizedSalesConversionRedirectProps) {
  const { locale } = await params;
  const incomingParams = await searchParams;
  const nextParams = new URLSearchParams();

  const category = getFirstValue(incomingParams.category);
  const product = getFirstValue(incomingParams.product);
  const slot = getFirstValue(incomingParams.slot);

  if (category) {
    nextParams.set("category", category);
  }
  if (product) {
    nextParams.set("product", product);
  }
  if (slot) {
    nextParams.set("slot", slot);
  }

  const query = nextParams.toString();
  redirect(query ? `/${locale}/sales/sales-patterns?${query}` : `/${locale}/sales/sales-patterns`);
}
