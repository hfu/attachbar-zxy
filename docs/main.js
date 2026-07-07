import maplibregl from 'maplibre-gl';
import { PMTiles } from 'pmtiles';
import { LayerControl } from 'maplibre-gl-layer-control';
import { AttachbarZxyControl } from '@attachbar-zxy/maplibre-adapter';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

// Initialize PMTiles protocol
const protocol = new PMTiles.Protocol();
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
  zoom: 10
});

// Add controls
map.addControl(new maplibregl.NavigationControl(), 'bottom-left');

// Add layer control
const layerControl = new LayerControl({
  showOpacitySlider: true,
  showLayerSymbol: true
});
map.addControl(layerControl, 'bottom-left');

// Add AttachbarZxy control
map.addControl(
  new AttachbarZxyControl({
    sides: ['top', 'left'],
    minPixelSpacing: 56
  }),
  'top-left'
);
