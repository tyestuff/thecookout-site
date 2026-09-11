// The Cookout member gate — Cloudflare Worker in front of thecookout.us.
// Gates /calendar, /calender, /members behind an approved-member login
// (email + personal access code, checked against the COOKOUT_MEMBERS KV list).
// Everything else passes straight through to GitHub Pages.
// Sessions: signed cookie, 90 days; membership re-checked on every request,
// so removing someone from KV locks them out immediately.
// Deployed from thecookout-site repo (gate-worker.js) via Cloudflare API.

const GATED = /^\/(calendar|calender|members)(\/|$)/;
const COOKIE = "ck_member";

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/[/+=]/g, c => ({"/":"_","+":"-","=":""}[c]));
}

function getCookie(req, name) {
  const m = (req.headers.get("Cookie") || "").match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return m ? m[1] : null;
}

function loginPage(next, msg) {
  const err = msg ? `<p class="err">${msg}</p>` : "";
  return new Response(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>The Cookout - Members Only</title>
<style>
:root{--gold:#E9A93C;--gold-deep:#D9912A;--gold-soft:#F3D08A;--brown:#3A2114;--brown-deep:#2A170C;--cream:#FBF3E2}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
background:repeating-linear-gradient(90deg,rgba(0,0,0,.22) 0 2px,transparent 2px 110px),
linear-gradient(180deg,#33200f 0%,var(--brown-deep) 70%);min-height:100vh;display:flex;
align-items:center;justify-content:center;padding:16px;color:var(--brown)}
.card{background:#fff;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.35);padding:32px;max-width:400px;width:100%;text-align:center}
img{width:80px;height:80px;border-radius:16px}
h1{font-size:1.4rem;color:var(--brown-deep);margin:14px 0 4px;text-transform:uppercase;letter-spacing:.04em}
h1 span{color:var(--gold-deep)}
p{font-size:.95rem;margin-bottom:6px}
.err{color:#a33;font-weight:700;margin:10px 0}
label{display:block;text-align:left;font-weight:700;font-size:.85rem;color:var(--brown-deep);margin:14px 0 5px}
input{width:100%;border:2px solid var(--gold-soft);border-radius:10px;padding:11px 12px;font:inherit}
input:focus{outline:none;border-color:var(--gold-deep)}
button{width:100%;background:var(--gold);color:var(--brown-deep);font-weight:800;border:none;
border-radius:999px;padding:13px;font-size:1rem;cursor:pointer;margin-top:18px}
button:hover{background:var(--gold-deep)}
.note{font-size:.8rem;color:#7a6248;margin-top:16px}
</style></head><body><div class="card">
<img src="/cookout-logo.jpeg" alt="The Cookout logo">
<h1>Members <span>Only</span></h1>
<p>This part of The Cookout is for approved members. Sign in with your member access code.</p>
${err}
<form method="POST" action="/gate/login">
<input type="hidden" name="next" value="${next.replace(/"/g, "")}">
<label>Email</label><input type="email" name="email" required autocomplete="email">
<label>Access code</label><input type="text" name="code" required autocomplete="off" style="text-transform:uppercase">
<button type="submit">Come On In</button>
</form>
<p class="note">No code? Apply at thecookout.us/new-member or ask leadership: thecrew@thecookout.us</p>
</div></body></html>`, { status: 401, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/gate/login") {
      const form = await req.formData();
      const email = String(form.get("email") || "").trim().toLowerCase();
      const code = String(form.get("code") || "").trim().toUpperCase();
      const next = String(form.get("next") || "/calendar/");
      const rec = await env.MEMBERS.get(email, { type: "json" });
      if (rec && rec.code && rec.code.toUpperCase() === code) {
        const exp = Date.now() + 90 * 86400000;
        const sig = await hmac(env.SESSION_SECRET, email + "|" + exp);
        const cookie = `${COOKIE}=${encodeURIComponent(email)}|${exp}|${sig}; Path=/; Max-Age=7776000; HttpOnly; Secure; SameSite=Lax`;
        return new Response(null, { status: 302, headers: { "Location": next.startsWith("/") ? next : "/calendar/", "Set-Cookie": cookie } });
      }
      return loginPage(next, "That email and code didn't match. Check with leadership.");
    }

    if (!GATED.test(url.pathname)) return fetch(req);

    const c = getCookie(req, COOKIE);
    if (c) {
      const parts = decodeURIComponent(c).split("|");
      if (parts.length === 3) {
        const [email, exp, sig] = parts;
        const expect = await hmac(env.SESSION_SECRET, email + "|" + exp);
        if (Date.now() < Number(exp) && sig === expect) {
          const rec = await env.MEMBERS.get(email.toLowerCase(), { type: "json" });
          if (rec) return fetch(req); // still on the member list
        }
      }
    }
    return loginPage(url.pathname + url.search);
  }
};
