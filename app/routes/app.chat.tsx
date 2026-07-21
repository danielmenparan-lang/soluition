import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useEffect, useRef, useState } from "react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
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

  const result = await chatWithAI(
    shop.id,
    conversationId || null,
    message.trim(),
  );

  return {
    conversationId: result.conversationId,
    reply: result.reply,
  };
};

const SUGGESTED_QUESTIONS = [
  "למה המכירות ירדו?",
  "איזה מוצר לפרסם השבוע?",
  "איזה קהל הכי רווחי?",
  "איפה אני מפסיד כסף?",
  "איך להגדיל Conversion?",
];

export default function Chat() {
  const { conversations } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
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
  }, [fetcher.data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim() || fetcher.state !== "idle") return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    fetcher.submit(
      { message: text, conversationId: conversationId ?? "" },
      { method: "POST" },
    );
  };

  return (
    <s-page heading="צ'אט AI — מנהל השיווק שלך">
      <s-section heading="שאלות מומלצות">
        <s-stack direction="inline" gap="small">
          {SUGGESTED_QUESTIONS.map((q) => (
            <s-button key={q} onClick={() => sendMessage(q)}>
              {q}
            </s-button>
          ))}
        </s-stack>
      </s-section>

      <s-section>
        <div
          style={{
            minHeight: "400px",
            maxHeight: "600px",
            overflowY: "auto",
            padding: "16px",
            background: "#f6f6f7",
            borderRadius: "8px",
          }}
        >
          {messages.length === 0 && (
            <s-paragraph>
              שלום! אני מנהל השיווק AI של החנות שלך. שאל אותי כל שאלה על
              הביצועים, המוצרים, הקהלים או ההמלצות.
            </s-paragraph>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                marginBottom: "12px",
                textAlign: msg.role === "user" ? "left" : "right",
              }}
            >
              <s-box
                padding="base"
                background={msg.role === "user" ? "base" : "subdued"}
                borderRadius="base"
              >
                <s-text type={msg.role === "user" ? "strong" : undefined}>
                  {msg.role === "user" ? "אתה" : "AI Marketing Manager"}
                </s-text>
                <s-paragraph>{msg.content}</s-paragraph>
              </s-box>
            </div>
          ))}
          {fetcher.state !== "idle" && (
            <s-paragraph>מנתח נתונים...</s-paragraph>
          )}
          <div ref={bottomRef} />
        </div>
      </s-section>

      <s-section>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
        >
          <s-stack direction="inline" gap="base">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="שאל שאלה על החנות שלך..."
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
              disabled={fetcher.state !== "idle"}
            />
            <s-button type="submit" disabled={fetcher.state !== "idle"}>
              שלח
            </s-button>
          </s-stack>
        </form>
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
