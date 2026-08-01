type ChatNoticeProps = {
  variant: "owner" | "not-for-customers";
};

export function ChatNotice({ variant }: ChatNoticeProps) {
  if (variant === "not-for-customers") {
    return (
      <div className="ms-chat-notice ms-chat-notice-info">
        <strong>Note:</strong> This chat is for you — the store owner. Customers never
        see it. This app does not add a chat widget to your storefront.
      </div>
    );
  }

  return (
    <div className="ms-chat-notice ms-chat-notice-success">
      <strong>Chat is ready.</strong> Ask about sales, products, or setup — plain English answers.
    </div>
  );
}
