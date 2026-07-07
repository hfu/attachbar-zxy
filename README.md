# attachbar-zxy

Spatial ID²対応 Attach Bar (MapLibre Control)。

## Packages

- `@attachbar-zxy/core`: z/x/y タイル計算とエッジ走査アンカー生成
- `@attachbar-zxy/dom-renderer`: サイドバーDOM生成とラベル描画
- `@attachbar-zxy/maplibre-adapter`: MapLibre `IControl` 実装

## Usage

```js
import { AttachbarZxyControl } from '@attachbar-zxy/maplibre-adapter';

const control = new AttachbarZxyControl({
  sides: ['top', 'left'],
  minPixelSpacing: 60,
  sidebarSize: { top: 32, left: 48 },
  formatter: (value) => String(value),
  visibility: ({ zoom }) => zoom >= 2
});

map.addControl(control, 'top-left');
```

projection が `globe` のときは自動で非表示になり、`mercator` などの flat projection に戻ると再表示します。
