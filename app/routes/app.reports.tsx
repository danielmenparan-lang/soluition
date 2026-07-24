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
import { PAGE_HELP } from "../config/page-help";
import { asActionItems, asStringArray } from "../utils/safe-json";
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
  return { reports };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);

  try {
    await assertCanOutput(shop.id);
    await generateWeeklyReport(shop.id);
    await recordOutput(shop.id);
    return { success: true, message: "Weekly report is ready" };
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return { success: false, message: error.message };
    }
    const message = error instanceof Error ? error.message : "Failed to generate report";
    return { success: false, message };
  }
};

export default function Reports() {
  const { reports } = useLoaderData<typeof loader>();
  const fetcher = useShopifyFetcher<typeof action>();
  const latest = reports[0];
  const isGenerating = fetcher.state !== "idle";

  useFetcherToast(fetcher);
  const help = PAGE_HELP.reports;

  const insights = latest ? asStringArray(latest.insights) : [];
  const topActions = latest ? asActionItems(latest.top_actions) : [];
  const growthOpportunities = latest ? asStringArray(latest.growth_opportunities) : [];
  const wastePoints = latest ? asStringArray(latest.waste_points) : [];

  return (
    <s-page>
      <PageHero title={help.title} subtitle={help.subtitle} variant="reports" compact />
      <HelpPanel title={help.helpTitle} items={help.helpItems} />

      <SubmitButton fetcher={fetcher} slot="primary-action">
        {isGenerating ? "Preparing..." : "Generate weekly report"}
      </SubmitButton>

      {!latest ? (
        <s-section>
          <EmptyState
            title="No report yet"
            description="Click Generate weekly report for a summary of the last 7 days."
            action={
              <SubmitButton fetcher={fetcher}>
                {isGenerating ? "Preparing..." : "Generate first report"}
              </SubmitButton>
            }
          />
        </s-section>
      ) : (
        <>
          <s-section heading={`Week: ${latest.week_start} — ${latest.week_end}`}>
            <div className="ms-card ms-card-ai">
              <s-paragraph>{latest.performance_summary}</s-paragraph>
            </div>
          </s-section>

          <s-section heading="Key takeaways">
            {insights.length > 0 ? (
              <s-unordered-list>
                {insights.map((insight, i) => (
                  <s-list-item key={i}>{insight}</s-list-item>
                ))}
              </s-unordered-list>
            ) : (
              <s-paragraph>No insights in this report.</s-paragraph>
            )}
          </s-section>

          <s-section heading="Actions for this week">
            {topActions.length > 0 ? (
              <s-stack direction="block" gap="base">
                {topActions.map((item, i) => (
                  <div key={i} className="ms-card">
                    <s-text type="strong">{item.action}</s-text>
                    <s-paragraph>Why it matters: {item.impact}</s-paragraph>
                  </div>
                ))}
              </s-stack>
            ) : (
              <s-paragraph>No actions in this report.</s-paragraph>
            )}
          </s-section>

          <s-section heading="Growth opportunities">
            {growthOpportunities.length > 0 ? (
              <s-unordered-list>
                {growthOpportunities.map((opp, i) => (
                  <s-list-item key={i}>{opp}</s-list-item>
                ))}
              </s-unordered-list>
            ) : (
              <s-paragraph>No growth opportunities in this report.</s-paragraph>
            )}
          </s-section>

          <s-section heading="Where budget may be wasted">
            {wastePoints.length > 0 ? (
              <s-unordered-list>
                {wastePoints.map((point, i) => (
                  <s-list-item key={i}>{point}</s-list-item>
                ))}
              </s-unordered-list>
            ) : (
              <s-paragraph>No waste points in this report.</s-paragraph>
            )}
          </s-section>
        </>
      )}

      {reports.length > 1 && (
        <s-section heading="Previous reports">
          <s-table>
            <s-table-header-row>
              <s-table-header>Week</s-table-header>
              <s-table-header>Created</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {reports.slice(1).map((r) => (
                <s-table-row key={r.id}>
                  <s-table-cell>
                    {r.week_start} — {r.week_end}
                  </s-table-cell>
                  <s-table-cell>
                    {new Date(r.generated_at).toLocaleDateString("en-US")}
                  </s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        </s-section>
      )}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
