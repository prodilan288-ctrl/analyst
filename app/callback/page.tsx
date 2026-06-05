import { redirect } from "next/navigation";

export default async function CallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string; error_description?: string }>;
}) {
  const params = await searchParams;

  if (params.error) {
    return (
      <main style={{ padding: 40, fontFamily: "monospace" }}>
        <h1>OAuth Error</h1>
        <p><strong>{params.error}</strong></p>
        {params.error_description && <p>{params.error_description}</p>}
      </main>
    );
  }

  if (params.code) {
    redirect(`/api/auth/exchange?code=${params.code}`);
  }

  return (
    <main style={{ padding: 40, fontFamily: "monospace" }}>
      <p>No code or error received.</p>
    </main>
  );
}
