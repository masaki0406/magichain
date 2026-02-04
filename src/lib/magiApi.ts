import { auth, ensureAnonymousAuth } from "./firebaseClient";

export async function getAuthToken(): Promise<string> {
  await ensureAnonymousAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error("ログインに失敗しました");
  }
  return user.getIdToken();
}

export async function apiPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const token = await getAuthToken();
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "通信に失敗しました");
  }
  return response.json() as Promise<T>;
}
