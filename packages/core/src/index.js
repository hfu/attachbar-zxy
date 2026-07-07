const MAX_MERCATOR_LAT = 85.051129;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function tileFromLngLat(lng, lat, z) {
  const zoom = Math.max(0, Math.floor(Number.isFinite(z) ? z : 0));
  const n = 2 ** zoom;

  const clampedLng = clamp(lng, -180, 180);
  const clampedLat = clamp(lat, -MAX_MERCATOR_LAT, MAX_MERCATOR_LAT);

  const x = Math.floor(((clampedLng + 180) / 360) * n);
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
    let previousPx;
    for (const px of sampleAlongLength(width, step)) {
      const lngLat = map.unproject([px, 0]);
      const tile = tileFromLngLat(lngLat.lng, lngLat.lat, z);
      if (previousX === undefined || previousX !== tile.x) {
        if (previousX !== undefined) {
          // Calculate midpoint between previous tile start and current tile start
          const midpointPx = (previousPx + px) / 2;
          const midpointLngLat = map.unproject([midpointPx, 0]);
          anchors.push({
            side: "top",
            lngLat: [midpointLngLat.lng, midpointLngLat.lat],
            value: previousX,
            axis: "x",
            priority: inferPriority(midpointPx),
            _pixelPos: midpointPx
          });
        }
        previousX = tile.x;
        previousPx = px;
      }
    }
    // Handle last tile
    if (previousX !== undefined) {
      const midpointPx = (previousPx + width) / 2;
      const midpointLngLat = map.unproject([midpointPx, 0]);
      anchors.push({
        side: "top",
        lngLat: [midpointLngLat.lng, midpointLngLat.lat],
        value: previousX,
        axis: "x",
        priority: inferPriority(midpointPx),
        _pixelPos: midpointPx
      });
    }
  }

  if (sides.includes("left") && height > 0) {
    let previousY;
    let previousPy;
    for (const py of sampleAlongLength(height, step)) {
      const lngLat = map.unproject([0, py]);
      const tile = tileFromLngLat(lngLat.lng, lngLat.lat, z);
      if (previousY === undefined || previousY !== tile.y) {
        if (previousY !== undefined) {
          // Calculate midpoint between previous tile start and current tile start
          const midpointPy = (previousPy + py) / 2;
          const midpointLngLat = map.unproject([0, midpointPy]);
          anchors.push({
            side: "left",
            lngLat: [midpointLngLat.lng, midpointLngLat.lat],
            value: previousY,
            axis: "y",
            priority: inferPriority(midpointPy),
            _pixelPos: midpointPy
          });
        }
        previousY = tile.y;
        previousPy = py;
      }
    }
    // Handle last tile
    if (previousY !== undefined) {
      const midpointPy = (previousPy + height) / 2;
      const midpointLngLat = map.unproject([0, midpointPy]);
      anchors.push({
        side: "left",
        lngLat: [midpointLngLat.lng, midpointLngLat.lat],
        value: previousY,
        axis: "y",
        priority: inferPriority(midpointPy),
        _pixelPos: midpointPy
      });
    }
  }

  return anchors;
}
