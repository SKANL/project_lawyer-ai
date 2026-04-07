/**
 * Tipos placeholder de Supabase — reemplazar con tipos generados por Supabase CLI.
 * Ejecutar: npx supabase gen types typescript --project-id ytvmdjnxdvzjiuuizijt > src/types/database.ts
 * @see https://supabase.com/docs/guides/api/generating-types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          plan: string;
          country_code: string | null;
          onboarding_completed: boolean;
          locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          plan?: string;
          country_code?: string | null;
          onboarding_completed?: boolean;
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          org_id: string | null;
          full_name: string | null;
          role: string;
          status: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          org_id?: string | null;
          full_name?: string | null;
          role?: string;
          status?: string;
          avatar_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      clients: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
        };
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      plan_tier: 'trial' | 'starter' | 'pro' | 'firm';
      member_role: 'owner' | 'admin' | 'member' | 'viewer';
      member_status: 'active' | 'invited' | 'suspended';
    };
  };
}
