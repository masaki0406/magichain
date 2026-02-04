import { getAdminAuth } from "./firebaseAdmin";

export async function requireAuth(request: Request): Promise<string> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    throw new Error("Missing auth token");
  }
  const auth = getAdminAuth();
  const decoded = await auth.verifyIdToken(token);
  return decoded.uid;
}
