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
import { AppLink } from "../components/AppLink";
import { ChatNotice } from "../components/ui/ChatNotice";
import { ChatMessageBody } from "../components/ui/ChatMessageBody";
import { getOrCreateShop } from "../services/shop.server";
import {
  chatWithAI,
  getChatConversations,
  getChatMessages,
} from "../services/ai.server";
import { getDashboardMetrics } from "../services/analytics.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const url = new URL(request.url);
  const conversationId = url.searchParams.get("c");

  const [conversations, metrics] = await Promise.all([
    getChatConversations(shop.id).catch(() => []),
    getDashboardMetrics(shop.id).catch(() => null),
  ]);

  const hasData = Boolean(metrics && metrics.totalVisitors > 0);
  let initialMessages: Array<{ role: "user" | "assistant"; content: string }> =
    [];

  if (conversationId) {
    const belongsToShop = conversations.some((c) => c.id === conversationId);
    if (belongsToShop) {
      const history = await getChatMessages(conversationId).catch(() => []);
      initialMessages = history.map((message) => ({
        role: message.role as "user" | "assistant",
        content: message.content,
      }));
    }
  }

  return {
    conversations,
    hasData,
    conversationId: conversationId && initialMessages.length > 0 ? conversationId : null,
    initialMessages,
  };
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
  const { conversations, hasData, conversationId: loadedConversationId, initialMessages } =
    useLoaderData<typeof loader>();
  const fetcher = useShopifyFetcher<typeof action>();
  const { Form, actionUrl } = fetcher;
  const [messages, setMessages] = useState(initialMessages);
  const [conversationId, setConversationId] = useState<string | null>(
    loadedConversationId,
  );
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const processedReplyRef = useRef<string | null>(null);

  useFetcherToast(fetcher);
  const suggestedQuestions = hasData ? SUGGESTED_WITH_DATA : SUGGESTED_NO_DATA;

  useEffect(() => {
    setMessages(initialMessages);
    setConversationId(loadedConversationId);
    processedReplyRef.current = null;
  }, [initialMessages, loadedConversationId]);

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
    <s-page heading="צ'אט עם העוזר">
      <s-section>
        <div className="ms-chat-intro">
          <h2 className="ms-chat-intro-title">שאל כל שאלה על החנות</h2>
          <p className="ms-chat-intro-text">
            Solution שולחת לעוזר את הנתונים האמיתיים מהחנות — הוא מנתח ועונה
            בעברית. לא צריך לדעת שיווק או טכנולוגיה.
          </p>
        </div>
      </s-section>

      <s-section>
        <ChatNotice variant="owner" />
        <ChatNotice variant="not-for-customers" />
      </s-section>

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

      <s-section heading="שיחה">
        <div className="ms-chat-panel">
          {messages.length === 0 && (
            <div className="ms-empty ms-empty-chat">
              <h3 className="ms-empty-title">התחל שיחה</h3>
              <p className="ms-empty-text">
                {hasData
                  ? "כתוב שאלה למטה, או לחץ על אחת מהשאלות לדוגמה."
                  : "עדיין אין נתונים מהחנות — שאל «איך מפעילים מעקב?» או חזור ל«התחלה»."}
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
            <div className="ms-loading">מנתח נתונים וחושב על תשובה...</div>
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
        {conversationId ? (
          <AppLink to="/app/chat" className="ms-text-link ms-chat-new-link">
            + שיחה חדשה
          </AppLink>
        ) : null}
      </s-section>

      {conversations.length > 0 && (
        <s-section heading="שיחות קודמות">
          <div className="ms-chat-history">
            {conversations.slice(0, 8).map((c) => (
              <AppLink
                key={c.id}
                to={`/app/chat?c=${c.id}`}
                className={`ms-chat-history-item ${conversationId === c.id ? "is-active" : ""}`}
              >
                <span className="ms-chat-history-title">{c.title ?? "שיחה"}</span>
                <span className="ms-chat-history-date">
                  {new Date(c.updated_at).toLocaleDateString("he-IL")}
                </span>
              </AppLink>
            ))}
          </div>
        </s-section>
      )}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
