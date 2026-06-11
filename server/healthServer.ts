import http from "http";
import { dispatchStore } from "../src/lib/dispatch/dispatchStore";

const PORT = Number(process.env.HEALTH_PORT ?? 4100);

http
  .createServer((req, res) => {
    if (req.url === "/health") {
      const snapshot = dispatchStore.getSnapshot();

      res.writeHead(200, { "Content-Type": "application/json" });

      res.end(
        JSON.stringify({
          status: "ok",
          timestamp: Date.now(),
          drivers: snapshot.drivers.length,
          bookings: snapshot.bookings.length,
        }),
      );

      return;
    }

    res.writeHead(404);
    res.end("Not Found");
  })
  .listen(PORT, () => {
    console.log(`🩺 HEALTH SERVER RUNNING http://localhost:${PORT}/health`);
  });
