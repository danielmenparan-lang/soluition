import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData } from "react-router";
import { useEffect, useRef, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { useShopifyFetcher } from "../hooks/useShopifyFetcher";
import { getOrCreateShop } from "../services/shop.server";
import { chatWithAI, getChatConversations } from "../services/ai.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const conversations = await getChatConversations(shop.id);
  return { conversations };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const formData = await request.formData();
  const message = formData.get("message") as string;
  const conversationId = formData.get("conversationId") as string | null;

  if (!message?.trim()) {
    return { error: "הודעה ריקה" };
  }

  try {
    const result = await chatWithAI(
      shop.id,
      conversationId || null,
      message.trim(),
    );
    return {
      conversationId: result.conversationId,
      reply: result.reply,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "שגיאה בצ'אט";
    return { error: msg };
  }
};

const SUGGESTED_QUESTIONS = [
  "למה המכירות ירדו?",
  "איזה מוצר לפרסם השבוע?",
  "איזה קהל הכי רווחי?",
  "איפה אני מפסיד כסף?",
  "איך להגדיל המרות?",
];

export default function Chat() {
  const { conversations } = useLoaderData<typeof loader>();
  const fetcher = useShopifyFetcher<typeof action>();
  const shopify = useAppBridge();
  const { Form, actionUrl } = fetcher;
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fetcher.data && "reply" in fetcher.data && fetcher.data.reply) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fetcher.data!.reply! },
      ]);
      if (fetcher.data.conversationId) {
        setConversationId(fetcher.data.conversationId);
      }
    }
    if (fetcher.data && "error" in fetcher.data && fetcher.data.error) {
      shopify.toast.show(fetcher.data.error);
    }
  }, [fetcher.data, shopify]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (text: string) => {
    if (!text.trim() || fetcher.state !== "idle") return;
    setMessages((prev) => [...prev, { role: "user", content: text.trim() }]);
    setInput("");
  };

  return (
    <s-page heading="צ'אט AI — מנהל השיווק">
      <s-section>
        <p className="ms-page-intro">
          שאל שאלות על הביצועים, המוצרים והקהלים — Claude עונה על בסיס נתוני
          החנות האמיתיים שלך.
        </p>
      </s-section>

      <s-section heading="שאלות מומלצות">
        <div className="ms-link-row">
          {SUGGESTED_QUESTIONS.map((q) => (
            <Form
              key={q}
              method="post"
              action={actionUrl}
              onSubmit={() => handleSubmit(q)}
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
              <h3 className="ms-empty-title">שלום! 👋</h3>
              <p className="ms-empty-text">
                אני מנהל השיווק AI של החנות. שאל אותי על ביצועים, מוצרים,
                קהלים או המלצות — אני מבוסס על הנתונים שלך.
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`ms-chat-bubble ${msg.role === "user" ? "ms-chat-user" : "ms-chat-ai"}`}
            >
              <div className="ms-chat-label">
                {msg.role === "user" ? "אתה" : "AI Marketing Manager"}
              </div>
              {msg.content}
            </div>
          ))}
          {fetcher.state !== "idle" && (
            <div className="ms-loading">⏳ מנתח נתונים ומכין תשובה...</div>
          )}
          <div ref={bottomRef} />
        </div>
      </s-section>

      <s-section>
        <Form
          method="post"
          action={actionUrl}
          onSubmit={() => handleSubmit(input)}
        >
          <input type="hidden" name="conversationId" value={conversationId ?? ""} />
          <div className="ms-input-row">
            <input
              type="text"
              name="message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="שאל שאלה על החנות שלך..."
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
