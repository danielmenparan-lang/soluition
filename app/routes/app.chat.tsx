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
import { PageHero } from "../components/ui/PageHero";
import { HelpPanel } from "../components/ui/HelpPanel";
import { getOrCreateShop } from "../services/shop.server";
import {
  chatWithAI,
  getChatConversations,
  getChatMessages,
} from "../services/ai.server";
import { getStoreHealthSummary } from "../services/analytics.server";
import {
  assertCanOutput,
  recordOutput,
  UsageLimitError,
} from "../services/usage.server";
import { PAGE_HELP } from "../config/page-help";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await getOrCreateShop(session.shop);
  const url = new URL(request.url);
  const conversationId = url.searchParams.get("c");
  const prefilledQuestion = url.searchParams.get("q")?.trim() ?? "";

  const [conversations, health] = await Promise.all([
    getChatConversations(shop.id).catch(() => []),
    getStoreHealthSummary(shop.id).catch(() => null),
  ]);

  const hasVisitorData = Boolean(health?.metrics && health.metrics.totalVisitors > 0);
  const hasShopifyData = Boolean(health?.intelligence?.hasShopifyOrders);
  const hasData = hasVisitorData || hasShopifyData;

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
    prefilledQuestion,
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
  "What should I fix first this week?",
  "Why is conversion low?",
  "Which products should I promote?",
  "Where am I losing buyers?",
];

const SUGGESTED_NO_DATA = [
  "What should I do first?",
  "How do I enable tracking?",
  "How do I prepare before ads?",
  "What does Pro include?",
];

export default function Chat() {
  const {
    conversations,
    hasData,
    conversationId: loadedConversationId,
    initialMessages,
    prefilledQuestion,
  } = useLoaderData<typeof loader>();
  const fetcher = useShopifyFetcher<typeof action>();
  const { Form, actionUrl } = fetcher;
  const [messages, setMessages] = useState(initialMessages);
  const [conversationId, setConversationId] = useState<string | null>(
    loadedConversationId,
  );
  const [input, setInput] = useState(prefilledQuestion);
  const bottomRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const processedReplyRef = useRef<string | null>(null);
  const help = PAGE_HELP.chat;

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
    <s-page heading="Advisor">
      <PageHero title={help.title} subtitle={help.subtitle} variant="ai" compact />
      <HelpPanel title={help.helpTitle} items={help.helpItems} />

      <s-section>
        <ChatNotice variant="owner" />
        <ChatNotice variant="not-for-customers" />
      </s-section>

      <s-section>
        <div className="ms-advisor-layout">
          <div className="ms-advisor-main">
            <div className="ms-advisor-prompts">
              {suggestedQuestions.map((q) => (
                <Form
                  key={q}
                  method="post"
                  action={actionUrl}
                  onSubmit={(event) => {
                    if (!handleSubmit(q)) event.preventDefault();
                  }}
                >
                  <input type="hidden" name="message" value={q} />
                  <input type="hidden" name="conversationId" value={conversationId ?? ""} />
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

            <div className="ms-chat-panel ms-chat-panel-premium">
              {messages.length === 0 && (
                <div className="ms-advisor-empty">
                  <p className="ms-advisor-empty-kicker">Your AI CMO</p>
                  <h3>Ask anything about your store</h3>
                  <p>
                    {hasData
                      ? "Replies use your visitor tracking + Shopify order data. Pick a prompt or type below."
                      : "Limited data so far — I can still guide setup and next steps."}
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`ms-chat-bubble ${msg.role === "user" ? "ms-chat-user" : "ms-chat-ai"}`}
                >
                  <div className="ms-chat-label">
                    {msg.role === "user" ? "You" : "Solution Advisor"}
                  </div>
                  <ChatMessageBody content={msg.content} />
                </div>
              ))}
              {fetcher.state !== "idle" && (
                <div className="ms-advisor-typing">
                  <span className="ms-advisor-dot" />
                  <span className="ms-advisor-dot" />
                  <span className="ms-advisor-dot" />
                  Analyzing your store…
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <Form
              method="post"
              action={actionUrl}
              className="ms-advisor-compose"
              onSubmit={(event) => {
                if (!handleSubmit(input)) event.preventDefault();
              }}
            >
              <input type="hidden" name="conversationId" value={conversationId ?? ""} />
              <div className="ms-input-row ms-input-row-premium">
                <input
                  type="text"
                  name="message"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about sales, products, ads, or what to fix…"
                  className="ms-input ms-input-premium"
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
          </div>

          {conversations.length > 0 ? (
            <aside className="ms-advisor-sidebar">
              <h3 className="ms-advisor-sidebar-title">History</h3>
              <div className="ms-chat-history">
                {conversations.slice(0, 10).map((c) => (
                  <AppLink
                    key={c.id}
                    to={`/app/chat?c=${c.id}`}
                    className={`ms-chat-history-item ${conversationId === c.id ? "is-active" : ""}`}
                  >
                    <span className="ms-chat-history-title">{c.title ?? "Conversation"}</span>
                    <span className="ms-chat-history-date">
                      {new Date(c.updated_at).toLocaleDateString()}
                    </span>
                  </AppLink>
                ))}
              </div>
            </aside>
          ) : null}
        </div>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
