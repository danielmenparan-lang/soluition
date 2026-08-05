/** Minimum traffic before marketing actions replace setup onboarding */
export const MARKETING_READY_VISITORS = 15;

/** Minimum traffic to consider tracking "working" */
export const TRACKING_WORKING_VISITORS = 5;

export function isMarketingHomeReady(
  totalVisitors: number,
  hasShopifyOrders: boolean,
): boolean {
  return hasShopifyOrders || totalVisitors >= MARKETING_READY_VISITORS;
}

export function hasWorkingTracking(
  totalVisitors: number,
  hasShopifyOrders: boolean,
): boolean {
  return hasShopifyOrders || totalVisitors >= TRACKING_WORKING_VISITORS;
}
