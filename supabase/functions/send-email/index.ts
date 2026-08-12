import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
serve(async (req) => {
  try {
    const { to, subject, html } = await req.json();
    const key = Deno.env.get("RESEND_API_KEY");
    const from = Deno.env.get("EMAIL_FROM") || "DivyangSathi <no-reply@example.com>";
    if (!key) return new Response(JSON.stringify({error:"RESEND_API_KEY not configured"}),{status:503});
    const r = await fetch("https://api.resend.com/emails", {method:"POST",headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({from,to,subject,html})});
    return new Response(await r.text(),{status:r.status,headers:{"Content-Type":"application/json"}});
  } catch(e) { return new Response(JSON.stringify({error:String(e)}),{status:400}); }
});
