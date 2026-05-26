import { query } from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api";
import { SUPPORTED_LANGUAGES } from "@/lib/translation/types";

export async function GET() {
  try {
    const configs = await query(
      `SELECT config_key, config_value, description, updated_at FROM translation_platform_config ORDER BY config_key`
    );
    return jsonOk({
      platform: configs.rows,
      supportedLanguages: SUPPORTED_LANGUAGES,
      architecture: {
        model: "hybrid",
        aws: ["connection establishment", "session management", "WebRTC", "voice transport"],
        google: ["speech recognition", "translation", "voice synthesis", "transcription"],
      },
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to load config", 500);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { config_key, config_value } = body;
    if (!config_key || !config_value) {
      return jsonError("config_key and config_value required", 400);
    }
    await query(
      `UPDATE translation_platform_config SET config_value = $2::jsonb, updated_at = NOW() WHERE config_key = $1`,
      [config_key, JSON.stringify(config_value)]
    );
    return jsonOk({ updated: config_key });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to update config", 500);
  }
}
