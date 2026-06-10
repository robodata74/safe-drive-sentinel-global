const socket = new WebSocket("ws://localhost:3001");

function sendLocation(driver_id: string) {
  navigator.geolocation.watchPosition(
    (pos) => {
      const payload = {
        driver_id,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        speed: pos.coords.speed,
        heading: pos.coords.heading,
        status: "available",
      };

      if (socket.readyState === 1) {
        socket.send(JSON.stringify(payload));
      }
    },
    (err) => console.error(err),
    {
      enableHighAccuracy: true,
      maximumAge: 1000,
    },
  );
}
