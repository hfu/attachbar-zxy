import { generateAnchors } from "@attachbar-zxy/core";
import { createSidebars, destroySidebars, filterAnchors, renderLabels } from "@attachbar-zxy/dom-renderer";

const DEFAULT_OPTIONS = {
  sides: ["top", "left"],
  minPixelSpacing: 40,
  sidebarSize: { top: 32, left: 48 }
};

const DEFAULT_THROTTLE_MS = 33;

function throttle(fn, waitMs) {
  let timeoutId = null;

  return {
    run() {
      if (timeoutId !== null) return;
      timeoutId = setTimeout(() => {
        timeoutId = null;
        fn();
      }, waitMs);
    },
    cancel() {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }
  };
}

export class AttachbarZxyControl {
  constructor(options = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
      sidebarSize: {
        ...DEFAULT_OPTIONS.sidebarSize,
        ...(options.sidebarSize ?? {})
      }
    };

    this.map = null;
    this.container = null;
    this.sidebarElements = null;
    this.throttled = null;

    this._onMove = null;
    this._onZoom = null;
    this._onResize = null;
    this._onMapChange = null;
    this._onProjectionChange = this.onProjectionChange.bind(this);
  }

  onAdd(map) {
    this.map = map;
    this.container = document.createElement("div");
    this.container.className = "maplibregl-ctrl attachbar-zxy-wrapper";
    this.container.style.position = "relative";
    this.container.style.pointerEvents = "none";

    this.ensureSidebars();

    const throttled = throttle(() => this.update(), DEFAULT_THROTTLE_MS);
    this.throttled = throttled;
    this._onMapChange = throttled.run;
    this._onMove = this._onMapChange;
    this._onZoom = this._onMapChange;
    this._onResize = this._onMapChange;

    map.on("move", this._onMove);
    map.on("zoom", this._onZoom);
    map.on("resize", this._onResize);
    map.on("projectionchange", this._onProjectionChange);

    if (this.shouldRender()) {
      this.show();
      if (map.loaded?.()) {
        this.update();
      } else {
        map.once?.("load", () => this.update());
      }
    } else {
      this.hide();
    }

    return this.container;
  }

  onRemove() {
    if (!this.map) return;

    if (this._onMove) this.map.off("move", this._onMove);
    if (this._onZoom) this.map.off("zoom", this._onZoom);
    if (this._onResize) this.map.off("resize", this._onResize);
    this.map.off("projectionchange", this._onProjectionChange);

    if (this.throttled) {
      this.throttled.cancel();
      this.throttled = null;
    }

    if (this.sidebarElements && this.container) {
      destroySidebars(this.container, this.sidebarElements);
      this.sidebarElements = null;
    }

    this.container = null;
    this.map = null;
  }

  getDefaultPosition() {
    return "top-right";
  }

  ensureSidebars() {
    if (!this.container || this.sidebarElements) return;
    this.sidebarElements = createSidebars(this.container, this.options.sides, this.options.sidebarSize);
  }

  shouldRender() {
    if (!this.map) return false;
    const projection = this.map.getProjection?.();
    return !projection || projection.name !== "globe";
  }

  onProjectionChange() {
    if (!this.shouldRender()) {
      this.hide();
      return;
    }

    this.show();
    this.update();
  }

  update() {
    if (!this.map || !this.sidebarElements) return;
    if (!this.shouldRender()) {
      this.hide();
      return;
    }

    this.show();
    const zoom = Math.max(0, Math.floor(this.map.getZoom?.() ?? 0));

    const anchors = generateAnchors({
      map: this.map,
      zoom,
      sides: this.options.sides
    });

    const pixelAnchors = anchors.map((anchor) => {
      const point = this.map.project(anchor.lngLat);
      return {
        ...anchor,
        pixel: [point.x, point.y]
      };
    });

    const filtered = filterAnchors(pixelAnchors, {
      minPixelSpacing: this.options.minPixelSpacing
    });

    renderLabels(this.sidebarElements, filtered, {
      zoom,
      formatter: this.options.formatter,
      visibility: this.options.visibility
    });
  }

  show() {
    if (this.container) {
      this.container.style.display = "block";
    }
  }

  hide() {
    if (this.container) {
      this.container.style.display = "none";
    }
  }
}
