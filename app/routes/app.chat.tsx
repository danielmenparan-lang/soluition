import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
  ShouldRevalidateFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { useEffect, useRef, useState } from "react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { useShopifyFetcher } from "../hooks/useShopifyFetcher";
import { useFetcherToast } from "../hooks/useFetcherToast";
import { PageHero } from "../components/ui/PageHero";
import { HelpPanel } from "../components/ui/HelpPanel";
import { ChatNotice } from "../components/ui/ChatNotice";
import { ChatMessageBody } from "../components/ui/ChatMessageBody";
import { PAGE_HELP } from "../config/page-help";
import { getOrCreateShop } from "../services/shop.server";
import { chatWithAI, getChatConversations } from "../services/ai.server";
import { getDashboardMetrics } from "../services/analytics.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const [conversations, metrics] = await Promise.all([
    getChatConversations(shop.id).catch(() => []),
    getDashboardMetrics(shop.id).catch(() => null),
  ]);
  const hasData = Boolean(metrics && metrics.totalVisitors > 0);
  return { conversations, hasData };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const formData = await request.formData();
  const message = formData.get("message") as string;
  const conversationId = formData.get("conversationId") as string | null;

  if (!message?.trim()) {
    return { success: false, error: "הודעה ריקה" };
  }

  try {
    const result = await chatWithAI(
      shop.id,
      conversationId || null,
      message.trim(),
    );
    return {
      success: true,
      conversationId: result.conversationId,
      reply: result.reply,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "שגיאה בצ'אט";
    return { success: false, error: msg };
  }
};

export function shouldRevalidate({
  formAction,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) {
  if (formAction) return false;
  return defaultShouldRevalidate;
}

const SUGGESTED_WITH_DATA = [
  "למה המכירות ירדו?",
  "איזה מוצר לפרסם השבוע?",
  "מאיפה מגיעים הקונים?",
  "איפה אני מפסיד כסף?",
];

const SUGGESTED_NO_DATA = [
  "איך מפעילים מעקב?",
  "למה אין נתונים?",
  "מה לעשות קודם?",
  "איך מתחילים?",
];

export default function Chat() {
  const { conversations, hasData } = useLoaderData<typeof loader>();
  const fetcher = useShopifyFetcher<typeof action>();
  const { Form, actionUrl } = fetcher;
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const processedReplyRef = useRef<string | null>(null);

  useFetcherToast(fetcher);
  const help = PAGE_HELP.chat;
  const suggestedQuestions = hasData ? SUGGESTED_WITH_DATA : SUGGESTED_NO_DATA;

  useEffect(() => {
    if (fetcher.state !== "idle") return;
    if (!fetcher.data?.reply) return;

    const key = `${fetcher.data.conversationId ?? ""}:${fetcher.data.reply}`;
    if (processedReplyRef.current === key) return;

    processedReplyRef.current = key;
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: fetcher.data!.reply! },
    ]);
    if (fetcher.data.conversationId) {
      setConversationId(fetcher.data.conversationId);
    }
  }, [fetcher.state, fetcher.data]);

  useEffect(() => {
    if (fetcher.state === "idle") {
      submittingRef.current = false;
    }
  }, [fetcher.state]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (text: string) => {
    if (!text.trim() || fetcher.state !== "idle" || submittingRef.current) {
      return false;
    }
    submittingRef.current = true;
    setMessages((prev) => [...prev, { role: "user", content: text.trim() }]);
    setInput("");
    return true;
  };

  return (
    <s-page>
      <PageHero
        title={help.title}
        subtitle={help.subtitle}
        variant="ai"
        compact
      />
      <HelpPanel title={help.helpTitle} items={help.helpItems} />

      <ChatNotice variant="owner" />
      <ChatNotice variant="not-for-customers" />

      <s-section heading={hasData ? "שאלות לדוגמה" : "עדיין אין נתונים? התחל כאן"}>
        <div className="ms-link-row">
          {suggestedQuestions.map((q) => (
            <Form
              key={q}
              method="post"
              action={actionUrl}
              onSubmit={(event) => {
                if (!handleSubmit(q)) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="message" value={q} />
              <input
                type="hidden"
                name="conversationId"
                value={conversationId ?? ""}
              />
              <button
                type="submit"
                disabled={fetcher.state !== "idle"}
                className="ms-btn ms-btn-chip"
              >
                {q}
              </button>
            </Form>
          ))}
        </div>
      </s-section>

      <s-section>
        <div className="ms-chat-panel">
          {messages.length === 0 && (
            <div className="ms-empty" style={{ border: "none", background: "transparent" }}>
              <h3 className="ms-empty-title">שלום!</h3>
              <p className="ms-empty-text">
                {hasData
                  ? "שאל אותי על מכירות, פרסום, מוצרים — אני עונה לפי הנתונים מהחנות."
                  : "עדיין אין נתונים מהחנות. לחץ «איך מפעילים מעקב?» למטה, או חזור לדף «בית» להפעיל את המעקב."}
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`ms-chat-bubble ${msg.role === "user" ? "ms-chat-user" : "ms-chat-ai"}`}
            >
              <div className="ms-chat-label">
                {msg.role === "user" ? "אתה" : "העוזר"}
              </div>
              <ChatMessageBody content={msg.content} />
            </div>
          ))}
          {fetcher.state !== "idle" && (
            <div className="ms-loading">חושב על תשובה...</div>
          )}
          <div ref={bottomRef} />
        </div>
      </s-section>

      <s-section>
        <Form
          method="post"
          action={actionUrl}
          onSubmit={(event) => {
            if (!handleSubmit(input)) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="conversationId" value={conversationId ?? ""} />
          <div className="ms-input-row">
            <input
              type="text"
              name="message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="כתוב שאלה — למשל: למה המכירות ירדו?"
              className="ms-input"
              disabled={fetcher.state !== "idle"}
            />
            <button
              type="submit"
              disabled={fetcher.state !== "idle" || !input.trim()}
              className="ms-btn ms-btn-primary"
            >
              שלח
            </button>
          </div>
        </Form>
      </s-section>

      {conversations.length > 0 && (
        <s-section heading="שיחות קודמות">
          <s-unordered-list>
            {conversations.slice(0, 5).map((c) => (
              <s-list-item key={c.id}>
                {c.title ?? "שיחה"} —{" "}
                {new Date(c.updated_at).toLocaleDateString("he-IL")}
              </s-list-item>
            ))}
          </s-unordered-list>
        </s-section>
      )}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
