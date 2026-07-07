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

## Demo (GitHub Pages)

GitHub Pages 用のデモは https://hfu.github.io/attachbar-zxy/ で確認できます。

### ローカル開発

```bash
# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド（デモサイト生成）
npm run build

# ビルド結果のプレビュー
npm run preview
```

### ビルドシステム

- **ソースファイル**: プロジェクトルートの `index.html`, `main.js`, `style.css`
- **ビルド出力**: `docs/index.html` (Vite + vite-plugin-singlefile で単一ファイルにバンドル)
- **設定**: `vite.config.js`

## Features

- **Z/X/Y タイルグリッド表示**: 地図上にタイルの境界線を表示
- **タイル座標表示**: 画面辺（上部・左側）に現在のタイルの X/Y 座標を表示
- **ズームレベル表示**: 左上に現在のズームレベルを固定表示
- **URL ハッシュ同期**: URL に map の状態（zoom, center, bearing）を自動同期

## Fixes & Improvements

### v0.2.0
- X タイル座標の原点を修正（lng = -180 から開始）
- ラベル位置をタイル区間の中央に移動
- デモサイトにタイルグリッド描画機能を追加
- ズームレベル表示機能を追加
- ビルド構造を最適化（docs は出力専用に）
