import crypto from "node:crypto";
import { cookies } from "next/headers";
import { Role } from "../generated/prisma/enums";

export const SESSION_COOKIE = "falconfit_session";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type Session = { id: string; role: Role };

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return secret;
}

function base64url(input: Buffer) {
  return input.toString("base64url");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => (err ? reject(err) : resolve(key)));
  });
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;

  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => (err ? reject(err) : resolve(key)));
  });

  const stored_ = Buffer.from(hashHex, "hex");
  if (stored_.length !== derived.length) return false;
  return crypto.timingSafeEqual(stored_, derived);
}

export function signSession(payload: { sub: string; role: Role }): string {
  const exp = Date.now() + SESSION_MAX_AGE_MS;
  const body = base64url(Buffer.from(JSON.stringify({ ...payload, exp })));
  const sig = base64url(crypto.createHmac("sha256", getSecret()).update(body).digest());
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string): Session | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expectedSig = base64url(crypto.createHmac("sha256", getSecret()).update(body).digest());
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (typeof payload.sub !== "string" || typeof payload.role !== "string") return null;
    return { id: payload.sub, role: payload.role as Role };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_MS / 1000,
  };
}

// Server Component / Route Handler helper — reads and verifies the session cookie.
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
