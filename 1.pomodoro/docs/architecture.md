# アーキテクチャ概要（現状）

## 実装状態

現時点のコードは MVP の初期段階であり、フロントエンド層と Flask の画面配信のみが実装されている。

## ディレクトリ構成（現状）

```text
1.pomodoro/
  app.py                  # Flask エントリーポイント
  pomodoro/
    __init__.py           # create_app() ファクトリ（画面配信のみ）
  templates/
    index.html            # タイマー画面（インラインスクリプト含む）
  static/
    css/
      style.css           # UI スタイル
    js/
      timer-state.js      # タイマー状態管理（純粋関数）
      timer-ui.js         # DOM 更新・イベントリスナー
```

## 層構成

設計上は 4 層構成（Web / Service / Repository / Frontend）を想定しているが、現在は以下の 2 層のみ実装されている。

### Web 層（実装済み）

`pomodoro/__init__.py` の `create_app()` に定義。

- `GET /` → `templates/index.html` をレンダリングして返す
- Flask アプリケーションファクトリパターンを採用

### Frontend 層（実装済み）

ブラウザ上でタイマーの状態管理と描画を担当する。

- **`timer-state.js`**: タイマー状態の計算ロジック（純粋関数）
- **`timer-ui.js`**: DOM 更新・イベントリスナー登録
- **`templates/index.html`**: 初期化スクリプトと `setInterval` によるタイマーループ

### Service 層・Repository 層（未実装）

`services/` および `repositories/` ディレクトリはまだ存在しない。  
設計の詳細は `architecture.md`（リポジトリルート）を参照。

## タイマー制御方針

タイマーの進行はすべてクライアント（ブラウザ）側で管理する。

- 残り時間は「終了予定時刻（`endTime`）との差分」で計算する（毎秒減算方式は採用しない）
- `setInterval` を 100ms 間隔で実行し、状態遷移と画面更新を行う
- サーバーへのタイマー状態の保存は現時点では行わない

## データフロー

```
ブラウザ起動
  ↓
DOMContentLoaded イベント
  ↓
timerSettings = defaultSettings（ハードコード値）
timerState = resetTimer(settings, Date.now())
  ↓
updateDisplay() → 画面初期表示
setEventListeners() → 開始/リセットボタン登録
setInterval(100ms) → タイマーループ開始
  ↓ [タイマー実行中]
transitionPhase() → 状態遷移チェック
updateDisplay() → 画面更新
```

## 設定値のデフォルト（`timer-state.js`）

| 設定項目 | デフォルト値 |
|---|---|
| 作業時間 | 25 分（1500 秒） |
| 短休憩時間 | 5 分（300 秒） |
| 長休憩時間 | 15 分（900 秒） |
| 長休憩間隔 | 4 回 |
