export type RfmSegment =
  | "champions"
  | "loyal"
  | "potential"
  | "new"
  | "at_risk"
  | "hibernating";

export const RFM_LABELS: Record<RfmSegment, string> = {
  champions: "Champions",
  loyal: "Loyal",
  potential: "Potential",
  new: "New",
  at_risk: "At risk",
  hibernating: "Hibernating",
};

export type StoreIntelligence = {
  metricCount: number;
  storeHealthScore: number;
  storeHealthGrade: "A" | "B" | "C" | "D" | "F";
  hasShopifyOrders: boolean;
  periodDays: number;
  primaryCurrency: string;

  dataQuality: {
    guestOrdersInPeriod: number;
    ordersMissingCustomer: number;
    catalogSynced: boolean;
    warnings: string[];
  };

  revenue: {
    totalRevenue: number;
    totalTax: number;
    totalDiscounts: number;
    discountRatePct: number;
    averageOrderValue: number;
    revenuePerDay: number;
    partiallyRefundedOrders: number;
  };

  orders: {
    totalOrders: number;
    ordersPerDay: number;
    newCustomerOrders: number;
    returningCustomerOrders: number;
    repeatPurchaseRatePct: number;
    avgItemsPerOrder: number;
    cancelledOrRefunded: number;
    unfulfilled: number;
    partiallyFulfilled: number;
    fulfilled: number;
  };

  customers: {
    uniqueCustomers: number;
    avgOrdersPerCustomer: number;
    avgSpendInPeriod: number;
    medianSpendInPeriod: number;
    avgLifetimeValue: number;
    medianLifetimeValue: number;
    top10PctLtvSharePct: number;
    oneTimeBuyers: number;
    repeatBuyers: number;
    repeatBuyerRatePct: number;
  };

  rfm: Record<RfmSegment, number>;

  catalog: {
    totalProducts: number;
    activeProducts: number;
    draftProducts: number;
    archivedProducts: number;
    outOfStockProducts: number;
    inStockRatePct: number;
    totalInventoryUnits: number;
    avgProductPrice: number;
    medianProductPrice: number;
    topProductTypes: Array<{ type: string; count: number }>;
    topVendors: Array<{ vendor: string; count: number }>;
  };

  orderTiming: {
    peakOrderHours: Array<{ hour: number; orders: number }>;
    peakOrderDays: Array<{ day: string; orders: number }>;
    weekdayOrders: number;
    weekendOrders: number;
  };

  orderGeo: Array<{ country: string; orders: number; revenue: number }>;
  orderSources: Array<{ source: string; orders: number; revenue: number }>;
  orderUtmSources: Array<{ source: string; orders: number; revenue: number }>;

  topProductsByRevenue: Array<{
    productId: string;
    title: string;
    units: number;
    revenue: number;
  }>;

  cohorts: Array<{
    month: string;
    customers: number;
    repeatWithinCohortPct: number;
  }>;

  periodComparison: {
    revenueChangePct: number | null;
    ordersChangePct: number | null;
    aovChangePct: number | null;
  };
};

export type ShopifySyncStatus = {
  lastSyncAt: string | null;
  lastSyncError: string | null;
  lastOrdersSynced: number;
  lastProductsSynced: number;
};
