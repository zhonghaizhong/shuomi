import { AccountServerPage } from "@/components/workbench/account/account-server-page";
import { AccountOverviewPreview } from "@/components/workbench/account/account-overview-preview";
import { AccountShell } from "@/components/workbench/account/account-shell";

export default async function AccountEntryPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const { preview } = await searchParams;
  if (process.env.NODE_ENV === "development" && preview === "1") {
    return <AccountShell pathname="/workbench/account" title="我的账户" description="本机页面预览"><AccountOverviewPreview /></AccountShell>;
  }
  return <AccountServerPage page="overview" />;
}
