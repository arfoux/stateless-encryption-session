const te = new TextEncoder();
const td = new TextDecoder();

// base64url helpers
function b64urlEncode(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlDecode(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const bin = atob(s + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

// derive 32-byte key from secret
async function importAesKeyFromSecret(secret) {
  const raw = te.encode(secret);
  const digest = await crypto.subtle.digest("SHA-256", raw);
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, [
    "encrypt",
    "decrypt"
  ]);
}

// ⚠️ replace with env in production
const SESSION_KEY = "123";

export async function sealSession(payload) {
  const key = await importAesKeyFromSecret(SESSION_KEY);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const pt = te.encode(JSON.stringify(payload));

  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    pt
  );

  return `v1.${b64urlEncode(iv.buffer)}.${b64urlEncode(ct)}`;
}

export async function unsealSession(token) {
  try {
    const [v, ivB64, ctB64] = token.split(".");
    if (v !== "v1" || !ivB64 || !ctB64) return null;

    const key = await importAesKeyFromSecret(SESSION_KEY);
    const iv = new Uint8Array(b64urlDecode(ivB64));
    const ct = b64urlDecode(ctB64);

    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ct
    );

    const payload = JSON.parse(td.decode(pt));

    if (!payload?.exp || Date.now() > payload.exp) return null;
    if (payload.v !== 1) return null;

    return payload;
  } catch {
    return null;
  }
}