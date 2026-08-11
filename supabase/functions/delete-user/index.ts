// Edge Function: delete-user
// Remove o perfil (wiki.profiles) e o usuario do auth. Exige admin.
// Contrato: POST { userIdToDelete }
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
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: { user: caller } } = await admin.auth.getUser(token);
    if (!caller) throw new Error("nao autenticado.");
    const { data: callerProf } = await admin
      .schema("wiki").from("profiles").select("is_admin").eq("id", caller.id).single();
    if (!callerProf?.is_admin) throw new Error("apenas administradores.");

    const { userIdToDelete } = await req.json();
    if (!userIdToDelete) throw new Error("userIdToDelete e obrigatorio.");
    if (userIdToDelete === caller.id) throw new Error("nao pode excluir a propria conta.");

    await admin.schema("wiki").from("profiles").delete().eq("id", userIdToDelete);
    const { error } = await admin.auth.admin.deleteUser(userIdToDelete);
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
