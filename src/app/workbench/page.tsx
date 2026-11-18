import { CockpitEntry } from "@/components/workbench/console/cockpit-entry";
import { CockpitPreview } from "@/components/workbench/cockpit/cockpit-preview";

export default async function WorkbenchPage({ searchParams = Promise.resolve({}) }: { searchParams?: Promise<{ preview?: string }> } = {}) {
  if (process.env.NODE_ENV === "development" && (await searchParams).preview === "1") return <CockpitPreview />;
  return <CockpitEntry />;
}
