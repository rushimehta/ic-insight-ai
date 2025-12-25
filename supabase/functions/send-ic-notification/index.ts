import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "ic_scheduled" | "ic_reminder" | "ic_complete" | "deal_update";
  deal_name: string;
  meeting_date?: string;
  recipients: string[];
  additional_info?: string;
  outcome?: string;
}

const getEmailContent = (notification: NotificationRequest) => {
  const { type, deal_name, meeting_date, additional_info, outcome } = notification;

  switch (type) {
    case "ic_scheduled":
      return {
        subject: `IC Meeting Scheduled: ${deal_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: #00d9ff; margin: 0; font-size: 24px;">Investment Committee Meeting Scheduled</h1>
            </div>
            <div style="padding: 24px; background: #f8f9fa; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #333;">An Investment Committee meeting has been scheduled for:</p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #00d9ff;">
                <h2 style="margin: 0 0 8px 0; color: #1a1a2e;">${deal_name}</h2>
                <p style="margin: 0; color: #666;"><strong>Date:</strong> ${meeting_date ? new Date(meeting_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD'}</p>
                ${additional_info ? `<p style="margin: 8px 0 0 0; color: #666;">${additional_info}</p>` : ''}
              </div>
              <p style="font-size: 14px; color: #666;">Please prepare your questions and review the IC materials in advance.</p>
              <p style="font-size: 14px; color: #666; margin-top: 24px;">— IC Prep AI</p>
            </div>
          </div>
        `,
      };

    case "ic_reminder":
      return {
        subject: `Reminder: IC Meeting Tomorrow - ${deal_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">⏰ IC Meeting Reminder</h1>
            </div>
            <div style="padding: 24px; background: #f8f9fa; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #333;">This is a reminder that the IC meeting for <strong>${deal_name}</strong> is scheduled for tomorrow.</p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #f59e0b;">
                <h2 style="margin: 0 0 8px 0; color: #1a1a2e;">${deal_name}</h2>
                <p style="margin: 0; color: #666;"><strong>Date:</strong> ${meeting_date ? new Date(meeting_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Tomorrow'}</p>
              </div>
              <p style="font-size: 14px; color: #666;">Please ensure you have reviewed all materials and prepared your questions.</p>
              <p style="font-size: 14px; color: #666; margin-top: 24px;">— IC Prep AI</p>
            </div>
          </div>
        `,
      };

    case "ic_complete":
      const outcomeColor = outcome === "approved" ? "#10b981" : outcome === "passed" ? "#ef4444" : "#f59e0b";
      return {
        subject: `IC Decision: ${deal_name} - ${outcome?.toUpperCase() || 'Complete'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, ${outcomeColor} 0%, ${outcomeColor}dd 100%); padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">IC Decision Announced</h1>
            </div>
            <div style="padding: 24px; background: #f8f9fa; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #333;">The Investment Committee has reached a decision on <strong>${deal_name}</strong>.</p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${outcomeColor};">
                <h2 style="margin: 0 0 8px 0; color: #1a1a2e;">${deal_name}</h2>
                <p style="margin: 0; font-size: 18px;"><strong>Decision:</strong> <span style="color: ${outcomeColor}; text-transform: uppercase; font-weight: bold;">${outcome || 'Pending'}</span></p>
                ${additional_info ? `<p style="margin: 12px 0 0 0; color: #666;">${additional_info}</p>` : ''}
              </div>
              <p style="font-size: 14px; color: #666;">Full meeting notes are available in IC Prep AI.</p>
              <p style="font-size: 14px; color: #666; margin-top: 24px;">— IC Prep AI</p>
            </div>
          </div>
        `,
      };

    case "deal_update":
      return {
        subject: `Deal Update: ${deal_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 24px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Deal Pipeline Update</h1>
            </div>
            <div style="padding: 24px; background: #f8f9fa; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #333;">There's an update on <strong>${deal_name}</strong>.</p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #8b5cf6;">
                <h2 style="margin: 0 0 8px 0; color: #1a1a2e;">${deal_name}</h2>
                ${additional_info ? `<p style="margin: 8px 0 0 0; color: #666;">${additional_info}</p>` : ''}
              </div>
              <p style="font-size: 14px; color: #666; margin-top: 24px;">— IC Prep AI</p>
            </div>
          </div>
        `,
      };

    default:
      return {
        subject: `IC Prep AI Notification: ${deal_name}`,
        html: `<p>Update regarding ${deal_name}: ${additional_info || 'Please check the platform for details.'}</p>`,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-ic-notification function invoked");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notification: NotificationRequest = await req.json();
    console.log("Notification request:", notification);

    if (!notification.recipients || notification.recipients.length === 0) {
      console.log("No recipients provided");
      return new Response(
        JSON.stringify({ error: "No recipients provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailContent = getEmailContent(notification);
    console.log("Sending email with subject:", emailContent.subject);

    const results = [];
    for (const recipient of notification.recipients) {
      try {
        const response = await resend.emails.send({
          from: "IC Prep AI <onboarding@resend.dev>",
          to: [recipient],
          subject: emailContent.subject,
          html: emailContent.html,
        });
        console.log(`Email sent to ${recipient}:`, response);
        results.push({ recipient, success: true, id: response.data?.id });
      } catch (emailError: any) {
        console.error(`Failed to send to ${recipient}:`, emailError);
        results.push({ recipient, success: false, error: emailError.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-ic-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
