export default async function CallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main style={{ padding: 40 }}>
      <h1>Facebook Callback</h1>

      {params.code && (
        <>
          <p>Code received:</p>
          <textarea
            value={params.code}
            readOnly
            style={{ width: "100%", height: 200 }}
          />
        </>
      )}

      {params.error && <p>Error: {params.error}</p>}
    </main>
  );
}
