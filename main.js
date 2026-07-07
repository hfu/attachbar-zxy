import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import { LayerControl } from 'maplibre-gl-layer-control';
import { AttachbarZxyControl } from '@attachbar-zxy/maplibre-adapter';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

// Initialize PMTiles protocol
const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile.bind(protocol), (err) => {
  if (err) {
    console.error('Failed to add PMTiles protocol:', err);
  }
});

// Create map
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://hfu.github.io/kitavolca/style.json',
  center: [139.753, 35.684],
  zoom: 10,
  hash: true
});

// Add tile boundary grid
map.on('load', () => {
  // Add tile grid source and layer
  map.addSource('tile-grid', {
    type: 'geojson',
    data: generateTileGrid(map.getBounds(), map.getZoom())
  });

  map.addLayer({
    id: 'tile-grid-layer',
    type: 'line',
    source: 'tile-grid',
    paint: {
      'line-color': '#888',
      'line-width': 1,
      'line-opacity': 0.5
    }
  });

  // Update grid on zoom/move
  map.on('zoom', updateGrid);
  map.on('move', updateGrid);
});

function updateGrid() {
  const source = map.getSource('tile-grid');
  if (source) {
    source.setData(generateTileGrid(map.getBounds(), map.getZoom()));
  }
}

function generateTileGrid(bounds, zoom) {
  const z = Math.floor(zoom);
  const features = [];
  const n = Math.pow(2, z);

  // Convert lng/lat to tile coordinates
  function lngLatToTile(lng, lat, z) {
    const n = Math.pow(2, z);
    const xtile = Math.floor((lng + 180) / 360 * n);
    const ytile = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
    return [xtile, ytile];
  }

  // Convert tile coordinates to lng/lat
  function tileToLngLat(x, y, z) {
    const n = Math.pow(2, z);
    const lng = x / n * 360 - 180;
    const lat = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
    return [lng, lat];
  }

  const [minX, minY] = lngLatToTile(bounds.getWest(), bounds.getNorth(), z);
  const [maxX, maxY] = lngLatToTile(bounds.getEast(), bounds.getSouth(), z);

  // Generate vertical lines (longitude)
  for (let x = minX; x <= maxX + 1; x++) {
    const lng = tileToLngLat(x, 0, z)[0];
    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [lng, bounds.getNorth()],
          [lng, bounds.getSouth()]
        ]
      }
    });
  }

  // Generate horizontal lines (latitude)
  for (let y = minY; y <= maxY + 1; y++) {
    const lat = tileToLngLat(0, y, z)[1];
    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [bounds.getWest(), lat],
          [bounds.getEast(), lat]
        ]
      }
    });
  }

  return {
    type: 'FeatureCollection',
    features
  };
}

// Add controls
map.addControl(new maplibregl.NavigationControl(), 'bottom-left');

// Add layer control
const layerControl = new LayerControl({
  showOpacitySlider: true,
  showLayerSymbol: true
});
map.addControl(layerControl, 'bottom-left');

// Add Z value display control
class ZoomDisplay {
  onAdd(map) {
    this.map = map;
    this.container = document.createElement('div');
    this.container.id = 'zoom-display';
    this.container.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(255, 255, 255, 0.9);
      padding: 8px 12px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 14px;
      font-weight: bold;
      color: #333;
      pointer-events: none;
      z-index: 10;
    `;
    this.updateZoom();
    map.on('zoom', () => this.updateZoom());
    return this.container;
  }

  updateZoom() {
    this.container.textContent = Math.floor(this.map.getZoom());
  }

  onRemove() {
    this.map.off('zoom', () => this.updateZoom());
  }
}

map.addControl(new ZoomDisplay(), 'top-left');

// Add AttachbarZxy control (sides removed - only for other features)
map.addControl(
  new AttachbarZxyControl({
    minPixelSpacing: 56
  }),
  'top-left'
);
