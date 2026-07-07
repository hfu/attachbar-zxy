import test from 'node:test';
import assert from 'node:assert/strict';
import { AttachbarZxyControl } from '../packages/maplibre-adapter/src/index.js';

class FakeElement {
  constructor(tagName = 'div') {
    this.tagName = tagName;
    this.style = {};
    this.children = [];
    this.className = '';
    this.parentNode = null;
    this.textContent = '';
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    this.children = this.children.filter((candidate) => candidate !== child);
    child.parentNode = null;
  }
}

function installFakeDom() {
  global.document = {
    createElement: () => new FakeElement()
  };
}

function createFakeMap() {
  const listeners = new Map();
  let projectionName = 'mercator';

  return {
    on(name, fn) {
      const list = listeners.get(name) ?? [];
      list.push(fn);
      listeners.set(name, list);
    },
    off(name, fn) {
      const list = listeners.get(name) ?? [];
      listeners.set(name, list.filter((candidate) => candidate !== fn));
    },
    once(name, fn) {
      this.on(name, fn);
    },
    emit(name) {
      for (const fn of listeners.get(name) ?? []) {
        fn();
      }
    },
    loaded: () => true,
    getProjection: () => ({ name: projectionName }),
    setProjection(name) {
      projectionName = name;
      this.emit('projectionchange');
    },
    getContainer: () => ({ clientWidth: 256, clientHeight: 256 }),
    getZoom: () => 3,
    unproject: ([x, y]) => ({ lng: (x / 256) * 360 - 180, lat: 85.051129 - (y / 256) * 170.102258 }),
    project: ([lng, lat]) => ({ x: ((lng + 180) / 360) * 256, y: ((85.051129 - lat) / 170.102258) * 256 })
  };
}

test('control hides on globe and re-shows on flat projection', async () => {
  installFakeDom();
  const map = createFakeMap();
  const control = new AttachbarZxyControl({ sides: ['top', 'left'] });

  const element = control.onAdd(map);
  assert.equal(element.style.display, 'block');

  map.setProjection('globe');
  assert.equal(element.style.display, 'none');

  map.setProjection('mercator');
  assert.equal(element.style.display, 'block');

  control.onRemove();
  assert.equal(control.map, null);
});
