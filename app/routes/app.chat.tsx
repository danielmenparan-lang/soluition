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
import {
  assertCanOutput,
  recordOutput,
  UsageLimitError,
} from "../services/usage.server";

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
    return { success: false, error: "Empty message" };
  }

  try {
    await assertCanOutput(shop.id);
    const result = await chatWithAI(
      shop.id,
      conversationId || null,
      message.trim(),
    );
    await recordOutput(shop.id);
    return {
      success: true,
      conversationId: result.conversationId,
      reply: result.reply,
    };
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return { success: false, error: error.message };
    }
    const msg = error instanceof Error ? error.message : "Chat error";
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
  "What is limiting conversion right now?",
  "Which metric should I prioritize this week?",
  "Where is traffic underperforming?",
  "What store changes will move revenue fastest?",
];

const SUGGESTED_NO_DATA = [
  "Why is there no tracking data?",
  "What should I configure first?",
  "How do I validate the setup?",
  "What should I fix before launch?",
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
    <s-page heading="Store analyst">
      <s-section>
        <div className="ms-chat-intro">
          <h2 className="ms-chat-intro-title">Store analyst</h2>
          <p className="ms-chat-intro-text">
            Data-backed briefs with Summary, Analysis, and Recommended actions —
            written for operators, not generic marketing tips.
          </p>
        </div>
      </s-section>

      <s-section>
        <ChatNotice variant="owner" />
        <ChatNotice variant="not-for-customers" />
      </s-section>

      <s-section heading={hasData ? "Suggested prompts" : "Setup prompts"}>
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

      <s-section heading="Conversation">
        <div className="ms-chat-panel">
          {messages.length === 0 && (
            <div className="ms-empty ms-empty-chat">
              <h3 className="ms-empty-title">Start a conversation</h3>
              <p className="ms-empty-text">
                {hasData
                  ? "Ask a question or select a prompt — replies follow a structured analyst format."
                  : "No session data yet — start with a setup prompt or enable tracking on Home."}
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`ms-chat-bubble ${msg.role === "user" ? "ms-chat-user" : "ms-chat-ai"}`}
            >
              <div className="ms-chat-label">
                {msg.role === "user" ? "You" : "Assistant"}
              </div>
              <ChatMessageBody content={msg.content} />
            </div>
          ))}
          {fetcher.state !== "idle" && (
            <div className="ms-loading">Analyzing data and thinking...</div>
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
              placeholder="Ask a question — e.g. Why did traffic drop?"
              className="ms-input"
              disabled={fetcher.state !== "idle"}
            />
            <button
              type="submit"
              disabled={fetcher.state !== "idle" || !input.trim()}
              className="ms-btn ms-btn-primary"
            >
              Send
            </button>
          </div>
        </Form>
        {conversationId ? (
          <AppLink to="/app/chat" className="ms-text-link ms-chat-new-link">
            + New conversation
          </AppLink>
        ) : null}
      </s-section>

      {conversations.length > 0 && (
        <s-section heading="Previous conversations">
          <div className="ms-chat-history">
            {conversations.slice(0, 8).map((c) => (
              <AppLink
                key={c.id}
                to={`/app/chat?c=${c.id}`}
                className={`ms-chat-history-item ${conversationId === c.id ? "is-active" : ""}`}
              >
                <span className="ms-chat-history-title">{c.title ?? "Conversation"}</span>
                <span className="ms-chat-history-date">
                  {new Date(c.updated_at).toLocaleDateString("en-US")}
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
