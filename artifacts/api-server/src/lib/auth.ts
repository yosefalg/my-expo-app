import crypto from "crypto";

const SECRET = process.env.SESSION_SECRET ?? "omnivision-secret-key";

export function hashPassword(password: string): string {
  return crypto.createHmac("sha256", SECRET).update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const expectedSig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
    if (sig !== expectedSig) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (data.exp < Date.now()) return null;
    return { userId: data.userId };
  } catch {
    return null;
  }
}

export function generateId(): string {
  return crypto.randomBytes(16).toString("hex");
}
