import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useEffect } from "react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { useShopifyFetcher } from "../hooks/useShopifyFetcher";
import { SubmitButton } from "../components/SubmitButton";
import { EmptyState } from "../components/ui/EmptyState";
import { getOrCreateShop } from "../services/shop.server";
import {
  generateWeeklyReport,
  getWeeklyReports,
} from "../services/ai.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const reports = await getWeeklyReports(shop.id);
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
  const shopify = useAppBridge();
  const latest = reports[0];
  const isGenerating = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data?.message) {
      shopify.toast.show(fetcher.data.message);
    } else if (fetcher.data?.success) {
      shopify.toast.show("דוח שבועי נוצר בהצלחה");
    }
  }, [fetcher.data, shopify]);

  return (
    <s-page heading="דוחות שבועיים">
      <SubmitButton fetcher={fetcher} slot="primary-action">
        {isGenerating ? "מייצר..." : "יצירת דוח שבועי"}
      </SubmitButton>

      <s-section>
        <p className="ms-page-intro">
          דוח AI שבועי עם תובנות, פעולות מומלצות, הזדמנויות צמיחה ונקודות בזבוז
          — מבוסס על נתוני 7 הימים האחרונים.
        </p>
      </s-section>

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
            <s-unordered-list>
              {(latest.insights as string[]).map((insight, i) => (
                <s-list-item key={i}>{insight}</s-list-item>
              ))}
            </s-unordered-list>
          </s-section>

          <s-section heading="פעולות עם Impact גבוה">
            <s-stack direction="block" gap="base">
              {(latest.top_actions as Array<{ action: string; impact: string }>).map(
                (item, i) => (
                  <div key={i} className="ms-card">
                    <s-text type="strong">{item.action}</s-text>
                    <s-paragraph>השפעה: {item.impact}</s-paragraph>
                  </div>
                ),
              )}
            </s-stack>
          </s-section>

          <s-section heading="הזדמנויות צמיחה">
            <s-unordered-list>
              {(latest.growth_opportunities as string[]).map((opp, i) => (
                <s-list-item key={i}>{opp}</s-list-item>
              ))}
            </s-unordered-list>
          </s-section>

          <s-section heading="נקודות בזבוז כסף">
            <s-unordered-list>
              {(latest.waste_points as string[]).map((point, i) => (
                <s-list-item key={i}>{point}</s-list-item>
              ))}
            </s-unordered-list>
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
