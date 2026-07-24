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
  await generateWeeklyReport(shop.id);
  return { success: true };
};

export default function Reports() {
  const { reports } = useLoaderData<typeof loader>();
  const fetcher = useShopifyFetcher<typeof action>();
  const shopify = useAppBridge();

  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show("דוח שבועי נוצר בהצלחה");
    }
  }, [fetcher.data, shopify]);

  const latest = reports[0];

  return (
    <s-page heading="דוחות שבועיים">
      <s-button
        slot="primary-action"
        onClick={() => fetcher.submit({}, { method: "POST" })}
      >
        {fetcher.state !== "idle" ? "מייצר..." : "יצירת דוח שבועי"}
      </s-button>

      {!latest ? (
        <s-section>
          <s-paragraph>
            אין דוחות עדיין. לחץ על &quot;יצירת דוח שבועי&quot; כדי ליצור את
            הדוח הראשון.
          </s-paragraph>
        </s-section>
      ) : (
        <>
          <s-section heading={`דוח: ${latest.week_start} — ${latest.week_end}`}>
            <s-paragraph>{latest.performance_summary}</s-paragraph>
          </s-section>

          <s-section heading="10 תובנות מרכזיות">
            <s-unordered-list>
              {(latest.insights as string[]).map((insight, i) => (
                <s-list-item key={i}>{insight}</s-list-item>
              ))}
            </s-unordered-list>
          </s-section>

          <s-section heading="5 פעולות עם Impact גבוה">
            {(latest.top_actions as Array<{ action: string; impact: string }>).map(
              (item, i) => (
                <s-box key={i} padding="base" background="subdued" borderRadius="base">
                  <s-text type="strong">{item.action}</s-text>
                  <s-paragraph>Impact: {item.impact}</s-paragraph>
                </s-box>
              ),
            )}
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
