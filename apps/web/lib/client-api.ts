export async function clientApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload?.message instanceof Array
        ? payload.message.join(". ")
        : payload?.message ?? "No pudimos completar la solicitud.";
    throw new Error(message);
  }
  return payload as T;
}
