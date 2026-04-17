# フロントエンドモジュール仕様

## ファイル構成

| ファイル | 役割 |
|---|---|
| `static/js/timer-state.js` | タイマー状態管理の純粋関数群 |
| `static/js/timer-ui.js` | DOM 更新・イベントリスナー |
| `static/css/style.css` | UI スタイル |
| `templates/index.html` | 画面テンプレート・初期化スクリプト |

---

## timer-state.js

タイマーの状態計算ロジックを純粋関数として実装する。DOM に依存しない。

IIFE（即時実行関数）でラップされており、ブラウザ（`window`）と Node.js（`module.exports`）の両方にエクスポートする。

### 定数

#### `PHASE`

```javascript
PHASE.WORK        // "work"      作業フェーズ
PHASE.SHORT_BREAK // "short_break" 短休憩フェーズ
PHASE.LONG_BREAK  // "long_break"  長休憩フェーズ
```

#### `defaultSettings`

```javascript
{
  workDuration: 1500,       // 25分
  shortBreakDuration: 300,  // 5分
  longBreakDuration: 900,   // 15分
  longBreakInterval: 4      // 4回ごとに長休憩
}
```

### 関数

#### `getPhaseDuration(phase, settings) → number`

指定フェーズの設定時間（秒）を返す。

#### `calculateRemainingSeconds(state, currentTime) → number`

現在の残り時間（秒）を返す。

- `isRunning === true` の場合: `endTime - currentTime` の差分から計算
- `isRunning === false` の場合: `state.remainingSeconds` を返す（未設定の場合はフェーズのデフォルト値）
- `state` が無効な場合: `0` を返す

引数 `currentTime` はミリ秒（Unix タイム）。

#### `calculateProgressPercent(phase, remaining, duration) → number`

経過率（0〜100）を返す。

```
spent = duration - remaining
percent = (spent / duration) * 100
```

#### `getNextPhase(currentPhase, completedSessions, longBreakInterval) → string`

次のフェーズを返す。

- `WORK` → `completedSessions % longBreakInterval === 0` の場合 `LONG_BREAK`、それ以外は `SHORT_BREAK`
- `SHORT_BREAK` / `LONG_BREAK` → `WORK`

#### `transitionPhase(state, currentTime, settings) → state`

現在の状態を評価し、フェーズ遷移後の新しい状態オブジェクトを返す。

- `state` が `null` の場合: `startTimer(settings, currentTime)` を呼び出す
- `isRunning === false` の場合: 状態をそのまま返す
- 残り時間 > 0 の場合: `remainingSeconds` を更新した状態を返す
- 残り時間 === 0 の場合: 次フェーズに遷移した新しい状態を返す

#### `startTimer(settings, currentTime) → state`

作業フェーズの新しいタイマー状態を返す。

```javascript
{
  phase: "work",
  isRunning: true,
  startedAt: currentTime,
  endTime: currentTime + workDuration * 1000,
  completedSessions: 0,
  remainingSeconds: workDuration
}
```

#### `pauseTimer(state, currentTime) → state`

タイマーを一時停止した状態を返す。

- `isRunning === false` の場合: そのまま返す
- それ以外: `isRunning: false`、`startedAt: null`、`endTime: null`、`remainingSeconds: 現在の残り秒数`

#### `resumeTimer(state, currentTime) → state`

一時停止中のタイマーを再開した状態を返す。

- `isRunning === true` の場合: そのまま返す
- それ以外: `isRunning: true`、新しい `startedAt` / `endTime` を設定

#### `resetTimer(settings, currentTime) → state`

タイマーを作業フェーズの初期状態にリセットした状態を返す。

```javascript
{
  phase: "work",
  isRunning: false,
  startedAt: null,
  endTime: null,
  completedSessions: 0,
  remainingSeconds: workDuration,
  resetAt: currentTime
}
```

---

## timer-ui.js

DOM 更新とイベントリスナーを担当する。`timer-state.js` の純粋関数を呼び出す。  
ブラウザ専用（`window` への参照を持つ）。

### 定数

#### `RING_CIRCUMFERENCE`

円形プログレスリングの円周長。`2 * Math.PI * 80 ≈ 502.65`

### 関数

#### `formatSeconds(totalSeconds) → string`

秒数を `"MM:SS"` 形式にフォーマットする。

#### `updateTimerDisplay(remainingSeconds)`

`id="timerDisplay"` 要素のテキストを残り時間で更新する。

#### `updateProgressRing(progressPercent)`

`id="progressRing"` 要素の `stroke-dashoffset` を更新して進捗を描画する。

```
dashOffset = RING_CIRCUMFERENCE * (1 - progressPercent / 100)
```

#### `updatePhaseDisplay(phase)`

`id="phaseLabel"` 要素のテキストをフェーズ名（日本語）に更新する。

| フェーズ | 表示テキスト |
|---|---|
| `work` | 作業中 |
| `short_break` | 短休憩 |
| `long_break` | 長休憩 |

#### `updateStartButtonText(isRunning)`

`id="startBtn"` 要素のテキストを更新する。

- `isRunning === true` → `"停止"`
- `isRunning === false` → `"開始"`

#### `updateDisplay(state, settings)`

上記の各 `update*` 関数をまとめて呼び出し、画面全体を更新する。

#### `setEventListeners()`

`id="startBtn"` と `id="resetBtn"` にクリックイベントを登録する。

- **startBtn**: `isRunning` が `true` なら `pauseTimer`、`false` なら `resumeTimer` を呼び出す
- **resetBtn**: `resetTimer` を呼び出す

---

## templates/index.html（初期化スクリプト）

`DOMContentLoaded` イベントで以下を実行する。

1. `window.timerSettings = Object.assign({}, defaultSettings)` — 設定を初期化
2. `window.timerState = resetTimer(window.timerSettings, Date.now())` — 状態を初期化
3. `updateDisplay()` — 画面を初期表示
4. `setEventListeners()` — ボタンのイベントを登録
5. `setInterval(callback, 100)` — 100ms ごとに `transitionPhase()` と `updateDisplay()` を実行

タイマーが停止中（`isRunning === false`）の場合、`setInterval` コールバックは何もしない。

---

## DOM 要素一覧

| ID | 要素 | 役割 |
|---|---|---|
| `phaseLabel` | `<p>` | 現在フェーズ名（日本語）を表示 |
| `progressRing` | `<circle>` | 円形プログレスの塗りつぶし部分（SVG） |
| `timerDisplay` | `<div>` | 残り時間（MM:SS 形式）を表示 |
| `startBtn` | `<button>` | 開始 / 停止ボタン |
| `resetBtn` | `<button>` | リセットボタン |
| `completedCount` | `<span>` | 今日の完了回数（現在はハードコード値 `4`） |
| `focusTime` | `<span>` | 今日の集中時間（現在はハードコード値 `1時間40分`） |

> **注意**: `completedCount` と `focusTime` は現在テンプレートにハードコードされており、API との連携は未実装。

---

## CSS コンポーネント（style.css）

| クラス | 説明 |
|---|---|
| `.window` | カード型のウィンドウ枠（幅 340px、角丸 16px） |
| `.titlebar` | タイトルバー（タイトルとウィンドウコントロールを含む） |
| `.content` | メインコンテンツエリア（縦方向の Flexbox） |
| `.phase-label` | フェーズ名テキスト |
| `.ring-container` | 円形プログレスリングのコンテナ（200×200px） |
| `.progress-ring` | SVG プログレスリング（`-90deg` 回転） |
| `.progress-ring__track` | プログレスリングの背景トラック（薄いグレー） |
| `.progress-ring__fill` | プログレスリングの進捗部分（紫色、`stroke-dashoffset` で制御） |
| `.timer-display` | タイマー数字（フォントサイズ 42px） |
| `.btn-group` | ボタンのグループ |
| `.btn--primary` | 開始ボタン（紫背景） |
| `.btn--secondary` | リセットボタン（枠線のみ） |
| `.stats-card` | 今日の進捗カード |
