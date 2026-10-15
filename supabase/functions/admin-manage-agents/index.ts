// Supabase Edge Function: admin-manage-agents
// Manages field agent accounts (create, reset password, activate/deactivate)
// Updated for Phase 0 (F4 security hotfix): bans auth user on deactivate, protects admins, validates inputs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AGENT_EMAIL_DOMAIN = "agents.shanmukhaagritech.app";
const USERNAME_REGEX = /^[a-z0-9._-]{3,30}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Client with service role to manage users
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized caller token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify caller is an active admin in profiles table
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (profileError || !adminProfile || adminProfile.role !== "admin" || !adminProfile.is_active) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Caller is not an active admin" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, payload } = await req.json();

    if (action === "create") {
      const { username, full_name, phone, password } = payload ?? {};
      if (!username || !full_name || !password) {
        return new Response(
          JSON.stringify({ error: "Username, full name, and password are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const cleanUsername = username.trim().toLowerCase();
      if (!USERNAME_REGEX.test(cleanUsername)) {
        return new Response(
          JSON.stringify({ error: "Username must be 3-30 characters and contain only lowercase letters, numbers, '.', '_', or '-'" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (typeof password !== "string" || password.length < 8) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 8 characters long" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const email = `${cleanUsername}@${AGENT_EMAIL_DOMAIN}`;

      // Check if username exists in profiles
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("username", cleanUsername)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ error: "Username is already taken" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create Auth user with auto-confirmed email
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: "agent", full_name, username: cleanUsername },
      });

      if (createError || !newUser.user) {
        console.error("Agent auth creation failed:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create agent user" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Insert profile row
      const { error: insertProfileError } = await supabaseAdmin.from("profiles").insert({
        id: newUser.user.id,
        role: "agent",
        full_name,
        username: cleanUsername,
        phone: phone || null,
        is_active: true,
        preferred_language: "en",
      });

      if (insertProfileError) {
        console.error("Profile insert failed:", insertProfileError);
        // Rollback auth user creation if profile insert fails
        await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        return new Response(
          JSON.stringify({ error: "Failed to create agent profile" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, user_id: newUser.user.id, email }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reset_password") {
      const { user_id, new_password } = payload ?? {};
      if (!user_id || !new_password) {
        return new Response(
          JSON.stringify({ error: "User ID and new password are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (typeof new_password !== "string" || new_password.length < 8) {
        return new Response(
          JSON.stringify({ error: "Password must be at least 8 characters long" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Refuse targeting self or another admin through agent management endpoint
      if (user_id === user.id) {
        return new Response(
          JSON.stringify({ error: "Cannot reset your own password via agent management endpoint" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: targetProfile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", user_id)
        .maybeSingle();

      if (targetProfile?.role === "admin") {
        return new Response(
          JSON.stringify({ error: "Refused: Cannot reset an administrator password" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        password: new_password,
      });

      if (resetError) {
        console.error("Password reset error:", resetError);
        return new Response(
          JSON.stringify({ error: "Failed to reset agent password" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "set_active") {
      const { user_id, is_active } = payload ?? {};
      if (!user_id || typeof is_active !== "boolean") {
        return new Response(
          JSON.stringify({ error: "User ID and is_active boolean are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Refuse deactivating self or another admin
      if (user_id === user.id) {
        return new Response(
          JSON.stringify({ error: "Refused: Cannot modify active status of your own account" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: targetProfile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", user_id)
        .maybeSingle();

      if (targetProfile?.role === "admin") {
        return new Response(
          JSON.stringify({ error: "Refused: Cannot modify active status of an administrator" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 1. Update profiles table
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ is_active })
        .eq("id", user_id);

      if (updateError) {
        console.error("Agent status update error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update agent status" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 2. Ban/un-ban auth user to immediately revoke active sessions (F4)
      const banDuration = is_active ? "none" : "876600h"; // 100 years ban when deactivated
      await supabaseAdmin.auth.admin.updateUserById(user_id, {
        ban_duration: banDuration,
      });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Unhandled admin-manage-agents exception:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
