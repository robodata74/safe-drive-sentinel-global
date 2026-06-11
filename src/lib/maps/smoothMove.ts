type Position = { lat: number; lng: number };

export function interpolatePosition(
  start: Position,
  end: Position,
  factor: number,
): Position {
  return {
    lat: start.lat + (end.lat - start.lat) * factor,
    lng: start.lng + (end.lng - start.lng) * factor,
  };
}
