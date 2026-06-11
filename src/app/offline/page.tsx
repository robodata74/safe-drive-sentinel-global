export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#0B1220",
        color: "white",
        textAlign: "center",
        padding: 20,
      }}
    >
      <div>
        <h1>⚠️ You Are Offline</h1>

        <p>
          SafeDrive Global is temporarily unavailable. Please reconnect to
          continue dispatch services.
        </p>
      </div>
    </main>
  );
}
