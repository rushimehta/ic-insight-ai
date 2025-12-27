import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ROLE_LABELS: Record<string, string> = {
  deal_team: "Deal Team",
  ic_member: "IC Member", 
  ic_chairman: "IC Chairman",
  admin: "Admin",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
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
      throw new Error("Only admins can create users");
    }

    const { email, fullName, roles: newUserRoles, sectors } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    console.log(`Creating user: ${email}`);

    // Create the user with a random password
    const tempPassword = crypto.randomUUID();
    
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      throw createError;
    }

    if (!newUser.user) {
      throw new Error("Failed to create user");
    }

    const userId = newUser.user.id;
    console.log(`User created with ID: ${userId}`);

    // Add roles
    if (newUserRoles && newUserRoles.length > 0) {
      const roleInserts = newUserRoles.map((role: string) => ({
        user_id: userId,
        role,
      }));

      const { error: rolesError } = await supabaseAdmin
        .from("user_roles")
        .insert(roleInserts);

      if (rolesError) {
        console.error("Error adding roles:", rolesError);
      }
    }

    // Add sector access
    if (sectors && sectors.length > 0) {
      const sectorInserts = sectors.map((sector: string) => ({
        user_id: userId,
        sector,
      }));

      const { error: sectorsError } = await supabaseAdmin
        .from("user_sectors")
        .insert(sectorInserts);

      if (sectorsError) {
        console.error("Error adding sectors:", sectorsError);
      }
    }

    // Generate password reset link
    const { data: linkData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    if (resetError) {
      console.error("Error generating reset link:", resetError);
    }

    // Send welcome email with Resend if configured
    if (resendApiKey && linkData?.properties?.action_link) {
      try {
        const resend = new Resend(resendApiKey);
        
        const roleLabels = (newUserRoles || []).map((r: string) => ROLE_LABELS[r] || r).join(", ");
        
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to IC Platform</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Hi ${fullName || "there"},
              </p>
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
                You've been invited to join the IC Platform. Your account has been created with the following access:
              </p>
              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0 0 8px 0; text-transform: uppercase;">Assigned Roles</p>
                <p style="font-size: 14px; color: #374151; margin: 0;">
                  ${roleLabels || "Standard User"}
                </p>
              </div>
              <div style="text-align: center; margin-top: 24px;">
                <a href="${linkData.properties.action_link}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Set Your Password
                </a>
              </div>
              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 24px;">
                This link will expire in 24 hours. If you didn't expect this invitation, please ignore this email.
              </p>
            </div>
          </div>
        `;

        await resend.emails.send({
          from: "IC Platform <onboarding@resend.dev>",
          to: [email],
          subject: "Welcome to IC Platform - Set Up Your Account",
          html: emailHtml,
        });

        console.log(`Welcome email sent to ${email}`);
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Don't throw - user was still created
      }
    } else {
      console.log("Resend not configured or no action link, skipping email");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId,
        message: "User created successfully" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
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
