import { StoreListPage } from "@/components/workbench/stores/store-list-page";
import { StoreCenterPreview } from "@/components/workbench/stores/store-center-preview";

export default async function WorkbenchStoresPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const { preview } = await searchParams;
  if (process.env.NODE_ENV === "development" && preview === "1") return <StoreCenterPreview />;
  return <StoreListPage />;
}
