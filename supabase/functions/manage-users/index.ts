import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      throw new Error("Unauthorized");
    }

    // Check if requesting user is admin or chairman
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id);

    const isAdmin = roles?.some(r => r.role === "admin" || r.role === "ic_chairman");
    if (!isAdmin) {
      throw new Error("Only admins can manage users");
    }

    const { action, userId } = await req.json();

    switch (action) {
      case "list": {
        // Get all users from auth
        const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        
        if (listError) throw listError;

        // Get profiles
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("*");

        // Get all roles
        const { data: allRoles } = await supabaseAdmin
          .from("user_roles")
          .select("*");

        const users = authUsers.users.map(user => {
          const profile = profiles?.find(p => p.id === user.id);
          const userRoles = allRoles?.filter(r => r.user_id === user.id).map(r => r.role) || [];
          
          return {
            id: user.id,
            email: user.email,
            full_name: profile?.full_name || user.user_metadata?.full_name,
            created_at: user.created_at,
            is_active: !(user as any).banned_until,
            roles: userRoles,
          };
        });

        return new Response(
          JSON.stringify({ users }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "deactivate": {
        if (!userId) throw new Error("User ID is required");

        // Ban the user (deactivate)
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: "876000h", // ~100 years
        });

        if (error) throw error;

        console.log(`User ${userId} deactivated`);
        return new Response(
          JSON.stringify({ success: true, message: "User deactivated" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "activate": {
        if (!userId) throw new Error("User ID is required");

        // Unban the user (activate)
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: "none",
        });

        if (error) throw error;

        console.log(`User ${userId} activated`);
        return new Response(
          JSON.stringify({ success: true, message: "User activated" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        if (!userId) throw new Error("User ID is required");

        // Don't allow deleting yourself
        if (userId === requestingUser.id) {
          throw new Error("Cannot delete your own account");
        }

        // Delete user roles first
        await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", userId);

        // Delete user sectors
        await supabaseAdmin
          .from("user_sectors")
          .delete()
          .eq("user_id", userId);

        // Delete the user from auth (this will cascade to profile via trigger)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (error) throw error;

        console.log(`User ${userId} deleted`);
        return new Response(
          JSON.stringify({ success: true, message: "User deleted" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});
