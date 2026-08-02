import { POSITIONING } from "../../config/positioning";

type MarketingResponsibilityNoticeProps = {
  compact?: boolean;
};

export function MarketingResponsibilityNotice({
  compact = false,
}: MarketingResponsibilityNoticeProps) {
  return (
    <p
      className={compact ? "ms-responsibility ms-responsibility-compact" : "ms-responsibility"}
      role="note"
    >
      {POSITIONING.responsibilityNotice}
    </p>
  );
}
