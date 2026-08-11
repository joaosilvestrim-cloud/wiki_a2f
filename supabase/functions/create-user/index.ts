// Edge Function: create-user
// Cria o usuario no auth e a linha correspondente em wiki.profiles.
// Contrato: POST { email, password, user_metadata } -> { user } | { error }
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
    const { email, password, user_metadata } = await req.json();
    if (!email || !password) throw new Error("email e password sao obrigatorios.");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { db: { schema: "wiki" } },
    );

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: user_metadata ?? {},
    });
    if (error) throw error;
    const u = data.user;

    // cria o perfil (o trigger de origem nao foi migrado)
    const { error: pErr } = await admin.from("profiles").insert({
      id: u.id,
      email,
      name: user_metadata?.name ?? email,
      role: user_metadata?.role ?? "user",
      department: user_metadata?.department ?? null,
      phone: user_metadata?.phone ?? null,
      location: user_metadata?.location ?? null,
      avatar_url: user_metadata?.avatar_url ?? null,
      is_admin: false,
      is_active: true,
    });
    if (pErr && !String(pErr.message).includes("duplicate")) {
      // nao falha o cadastro por causa do perfil; apenas reporta
      console.error("Falha ao criar perfil:", pErr.message);
    }

    return new Response(JSON.stringify({ user: u }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: { msg: (e as Error).message } }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
