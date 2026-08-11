// Edge Function: send-email
// Envia via Resend se RESEND_API_KEY existir; senao registra e retorna sucesso.
// Exige usuario autenticado. Contrato: POST (body JSON) { to, subject, html }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) throw new Error("nao autenticado.");

    const raw = await req.text();
    const { to, subject, html } = JSON.parse(raw || "{}");
    if (!to || !subject) throw new Error("to e subject sao obrigatorios.");

    const key = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("RESEND_FROM") ?? "Intranet A2F <onboarding@resend.dev>";
    if (!key) {
      console.log("[send-email] RESEND_API_KEY ausente; nao enviado:", to);
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!r.ok) throw new Error(`Resend: ${r.status} ${await r.text()}`);

    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
