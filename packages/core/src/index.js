const MAX_MERCATOR_LAT = 85.051129;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function tileFromLngLat(lng, lat, z) {
  const zoom = Math.max(0, Math.floor(Number.isFinite(z) ? z : 0));
  const n = 2 ** zoom;

  const normalizedLng = ((lng % 360) + 360) % 360;
  const clampedLat = clamp(lat, -MAX_MERCATOR_LAT, MAX_MERCATOR_LAT);

  const x = Math.floor((normalizedLng / 360) * n);
  const latRad = (clampedLat * Math.PI) / 180;
  const yRaw =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  const y = Math.floor(yRaw);

  return {
    x: clamp(x, 0, n - 1),
    y: clamp(y, 0, n - 1)
  };
}

function sampleAlongLength(length, step) {
  const points = [];
  for (let v = 0; v <= length; v += step) {
    points.push(v);
  }
  if (points[points.length - 1] !== length) {
    points.push(length);
  }
  return points;
}

function inferPriority(pixelPosition) {
  return 1 / (1 + pixelPosition);
}

export function generateAnchors({ map, zoom, sides = ["top", "left"], sampleStepPx = 8 }) {
  if (!map || !map.getContainer || !map.unproject) return [];

  const z = Math.max(0, Math.floor(Number.isFinite(zoom) ? zoom : map.getZoom?.() ?? 0));
  const container = map.getContainer();
  const width = Math.max(0, Math.floor(container?.clientWidth ?? 0));
  const height = Math.max(0, Math.floor(container?.clientHeight ?? 0));
  const step = Math.max(1, Math.floor(sampleStepPx));

  const anchors = [];

  if (sides.includes("top") && width > 0) {
    let previousX;
    for (const px of sampleAlongLength(width, step)) {
      const lngLat = map.unproject([px, 0]);
      const tile = tileFromLngLat(lngLat.lng, lngLat.lat, z);
      if (previousX === undefined || previousX !== tile.x) {
        anchors.push({
          side: "top",
          lngLat: [lngLat.lng, lngLat.lat],
          value: tile.x,
          axis: "x",
          priority: inferPriority(px)
        });
        previousX = tile.x;
      }
    }
  }

  if (sides.includes("left") && height > 0) {
    let previousY;
    for (const py of sampleAlongLength(height, step)) {
      const lngLat = map.unproject([0, py]);
      const tile = tileFromLngLat(lngLat.lng, lngLat.lat, z);
      if (previousY === undefined || previousY !== tile.y) {
        anchors.push({
          side: "left",
          lngLat: [lngLat.lng, lngLat.lat],
          value: tile.y,
          axis: "y",
          priority: inferPriority(py)
        });
        previousY = tile.y;
      }
    }
  }

  return anchors;
}
