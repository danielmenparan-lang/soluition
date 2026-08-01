import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { useShopifyFetcher } from "../hooks/useShopifyFetcher";
import { useFetcherToast } from "../hooks/useFetcherToast";
import { SubmitButton } from "../components/SubmitButton";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHero } from "../components/ui/PageHero";
import { HelpPanel } from "../components/ui/HelpPanel";
import { ReportDetail, ReportHistory } from "../components/ui/ReportDetail";
import { PAGE_HELP } from "../config/page-help";
import { getOrCreateShop } from "../services/shop.server";
import {
  generateWeeklyReport,
  getWeeklyReports,
} from "../services/ai.server";
import {
  assertCanOutput,
  recordOutput,
  UsageLimitError,
} from "../services/usage.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const reports = await getWeeklyReports(shop.id).catch(() => []);
  const url = new URL(request.url);
  const selectedId = url.searchParams.get("report");
  const selected =
    reports.find((r) => r.id === selectedId) ?? reports[0] ?? null;

  return { reports, selected };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  try {
    await assertCanOutput(shop.id);
    await generateWeeklyReport(shop.id);
    await recordOutput(shop.id);
    return { success: true, message: "Your weekly report is ready." };
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return { success: false, message: error.message };
    }
    const message = error instanceof Error ? error.message : "Failed to generate report";
    return { success: false, message };
  }
};

export default function Reports() {
  const { reports, selected } = useLoaderData<typeof loader>();
  const fetcher = useShopifyFetcher<typeof action>();
  const isGenerating = fetcher.state !== "idle";

  useFetcherToast(fetcher);
  const help = PAGE_HELP.reports;

  return (
    <s-page heading="Reports">
      <PageHero title={help.title} subtitle={help.subtitle} variant="reports" compact />
      <HelpPanel title={help.helpTitle} items={help.helpItems} />

      <SubmitButton fetcher={fetcher} slot="primary-action" intent="generate_report">
        {isGenerating ? "Generating…" : "Generate weekly report"}
      </SubmitButton>

      {isGenerating ? (
        <s-section>
          <div className="ms-status-banner ms-status-banner-animate">
            <span className="ms-loading">Analyzing last 7 days…</span>
          </div>
        </s-section>
      ) : null}

      {!selected ? (
        <s-section>
          <EmptyState
            icon="report"
            title="No reports yet"
            description="Generate your first weekly summary — key takeaways, actions, and waste signals from the last 7 days."
            action={
              <SubmitButton fetcher={fetcher} intent="generate_report">
                {isGenerating ? "Generating…" : "Generate first report"}
              </SubmitButton>
            }
          />
        </s-section>
      ) : (
        <s-section>
          <div className="ms-report-layout">
            <ReportDetail report={selected} />
            <ReportHistory reports={reports} selectedId={selected.id} />
          </div>
        </s-section>
      )}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
