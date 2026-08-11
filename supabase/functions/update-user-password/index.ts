// Edge Function: update-user-password
// Redefine a senha de um usuario. Exige que QUEM CHAMA seja admin.
// Contrato: POST { userId, password }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  try {
    // 1) exige admin
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) throw new Error("nao autenticado.");
    const { data: prof } = await admin
      .schema("wiki").from("profiles").select("is_admin").eq("id", user.id).single();
    if (!prof?.is_admin) throw new Error("apenas administradores.");

    // 2) acao
    const { userId, password } = await req.json();
    if (!userId || !password) throw new Error("userId e password sao obrigatorios.");
    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
