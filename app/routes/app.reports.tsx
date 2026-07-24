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
    await generateWeeklyReport(shop.id);
    return { success: true, message: "דוח שבועי נוצר בהצלחה" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "יצירת דוח נכשלה";
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
      <PageHero
        title={help.title}
        subtitle={help.subtitle}
        tips={help.tips}
        variant="reports"
      />
      <HelpPanel title={help.helpTitle} items={help.helpItems} />

      <SubmitButton fetcher={fetcher} slot="primary-action">
        {isGenerating ? "מייצר..." : "יצירת דוח שבועי"}
      </SubmitButton>

      {!latest ? (
        <s-section>
          <EmptyState
            title="אין דוחות עדיין"
            description="לחץ 'יצירת דוח שבועי' — Claude ינתח את השבוע האחרון ויצור דוח מפורט."
            action={
              <SubmitButton fetcher={fetcher}>
                {isGenerating ? "מייצר..." : "יצירת דוח ראשון"}
              </SubmitButton>
            }
          />
        </s-section>
      ) : (
        <>
          <s-section heading={`דוח: ${latest.week_start} — ${latest.week_end}`}>
            <div className="ms-card ms-card-ai">
              <s-paragraph>{latest.performance_summary}</s-paragraph>
            </div>
          </s-section>

          <s-section heading="תובנות מרכזיות">
            {insights.length > 0 ? (
              <s-unordered-list>
                {insights.map((insight, i) => (
                  <s-list-item key={i}>{insight}</s-list-item>
                ))}
              </s-unordered-list>
            ) : (
              <s-paragraph>אין תובנות בדוח זה.</s-paragraph>
            )}
          </s-section>

          <s-section heading="פעולות עם Impact גבוה">
            {topActions.length > 0 ? (
              <s-stack direction="block" gap="base">
                {topActions.map((item, i) => (
                  <div key={i} className="ms-card">
                    <s-text type="strong">{item.action}</s-text>
                    <s-paragraph>השפעה: {item.impact}</s-paragraph>
                  </div>
                ))}
              </s-stack>
            ) : (
              <s-paragraph>אין פעולות מומלצות בדוח זה.</s-paragraph>
            )}
          </s-section>

          <s-section heading="הזדמנויות צמיחה">
            {growthOpportunities.length > 0 ? (
              <s-unordered-list>
                {growthOpportunities.map((opp, i) => (
                  <s-list-item key={i}>{opp}</s-list-item>
                ))}
              </s-unordered-list>
            ) : (
              <s-paragraph>אין הזדמנויות צמיחה בדוח זה.</s-paragraph>
            )}
          </s-section>

          <s-section heading="נקודות בזבוז כסף">
            {wastePoints.length > 0 ? (
              <s-unordered-list>
                {wastePoints.map((point, i) => (
                  <s-list-item key={i}>{point}</s-list-item>
                ))}
              </s-unordered-list>
            ) : (
              <s-paragraph>אין נקודות בזבוז בדוח זה.</s-paragraph>
            )}
          </s-section>
        </>
      )}

      {reports.length > 1 && (
        <s-section heading="דוחות קודמים">
          <s-table>
            <s-table-header-row>
              <s-table-header>שבוע</s-table-header>
              <s-table-header>נוצר</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {reports.slice(1).map((r) => (
                <s-table-row key={r.id}>
                  <s-table-cell>
                    {r.week_start} — {r.week_end}
                  </s-table-cell>
                  <s-table-cell>
                    {new Date(r.generated_at).toLocaleDateString("he-IL")}
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
