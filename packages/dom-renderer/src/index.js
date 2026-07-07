function sideClass(side) {
  return `attachbar-sidebar--${side}`;
}

export function createSidebars(container, sides = ["top", "left"], sidebarSize = {}) {
  const elements = {};

  for (const side of sides) {
    const el = document.createElement("div");
    el.className = `attachbar-sidebar ${sideClass(side)}`;
    el.style.position = "absolute";
    el.style.pointerEvents = "none";

    if (side === "top") {
      el.style.left = "0";
      el.style.right = "0";
      el.style.top = "0";
      el.style.height = `${sidebarSize.top ?? 32}px`;
    }

    if (side === "left") {
      el.style.left = "0";
      el.style.top = "0";
      el.style.bottom = "0";
      el.style.width = `${sidebarSize.left ?? 48}px`;
    }

    container.appendChild(el);
    elements[side] = el;
  }

  return elements;
}

export function destroySidebars(container, sidebarElements) {
  for (const side of Object.keys(sidebarElements ?? {})) {
    const el = sidebarElements[side];
    if (el && el.parentNode === container) {
      container.removeChild(el);
    }
  }
}

function clearChildren(element) {
  element.textContent = "";
}

export function filterAnchors(anchors, { minPixelSpacing = 40 } = {}) {
  const bySide = new Map();

  for (const anchor of anchors) {
    const sideAnchors = bySide.get(anchor.side) ?? [];
    sideAnchors.push(anchor);
    bySide.set(anchor.side, sideAnchors);
  }

  const output = [];

  for (const [side, sideAnchors] of bySide.entries()) {
    const axis = side === "top" ? 0 : 1;
    sideAnchors.sort((a, b) => a.pixel[axis] - b.pixel[axis]);

    let lastAccepted = -Infinity;
    for (const anchor of sideAnchors) {
      const coord = anchor.pixel[axis];
      if (coord - lastAccepted >= minPixelSpacing) {
        output.push(anchor);
        lastAccepted = coord;
      }
    }
  }

  return output;
}

export function renderLabels(sidebarElements, anchors, { zoom, formatter, visibility } = {}) {
  for (const side of Object.keys(sidebarElements ?? {})) {
    clearChildren(sidebarElements[side]);
  }

  for (const anchor of anchors) {
    const sideEl = sidebarElements?.[anchor.side];
    if (!sideEl) continue;

    if (visibility && !visibility({ zoom, side: anchor.side })) {
      continue;
    }

    const label = document.createElement("div");
    label.className = "attachbar-label";
    label.style.position = "absolute";

    if (anchor.side === "top") {
      label.style.left = `${anchor.pixel[0]}px`;
      label.style.top = "0";
    } else {
      label.style.top = `${anchor.pixel[1]}px`;
      label.style.left = "0";
    }

    const axisValue = anchor.side === "top" ? "x" : "y";
    label.textContent = formatter
      ? formatter(anchor.value, { side: anchor.side, zoom, value: axisValue })
      : String(anchor.value);
    sideEl.appendChild(label);
  }
}
