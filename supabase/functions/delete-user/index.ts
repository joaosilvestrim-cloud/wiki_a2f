// Edge Function: delete-user
// Remove o perfil (wiki.profiles) e o usuario do auth.
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
  try {
    const { userIdToDelete } = await req.json();
    if (!userIdToDelete) throw new Error("userIdToDelete e obrigatorio.");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { db: { schema: "wiki" } },
    );

    await admin.from("profiles").delete().eq("id", userIdToDelete);
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
