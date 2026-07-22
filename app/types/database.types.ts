export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableDef<Row, Insert> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      shops: TableDef<{
          id: string;
          shop_domain: string;
          shop_name: string | null;
          tracking_id: string;
          settings: Json;
          created_at: string;
          updated_at: string;
        }, {
          id?: string;
          shop_domain: string;
          shop_name?: string | null;
          tracking_id?: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        }>;
      visitors: TableDef<{
          id: string;
          shop_id: string;
          visitor_id: string;
          is_returning: boolean;
          visit_count: number;
          first_seen_at: string;
          last_seen_at: string;
          country: string | null;
          city: string | null;
          device_type: string | null;
          browser: string | null;
          os: string | null;
        }, {
          id?: string;
          shop_id: string;
          visitor_id: string;
          is_returning?: boolean;
          visit_count?: number;
          first_seen_at?: string;
          last_seen_at?: string;
          country?: string | null;
          city?: string | null;
          device_type?: string | null;
          browser?: string | null;
          os?: string | null;
        }>;
      visitor_sessions: TableDef<{
          id: string;
          shop_id: string;
          visitor_uuid: string;
          session_id: string;
          started_at: string;
          ended_at: string | null;
          duration_seconds: number | null;
          landing_page: string | null;
          exit_page: string | null;
          referrer: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_term: string | null;
          utm_content: string | null;
          traffic_source: string | null;
          converted: boolean;
          order_value: number | null;
        }, {
          id?: string;
          shop_id: string;
          visitor_uuid: string;
          session_id: string;
          started_at?: string;
          ended_at?: string | null;
          duration_seconds?: number | null;
          landing_page?: string | null;
          exit_page?: string | null;
          referrer?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_term?: string | null;
          utm_content?: string | null;
          traffic_source?: string | null;
          converted?: boolean;
          order_value?: number | null;
        }>;
      page_views: TableDef<{
          id: string;
          shop_id: string;
          session_uuid: string;
          visitor_uuid: string;
          url: string;
          page_title: string | null;
          time_on_page_seconds: number | null;
          is_exit: boolean;
          viewed_at: string;
        }, {
          id?: string;
          shop_id: string;
          session_uuid: string;
          visitor_uuid: string;
          url: string;
          page_title?: string | null;
          time_on_page_seconds?: number | null;
          is_exit?: boolean;
          viewed_at?: string;
        }>;
      events: TableDef<{
          id: string;
          shop_id: string;
          session_uuid: string;
          visitor_uuid: string;
          event_type: string;
          event_data: Json;
          product_id: string | null;
          product_title: string | null;
          collection_id: string | null;
          order_value: number | null;
          search_query: string | null;
          button_label: string | null;
          created_at: string;
        }, {
          id?: string;
          shop_id: string;
          session_uuid: string;
          visitor_uuid: string;
          event_type: string;
          event_data?: Json;
          product_id?: string | null;
          product_title?: string | null;
          collection_id?: string | null;
          order_value?: number | null;
          search_query?: string | null;
          button_label?: string | null;
          created_at?: string;
        }>;
      product_analytics: TableDef<{
          id: string;
          shop_id: string;
          product_id: string;
          product_title: string | null;
          date: string;
          views: number;
          add_to_carts: number;
          purchases: number;
          revenue: number;
        }, {
          id?: string;
          shop_id: string;
          product_id: string;
          product_title?: string | null;
          date: string;
          views?: number;
          add_to_carts?: number;
          purchases?: number;
          revenue?: number;
        }>;
      segments: TableDef<{
          id: string;
          shop_id: string;
          name: string;
          slug: string;
          description: string | null;
          segment_type: string;
          criteria: Json;
          member_count: number;
          refreshed_at: string | null;
        }, {
          id?: string;
          shop_id: string;
          name: string;
          slug: string;
          description?: string | null;
          segment_type: string;
          criteria?: Json;
          member_count?: number;
          refreshed_at?: string | null;
        }>;
      segment_members: TableDef<{
          segment_id: string;
          visitor_uuid: string;
          added_at: string;
        }, {
          segment_id: string;
          visitor_uuid: string;
          added_at?: string;
        }>;
      ai_recommendations: TableDef<{
          id: string;
          shop_id: string;
          category: string;
          title: string;
          description: string;
          priority: "high" | "medium" | "low";
          expected_impact: string | null;
          action_items: Json;
          status: "active" | "dismissed" | "completed";
          generated_at: string;
        }, {
          id?: string;
          shop_id: string;
          category: string;
          title: string;
          description: string;
          priority: "high" | "medium" | "low";
          expected_impact?: string | null;
          action_items?: Json;
          status?: "active" | "dismissed" | "completed";
          generated_at?: string;
        }>;
      weekly_reports: TableDef<{
          id: string;
          shop_id: string;
          week_start: string;
          week_end: string;
          insights: Json;
          top_actions: Json;
          growth_opportunities: Json;
          waste_points: Json;
          performance_summary: string | null;
          generated_at: string;
        }, {
          id?: string;
          shop_id: string;
          week_start: string;
          week_end: string;
          insights?: Json;
          top_actions?: Json;
          growth_opportunities?: Json;
          waste_points?: Json;
          performance_summary?: string | null;
          generated_at?: string;
        }>;
      chat_conversations: TableDef<{
          id: string;
          shop_id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
        }, {
          id?: string;
          shop_id: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        }>;
      chat_messages: TableDef<{
          id: string;
          conversation_id: string;
          role: "user" | "assistant";
          content: string;
          created_at: string;
        }, {
          id?: string;
          conversation_id: string;
          role: "user" | "assistant";
          content: string;
          created_at?: string;
        }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Shop = Database["public"]["Tables"]["shops"]["Row"];
export type Visitor = Database["public"]["Tables"]["visitors"]["Row"];
export type VisitorSession =
  Database["public"]["Tables"]["visitor_sessions"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type AIRecommendation =
  Database["public"]["Tables"]["ai_recommendations"]["Row"];
export type WeeklyReport =
  Database["public"]["Tables"]["weekly_reports"]["Row"];
export type Segment = Database["public"]["Tables"]["segments"]["Row"];

export type EventType =
  | "page_view"
  | "product_view"
  | "collection_view"
  | "add_to_cart"
  | "checkout_start"
  | "purchase"
  | "search"
  | "button_click"
  | "session_start"
  | "session_end";

export type RecommendationCategory =
  | "marketing"
  | "product"
  | "conversion"
  | "retargeting";

export type SegmentType =
  | "high_intent"
  | "window_shoppers"
  | "returning_customers"
  | "facebook_mobile"
  | "google_desktop"
  | "tiktok_traffic"
  | "international"
  | "custom";

export type TrafficSource =
  | "google"
  | "facebook"
  | "instagram"
  | "tiktok"
  | "email"
  | "direct"
  | "other";
