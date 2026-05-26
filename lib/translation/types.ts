export type CallStatus =
  | "initiated"
  | "ringing"
  | "active"
  | "completed"
  | "missed"
  | "declined"
  | "failed";

export type ObjectType =
  | "prompt"
  | "contract"
  | "task"
  | "project"
  | "workflow"
  | "customer"
  | "ticket"
  | "document"
  | "agent"
  | "object"
  | null;

export interface TranslationCall {
  call_id: string;
  subscription_id: string | null;
  world_id: string | null;
  from_uid: number;
  to_uid: number | null;
  from_eid: string | null;
  to_eid: string | null;
  object_type: string | null;
  object_id: string | null;
  origin_app: string | null;
  origin_path: string | null;
  call_start_time: string;
  call_end_time: string | null;
  duration_seconds: number | null;
  source_language: string | null;
  destination_language: string | null;
  aws_session_id: string | null;
  google_translation_session_id: string | null;
  billing_rate: number | null;
  google_cost: number | null;
  aws_cost: number | null;
  total_cost: number | null;
  call_status: CallStatus;
  transcript_status: string | null;
  recording_status: string | null;
  created_date: string;
}

export interface UserLanguageConfig {
  uid: number;
  eid: string | null;
  subscription_id: string | null;
  world_id: string | null;
  translation_enabled: boolean;
  primary_language: string;
  secondary_language: string | null;
  preferred_voice: string | null;
  speech_rate: number;
  transcription_enabled: boolean;
}

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", region: "US" },
  { code: "en-GB", label: "English (UK)", region: "GB" },
  { code: "es", label: "Spanish", region: "ES" },
  { code: "fr", label: "French", region: "FR" },
  { code: "de", label: "German", region: "DE" },
  { code: "it", label: "Italian", region: "IT" },
  { code: "pt", label: "Portuguese", region: "PT" },
  { code: "pt-BR", label: "Portuguese (Brazil)", region: "BR" },
  { code: "nl", label: "Dutch", region: "NL" },
  { code: "pl", label: "Polish", region: "PL" },
  { code: "ja", label: "Japanese", region: "JP" },
  { code: "ko", label: "Korean", region: "KR" },
  { code: "zh", label: "Chinese (Simplified)", region: "CN" },
  { code: "zh-TW", label: "Chinese (Traditional)", region: "TW" },
  { code: "ar", label: "Arabic", region: "SA" },
  { code: "hi", label: "Hindi", region: "IN" },
  { code: "ga", label: "Irish", region: "IE" },
] as const;
