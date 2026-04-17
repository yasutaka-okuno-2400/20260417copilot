# データモデル仕様

## 実装状態

現時点では SQLite データベースは実装されていない。タイマーの状態はブラウザのメモリ上（JavaScript の `window.timerState`）にのみ保持される。

---

## クライアント側タイマー状態（`window.timerState`）

`timer-state.js` が管理する JavaScript オブジェクト。

| フィールド | 型 | 説明 |
|---|---|---|
| `phase` | string | 現在のフェーズ（`"work"` / `"short_break"` / `"long_break"`） |
| `isRunning` | boolean | タイマーが実行中かどうか |
| `startedAt` | number \| null | タイマー開始時刻（ミリ秒、Unix タイム）。停止中は `null` |
| `endTime` | number \| null | 終了予定時刻（ミリ秒、Unix タイム）。停止中は `null` |
| `completedSessions` | number | 完了した作業セッション数 |
| `remainingSeconds` | number | 残り秒数（一時停止中の参照値） |
| `resetAt` | number | （リセット時のみ）リセット実行時刻（ミリ秒） |

### フェーズ定数（`PHASE`）

```javascript
PHASE.WORK        // "work"
PHASE.SHORT_BREAK // "short_break"
PHASE.LONG_BREAK  // "long_break"
```

---

## クライアント側設定（`window.timerSettings`）

`timer-state.js` の `defaultSettings` を初期値として使用。

| フィールド | 型 | デフォルト値 | 説明 |
|---|---|---|---|
| `workDuration` | number | 1500 | 作業時間（秒） |
| `shortBreakDuration` | number | 300 | 短休憩時間（秒） |
| `longBreakDuration` | number | 900 | 長休憩時間（秒） |
| `longBreakInterval` | number | 4 | 長休憩に入るまでの作業セッション数 |

---

## 将来のデータベーステーブル（未実装）

以下は `architecture.md` に設計されているが、現時点では未実装。

### settings テーブル

| カラム | 型 | 説明 |
|---|---|---|
| `id` | integer | 主キー |
| `work_duration_minutes` | integer | 作業時間（分） |
| `short_break_minutes` | integer | 短休憩時間（分） |
| `long_break_minutes` | integer | 長休憩時間（分） |
| `long_break_interval` | integer | 長休憩間隔（作業回数） |

### sessions テーブル

| カラム | 型 | 説明 |
|---|---|---|
| `id` | integer | 主キー |
| `session_type` | string | セッション種別（`"work"` など） |
| `focus_seconds` | integer | 集中時間（秒） |
| `completed_at` | datetime | 完了日時 |
