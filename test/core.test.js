import test from 'node:test';
import assert from 'node:assert/strict';
import { tileFromLngLat, generateAnchors } from '../packages/core/src/index.js';

test('tileFromLngLat clamps latitude and wraps longitude', () => {
  const low = tileFromLngLat(-540, -90, 2);
  const high = tileFromLngLat(720, 90, 2);

  assert.equal(low.x, 2);
  assert.equal(low.y, 3);
  assert.equal(high.x, 0);
  assert.equal(high.y, 0);
});

test('generateAnchors creates top x and left y anchors', () => {
  const map = {
    getContainer: () => ({ clientWidth: 256, clientHeight: 256 }),
    getZoom: () => 2,
    unproject: ([x, y]) => ({
      lng: (x / 256) * 360 - 180,
      lat: 85.051129 - (y / 256) * 170.102258
    })
  };

  const anchors = generateAnchors({ map, zoom: 2, sampleStepPx: 32, sides: ['top', 'left'] });
  const top = anchors.filter((a) => a.side === 'top');
  const left = anchors.filter((a) => a.side === 'left');

  assert.ok(top.length > 1);
  assert.ok(left.length > 1);

  for (let i = 1; i < top.length; i += 1) {
    assert.notEqual(top[i - 1].value, top[i].value);
  }

  for (let i = 1; i < left.length; i += 1) {
    assert.notEqual(left[i - 1].value, left[i].value);
  }
});
