"use client";

import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type State = {
  status: "idle" | "loading" | "success" | "error";
  stage: "env" | "connection" | "auth" | "db";
  data: any;
  error: any;
};

export default function TestDB() {
  const [state, setState] = useState<State>({
    status: "idle",
    stage: "env",
    data: null,
    error: null,
  });

  useEffect(() => {
    const run = async () => {
      console.log("🚀 SafeDrive Diagnostic Starting...");

      // ─────────────────────────────
      // 1. ENV CHECK
      // ─────────────────────────────
      setState({
        status: "loading",
        stage: "env",
        data: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 12),
        },
        error: null,
      });

      // ─────────────────────────────
      // 2. AUTH TEST (NO TABLES)
      // ─────────────────────────────
      try {
        setState((prev) => ({
          ...prev,
          stage: "auth",
        }));

        const authResult = await supabase.auth.getSession();

        console.log("AUTH RESULT:", authResult);

        setState((prev) => ({
          ...prev,
          status: "loading",
          stage: "connection",
          data: authResult.data,
          error: authResult.error,
        }));
      } catch (err: any) {
        console.log("FATAL ERROR:", err);

        setState({
          status: "error",
          stage: "connection",
          data: null,
          error: {
            message: err?.message || "Unknown error",
            stack: err?.stack,
          },
        });

        return;
      }

      // ─────────────────────────────
      // 3. DATABASE TEST (SAFE TABLE CHECK)
      // ─────────────────────────────
      try {
        setState((prev) => ({
          ...prev,
          stage: "db",
        }));

        const { data, error } = await supabase
          .from("users")
          .select("id")
          .limit(1);

        console.log("DB RESULT:", { data, error });

        setState({
          status: error ? "error" : "success",
          stage: "db",
          data,
          error,
        });
      } catch (err: any) {
        console.log("DB ERROR:", err);

        setState({
          status: "error",
          stage: "db",
          data: null,
          error: {
            message: err?.message || "Unknown error",
          },
        });
      }
    };

    run();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "monospace" }}>
      <h1>🧪 SafeDrive Supabase Diagnostic (v2)</h1>

      <p>
        Status: <b>{state.status}</b>
      </p>

      <p>
        Stage: <b>{state.stage}</b>
      </p>

      <pre
        style={{
          marginTop: 20,
          background: "#0b0f14",
          color: "#00ff88",
          padding: 16,
          borderRadius: 8,
          overflowX: "auto",
        }}
      >
        {JSON.stringify(state, null, 2)}
      </pre>
    </div>
  );
}