import getSupabase from "../supabase.server";
import { upsertShopOrder, type ShopOrderInput } from "./shop-orders.server";
import {
  recordSyncFailure,
  recordSyncSuccess,
  shouldAutoSync,
} from "./sync-status.server";

const MAX_ORDERS = 1000;
const MAX_PRODUCTS = 1000;
const ORDER_LOOKBACK_DAYS = 365;

type ShopifyAdmin = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

export type SyncResult = {
  ok: boolean;
  ordersSynced: number;
  productsSynced: number;
  error?: string;
};

function legacyId(gid: string): number {
  const parts = gid.split("/");
  return parseInt(parts[parts.length - 1] ?? "0", 10);
}

function moneyAmount(
  set: { shopMoney?: { amount?: string } } | null | undefined,
): number {
  return parseFloat(set?.shopMoney?.amount ?? "0");
}

const ORDERS_QUERY = `#graphql
  query SolutionSyncOrders($cursor: String, $query: String!) {
    orders(first: 50, after: $cursor, sortKey: CREATED_AT, reverse: true, query: $query) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          name
          createdAt
          sourceName
          displayFinancialStatus
          displayFulfillmentStatus
          totalPriceSet { shopMoney { amount currencyCode } }
          subtotalPriceSet { shopMoney { amount } }
          totalTaxSet { shopMoney { amount } }
          totalDiscountsSet { shopMoney { amount } }
          customer {
            legacyResourceId
            numberOfOrders
          }
          shippingAddress { countryCodeV2 }
          billingAddress { countryCodeV2 }
          lineItems(first: 50) {
            edges {
              node {
                title
                quantity
                product { legacyResourceId }
                originalUnitPriceSet { shopMoney { amount } }
              }
            }
          }
        }
      }
    }
  }
`;

const PRODUCTS_QUERY = `#graphql
  query SolutionSyncProducts($cursor: String) {
    products(first: 50, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          legacyResourceId
          title
          status
          productType
          vendor
          totalInventory
          variants(first: 25) {
            edges {
              node {
                price
                inventoryQuantity
              }
            }
          }
        }
      }
    }
  }
`;

export async function syncShopifyData(
  admin: ShopifyAdmin,
  shopId: string,
): Promise<SyncResult> {
  const since = new Date();
  since.setDate(since.getDate() - ORDER_LOOKBACK_DAYS);
  const query = `created_at:>=${since.toISOString().split("T")[0]}`;

  let ordersSynced = 0;
  let cursor: string | null = null;
  let hasNext = true;

  try {
    while (hasNext) {
      const response = await admin.graphql(ORDERS_QUERY, {
        variables: { cursor, query },
      });
      const json = (await response.json()) as {
        data?: {
          orders?: {
            pageInfo: { hasNextPage: boolean; endCursor: string | null };
            edges: Array<{ node: Record<string, unknown> }>;
          };
        };
        errors?: Array<{ message: string }>;
      };

      if (json.errors?.length) {
        throw new Error(json.errors[0]?.message ?? "Orders GraphQL failed");
      }

      const orders = json.data?.orders;
      if (!orders) break;

      for (const edge of orders.edges) {
        const node = edge.node;
        const lineItemEdges =
          (node.lineItems as { edges?: Array<{ node: Record<string, unknown> }> })
            ?.edges ?? [];
        const lineItems = lineItemEdges.map((li) => ({
          productId: String(
            (li.node.product as { legacyResourceId?: string } | null)
              ?.legacyResourceId ?? "",
          ),
          title: String(li.node.title ?? ""),
          quantity: Number(li.node.quantity ?? 1),
          price: moneyAmount(
            li.node.originalUnitPriceSet as { shopMoney?: { amount?: string } },
          ),
        }));

        const customer = node.customer as
          | { legacyResourceId?: string; numberOfOrders?: number }
          | null
          | undefined;

        const order: ShopOrderInput = {
          shopifyOrderId: legacyId(String(node.id)),
          orderNumber: String(node.name ?? ""),
          customerId: customer?.legacyResourceId
            ? parseInt(customer.legacyResourceId, 10)
            : null,
          customerOrdersCount: customer?.numberOfOrders ?? 1,
          totalPrice: moneyAmount(
            node.totalPriceSet as { shopMoney?: { amount?: string } },
          ),
          subtotalPrice: moneyAmount(
            node.subtotalPriceSet as { shopMoney?: { amount?: string } },
          ),
          totalTax: moneyAmount(
            node.totalTaxSet as { shopMoney?: { amount?: string } },
          ),
          totalDiscounts: moneyAmount(
            node.totalDiscountsSet as { shopMoney?: { amount?: string } },
          ),
          currency:
            (
              node.totalPriceSet as {
                shopMoney?: { currencyCode?: string };
              }
            )?.shopMoney?.currencyCode ?? "USD",
          financialStatus: String(node.displayFinancialStatus ?? ""),
          fulfillmentStatus: String(node.displayFulfillmentStatus ?? ""),
          lineItems,
          sourceName: String(node.sourceName ?? ""),
          countryCode:
            (node.shippingAddress as { countryCodeV2?: string } | null)
              ?.countryCodeV2 ??
            (node.billingAddress as { countryCodeV2?: string } | null)
              ?.countryCodeV2 ??
            null,
          orderedAt: String(node.createdAt ?? new Date().toISOString()),
        };

        await upsertShopOrder(shopId, order);
        ordersSynced += 1;
      }

      hasNext = orders.pageInfo.hasNextPage;
      cursor = orders.pageInfo.endCursor;
      if (ordersSynced >= MAX_ORDERS) break;
    }

    let productsSynced = 0;
    cursor = null;
    hasNext = true;
    const supabase = getSupabase();

    while (hasNext) {
      const response = await admin.graphql(PRODUCTS_QUERY, {
        variables: { cursor },
      });
      const json = (await response.json()) as {
        data?: {
          products?: {
            pageInfo: { hasNextPage: boolean; endCursor: string | null };
            edges: Array<{ node: Record<string, unknown> }>;
          };
        };
        errors?: Array<{ message: string }>;
      };

      if (json.errors?.length) {
        throw new Error(json.errors[0]?.message ?? "Products GraphQL failed");
      }

      const products = json.data?.products;
      if (!products) break;

      for (const edge of products.edges) {
        const node = edge.node;
        const variantEdges =
          (node.variants as { edges?: Array<{ node: Record<string, unknown> }> })
            ?.edges ?? [];
        const prices = variantEdges
          .map((v) => parseFloat(String(v.node.price ?? "0")))
          .filter((p) => p > 0);

        const row = {
          shop_id: shopId,
          shopify_product_id: parseInt(String(node.legacyResourceId ?? "0"), 10),
          title: String(node.title ?? ""),
          product_type: String(node.productType ?? ""),
          vendor: String(node.vendor ?? ""),
          status: String(node.status ?? ""),
          total_inventory: Number(node.totalInventory ?? 0),
          variant_count: variantEdges.length,
          price_min: prices.length ? Math.min(...prices) : 0,
          price_max: prices.length ? Math.max(...prices) : 0,
          synced_at: new Date().toISOString(),
        };

        if (row.shopify_product_id > 0) {
          const { error } = await supabase.from("shop_products").upsert(row, {
            onConflict: "shop_id,shopify_product_id",
          });
          if (error) {
            throw new Error(`shop_products upsert failed: ${error.message}`);
          }
          productsSynced += 1;
        }
      }

      hasNext = products.pageInfo.hasNextPage;
      cursor = products.pageInfo.endCursor;
      if (productsSynced >= MAX_PRODUCTS) break;
    }

    await recordSyncSuccess(shopId, ordersSynced, productsSynced);
    return { ok: true, ordersSynced, productsSynced };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    await recordSyncFailure(shopId, message);
    return { ok: false, ordersSynced, productsSynced: 0, error: message };
  }
}

export async function maybeSyncShopifyData(
  admin: ShopifyAdmin,
  shopId: string,
): Promise<void> {
  try {
    if (!(await shouldAutoSync(shopId))) return;
    await syncShopifyData(admin, shopId);
  } catch (error) {
    console.error(
      "[shopify-sync] background sync failed:",
      error instanceof Error ? error.message : error,
    );
  }
}
