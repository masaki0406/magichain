import { auth } from "./firebaseClient";

async function getToken() {
  const user = auth.currentUser;
  if (!user) return "";
  return user.getIdToken();
}

export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
  const token = await getToken();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
}
