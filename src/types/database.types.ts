/**
 * =========================================================
 * SAFE DRIVE GLOBAL — DATABASE TYPES
 * =========================================================
 * Single source of truth for Supabase database typing.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | {
      [key: string]: Json | undefined;
    }
  | Json[];

export interface Database {
  public: {
    Tables: {
      gps_tracks: {
        Row: {
          id: number;
          flatbed_id: string;
          booking_id: string | null;
          lat: number;
          lng: number;
          speed: number | null;
          heading: number | null;
          updated_at: string;
        };

        Insert: {
          id?: number;
          flatbed_id: string;
          booking_id?: string | null;
          lat: number;
          lng: number;
          speed?: number | null;
          heading?: number | null;
          updated_at?: string;
        };

        Update: {
          id?: number;
          flatbed_id?: string;
          booking_id?: string | null;
          lat?: number;
          lng?: number;
          speed?: number | null;
          heading?: number | null;
          updated_at?: string;
        };

        Relationships: [];
      };

      bookings: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };

      flatbeds: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };

      providers: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };

      users: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };

    Views: {
      [_ in never]: never;
    };

    Functions: {
      [_ in never]: never;
    };

    Enums: {
      [_ in never]: never;
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
