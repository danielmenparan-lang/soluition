type ChatNoticeProps = {
  variant: "owner" | "not-for-customers";
};

export function ChatNotice({ variant }: ChatNoticeProps) {
  if (variant === "not-for-customers") {
    return (
      <div className="ms-chat-notice ms-chat-notice-info">
        <strong>Note:</strong> This chat is for you — the store owner. Visitors
        never see it. This app does not embed a customer-facing chat on your
        storefront.
      </div>
    );
  }

  return (
    <div className="ms-chat-notice ms-chat-notice-success">
      <strong>Yes — you have a chat assistant.</strong> Ask about sales, products,
      and marketing. Answers use your real store tracking data.
    </div>
  );
}
