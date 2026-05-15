import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Local fake "Israkart hosted page". Renders a tiny HTML form so the
 * end-to-end registration flow can be tested without merchant credentials.
 * Real flow is the same: user submits card → we redirect to /api/payment/callback
 * with a token.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const reg = url.searchParams.get("reg") || "";
  const amount = url.searchParams.get("amount") || "0";
  const returnUrl = url.searchParams.get("return") || "/";

  const html = `<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Mock Israkart Gateway</title>
    <style>
      body{margin:0;font-family:system-ui;background:#0a0d12;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
      .box{max-width:420px;width:100%;background:#10141b;border:1px solid #1ba4e0;border-radius:14px;padding:24px}
      h2{margin:0 0 4px;font-size:18px}
      .amount{color:#3fc9ff;font-weight:700;font-size:22px;margin-bottom:18px}
      label{display:block;font-size:13px;color:#9ca3af;margin:10px 0 4px}
      input{width:100%;padding:10px 12px;border-radius:8px;background:#0a0d12;border:1px solid #2a3242;color:#fff;font:inherit}
      .row{display:flex;gap:10px}
      .row>label{flex:1}
      button{margin-top:20px;width:100%;padding:12px;background:#1ba4e0;color:#05070a;font-weight:700;border:0;border-radius:8px;cursor:pointer}
      small{display:block;margin-top:14px;color:#6b7280;text-align:center}
    </style>
  </head>
  <body>
    <div class="box">
      <h2>סליקה — מצב פיתוח</h2>
      <div class="amount">${amount} ₪ • הרשמה ${reg.slice(0,8)}</div>
      <form id="f">
        <label>מספר כרטיס
          <input id="pan" inputmode="numeric" maxlength="19" value="4242 4242 4242 4242" />
        </label>
        <div class="row">
          <label>תוקף
            <input id="exp" value="12/29" />
          </label>
          <label>CVV
            <input id="cvv" inputmode="numeric" maxlength="4" value="123" />
          </label>
        </div>
        <button type="submit">אישור והעברה לאתר</button>
      </form>
      <small>אין סליקה אמיתית. רק יוצר טוקן דמה לבדיקה.</small>
    </div>
    <script>
      document.getElementById('f').addEventListener('submit', e => {
        e.preventDefault();
        const pan = document.getElementById('pan').value.replace(/\\s/g,'');
        const last4 = pan.slice(-4);
        const token = 'mock_tok_' + last4 + '_' + Date.now();
        const exp = document.getElementById('exp').value;
        const u = ${JSON.stringify(returnUrl)} + '?token=' + token + '&last4=' + last4 + '&expiry=' + encodeURIComponent(exp) + '&reg=' + ${JSON.stringify(reg)};
        window.location.href = u;
      });
    </script>
  </body>
</html>`;
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
