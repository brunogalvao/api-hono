interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly OPENAI_API_KEY: string;
  readonly GEMINI_API_KEY: string;
  readonly RESEND_API_KEY: string;
  readonly FRONTEND_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
