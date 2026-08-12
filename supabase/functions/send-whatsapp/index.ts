import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
serve(async (req) => {
  try {
    const payload = await req.json();
    const token=Deno.env.get("WHATSAPP_TOKEN"), phoneId=Deno.env.get("WHATSAPP_PHONE_NUMBER_ID"), admin=Deno.env.get("ADMIN_WHATSAPP_NUMBER");
    if(!token||!phoneId||!admin) return new Response(JSON.stringify({error:"WhatsApp secrets not configured"}),{status:503});
    const text=`DivyangSathi Payment Alert\nName: ${payload.name||'-'}\nMobile: ${payload.mobile||'-'}\nAmount: ₹${payload.amount||'-'}\nPlan: ${payload.plan||'-'}\nUTR: ${payload.utr||'-'}\nTime: ${payload.time||new Date().toISOString()}`;
    const r=await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to:admin,type:'text',text:{body:text}})});
    return new Response(await r.text(),{status:r.status,headers:{'Content-Type':'application/json'}});
  } catch(e){return new Response(JSON.stringify({error:String(e)}),{status:400});}
});
