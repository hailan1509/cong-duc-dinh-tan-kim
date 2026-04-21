const ADMIN_COOKIE = "cdtk_admin";

function base64UrlEncode(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  // btoa expects latin1
  const b64 = btoa(str);
  return b64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlEncodeText(text: string) {
  const bytes = new TextEncoder().encode(text);
  return base64UrlEncode(bytes.buffer);
}

function base64UrlDecodeToText(b64url: string) {
  const padLen = (4 - (b64url.length % 4)) % 4;
  const padded = (b64url + "=".repeat(padLen)).replaceAll("-", "+").replaceAll("_", "/");
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function hmacSha256Base64Url(message: string, secret: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return base64UrlEncode(sig);
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export function getAdminCookieName() {
  return ADMIN_COOKIE;
}

function getAdminSecret() {
  return process.env.ADMIN_SESSION_SECRET || "";
}

export async function createAdminToken(params: {
  userId: number;
  role: "admin" | "staff";
  ttlSeconds?: number;
}) {
  const secret = getAdminSecret();
  if (!secret) throw new Error("Missing ADMIN_SESSION_SECRET");

  const ttlSeconds = params?.ttlSeconds ?? 60 * 60 * 24 * 7; // 7 days
  const exp = Date.now() + ttlSeconds * 1000;
  const payload = base64UrlEncodeText(
    JSON.stringify({ exp, userId: params.userId, role: params.role })
  );
  const sig = await hmacSha256Base64Url(payload, secret);
  return `${payload}.${sig}`;
}

export async function verifyAdminToken(token: string | undefined | null) {
  if (!token) return { ok: false as const };
  const secret = getAdminSecret();
  if (!secret) return { ok: false as const };

  const [payload, sig] = token.split(".");
  if (!payload || !sig) return { ok: false as const };

  const expected = await hmacSha256Base64Url(payload, secret);
  if (!safeEqual(sig, expected)) return { ok: false as const };

  try {
    const raw = base64UrlDecodeToText(payload);
    const data = JSON.parse(raw) as { exp?: number; userId?: number; role?: "admin" | "staff" };
    if (!data.exp || typeof data.exp !== "number") return { ok: false as const };
    if (!data.userId || typeof data.userId !== "number") return { ok: false as const };
    if (!data.role || (data.role !== "admin" && data.role !== "staff")) return { ok: false as const };
    if (Date.now() > data.exp) return { ok: false as const };
    return { ok: true as const, userId: data.userId, role: data.role };
  } catch {
    return { ok: false as const };
  }
}

