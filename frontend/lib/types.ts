export type EventType =
  | "school"
  | "sport"
  | "birthday"
  | "fundraiser"
  | "meeting"
  | "deadline"
  | "other";

export interface ActionItem {
  description: string;
  cost_estimate_gbp?: number | null;
}

export interface ParentEvent {
  title: string;
  event_type: EventType;
  start_time: string;
  end_time?: string | null;
  is_all_day: boolean;
  location?: string | null;
  description?: string | null;
  action_items: ActionItem[];
  confidence: number;
}

export interface ExtractResponse {
  event: ParentEvent;
  model_used: string;
  tokens_used: number;
}
