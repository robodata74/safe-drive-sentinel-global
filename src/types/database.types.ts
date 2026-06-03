// src/types/database.types.ts
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          role: "customer" | "driver" | "admin" | "owner";
          company_id: string | null;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          role?: string;
          company_id?: string | null;
        };
        Update: {
          full_name?: string | null;
          phone?: string | null;
          role?: string;
          company_id?: string | null;
        };
      };

      gps_locations: {
        Row: {
          flatbed_id: string;
          lat: number;
          lng: number;
          speed: number;
          heading: number;
          updated_at: string;
        };
        Insert: {
          flatbed_id: string;
          lat: number;
          lng: number;
          speed: number;
          heading: number;
          updated_at?: string;
        };
        Update: Partial<{
          lat: number;
          lng: number;
          speed: number;
          heading: number;
          updated_at: string;
        }>;
      };
    };
  };
};
