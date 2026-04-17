# ポモドーロタイマー段階的実装計画

このドキュメントは、features.md に記載の機能を、段階的にどのような粒度で実装するかを定めたものである。

各段階では、アーキテクチャで定義した 4 層（Web層、Service層、Repository層、Frontend層）のうち、どの部分まで実装するかを明確にしている。

---

## Phase 1: Flask基盤とUI骨組み

**目的**: アプリケーションの最小構成をセットアップし、画面を表示できる状態にする。

**実装対象**:

- Flask アプリケーションファクトリ (`create_app`)
- HTML テンプレート (index.html)
- CSS スタイル (style.css)
- 静的なタイマー表示

**実装ファイル**:

```
1.pomodoro/
  app.py (アプリケーションファクトリ)
  pomodoro/
    __init__.py (パッケージ初期化、create_app関数)
  templates/
    index.html (タイマー画面の骨組み)
  static/
    css/
      style.css (UIレイアウト、円形プログレスのCSS)
```

**実装内容**:

1. `pomodoro/__init__.py`: アプリケーションファクトリ
   - `create_app()` 関数を定義
   - Flask インスタンス作成
   - 初期設定（テンプレートフォルダ、静的ファイルフォルダの指定）

2. `pomodoro/__init__.py`: ルート定義（最小限）
   - `GET /`: index.html を返す

3. `templates/index.html`:
   - UI モックに合わせたレイアウト
   - タイトル、フェーズ表示用要素
   - 残り時間表示 (25:00 固定テキスト)
   - 円形プログレス用 SVG または Canvas
   - 開始、リセットボタン
   - 下部統計表示エリア

4. `static/css/style.css`:
   - レイアウト、色、フォント
   - 円形プログレス描画用 CSS
   - ボタンスタイル

**動作確認方法**:

```bash
export FLASK_APP=pomodoro FLASK_ENV=development
flask run
```

ブラウザで http://localhost:5000 にアクセスし、画面が表示されることを確認。

**テスト対象**:

- Flask アプリケーションが正常に起動すること
- GET / で HTTP 200 が返ること

**次段階への接続**:

- この段階では、テンプレート内にダミー JavaScript を配置するだけで、ロジックは未実装
- 次段階で JavaScript ロジックを実装して、動的表示へ移行

---

## Phase 2: JavaScript タイマー状態管理

**目的**: クライアント側でタイマー状態を保持・計算し、DOM 操作を呼び出す準備をする。

**実装対象**:

- タイマー状態管理 (timer-state.js)
- 時刻ベースの残り時間計算ロジック
- 状態遷移ロジック（純粋関数）
- ローカルストレージとの連携準備

**実装ファイル**:

```
1.pomodoro/
  static/
    js/
      timer-state.js (状態管理、計算ロジック)
```

**実装内容**:

1. `timer-state.js`:

   定義すべき定数・型:

   - フェーズ定義: `PHASE.WORK`, `PHASE.SHORT_BREAK`, `PHASE.LONG_BREAK`
   - タイマー状態型: `{ phase, isRunning, startedAt, endTime, completedSessions }`
   - デフォルト設定: `{ workDuration: 25 * 60, shortBreakDuration: 5 * 60, longBreakDuration: 15 * 60, longBreakInterval: 4 }`

   実装関数（全て純粋関数）:

   - `calculateRemainingSeconds(state, currentTime)`: 終了予定時刻との差分で残り秒数を計算
   - `calculateProgressPercent(phase, remaining, duration)`: 進捗率を 0-100 で計算
   - `getNextPhase(currentPhase, completedSessions, longBreakInterval)`: 次フェーズを判定
   - `transitionPhase(state, currentTime, settings)`: フェーズ遷移後の新しい state を返す
   - `startTimer(settings, currentTime)`: タイマー開始時の初期 state を返す
   - `pauseTimer(state)`: 一時停止状態を返す
   - `resumeTimer(state, currentTime)`: 再開状態を返す
   - `resetTimer(settings, currentTime)`: リセット状態を返す

2. `index.html`:
   - `<script src="/static/js/timer-state.js"></script>` を追加
   - 初期化コード: デフォルト設定でタイマーを初期化

**動作確認方法**:

ブラウザのコンソールで以下を実行:

```javascript
const state = startTimer(defaultSettings, Date.now());
console.log(calculateRemainingSeconds(state, Date.now())); // 1500 (25分)
console.log(calculateProgressPercent('work', 1500, 1500)); // 0
```

**テスト対象**:

- 状態遷移ロジック: 作業 → 短休憩 → 作業（3回後長休憩）
- 残り時間計算: 終了予定時刻との差分が正しく計算されること
- 進捗率計算: 0-100 の範囲内で返ること
- 長休憩判定: 規定回数で正しく長休憩へ遷移すること

**テストコード配置**:

```
1.pomodoro/
  tests/
    test_timer_state.js (または test_timer_state.py で互換性のあるテストを作成)
```

**次段階への接続**:

- この段階では計算値を返すだけで、DOM 更新や画面表示は行わない
- 次段階で timer-ui.js を実装し、計算結果を画面に反映

---

## Phase 3: UI 更新とイベント処理

**目的**: タイマー状態の変化を画面に反映し、ユーザーがボタンで操作できるようにする。

**実装対象**:

- タイマー UI 更新 (timer-ui.js)
- イベントリスナー登録（開始、停止、リセットボタン）
- 画面表示のリアルタイム更新

**実装ファイル**:

```
1.pomodoro/
  static/
    js/
      timer-ui.js (DOM操作、描画処理)
```

**実装内容**:

1. `timer-ui.js`:

   実装関数:

   - `updateDisplay(state, settings)`: 画面上のテキスト、プログレス、フェーズ表示を更新
   - `updateTimerDisplay(remainingSeconds)`: mm:ss 形式で残り時間を表示
   - `updateProgressRing(progressPercent)`: SVG または Canvas で円形プログレスを描画
   - `updatePhaseDisplay(phase)`: 「作業中」「短休憩」「長休憩」を表示
   - `setEventListeners()`: ボタンの click イベントを登録

2. `index.html`:
   - `<script src="/static/js/timer-ui.js"></script>` を追加
   - `<button id="startBtn">開始</button>`
   - `<button id="resetBtn">リセット</button>`
   - `<div id="timerDisplay">25:00</div>`
   - `<svg id="progressRing">...</svg>`

3. `index.html` の初期化スクリプト:
   ```javascript
   let timerState = startTimer(defaultSettings, Date.now());
   updateDisplay(timerState, defaultSettings);
   setEventListeners();
   ```

4. タイマー更新ループ (setInterval):
   ```javascript
   setInterval(() => {
     if (timerState.isRunning) {
       const now = Date.now();
       timerState = transitionPhase(timerState, now, defaultSettings);
       updateDisplay(timerState, defaultSettings);
     }
   }, 100); // 100ms ごとに更新
   ```

**動作確認方法**:

1. ブラウザで http://localhost:5000 にアクセス
2. 画面に "25:00" が表示されることを確認
3. 「開始」ボタンをクリック
4. 残り時間がカウントダウンされることを確認
5. 「リセット」ボタンをクリック
6. 時間が 25:00 に戻ることを確認

**テスト対象**:

- 開始ボタンで isRunning が true になること
- リセットボタンで残り時間が元に戻ること
- カウントダウンが正確に進行すること
- フェーズ遷移時に画面表示が変わること

**次段階への接続**:

- この段階では、状態はブラウザメモリにのみ保存（時間がリセットされてしまう）
- 次段階で API と連携し、サーバー側で状態を永続化

---

## Phase 4: データベース基盤と Repository 層

**目的**: SQLite データベースをセットアップし、設定値とセッション履歴を永続化する。

**実装対象**:

- SQLite データベース初期化
- Repository 層の実装
- 設定テーブル、セッションテーブルの CRUD 操作

**実装ファイル**:

```
1.pomodoro/
  pomodoro/
    db/
      connection.py (データベース接続管理)
    domain/
      models.py (テーブルスキーマ定義)
    repositories/
      settings_repository.py (設定取得・保存)
      session_repository.py (セッション履歴保存)
```

**実装内容**:

1. `pomodoro/db/connection.py`:
   - `get_db()`: SQLite 接続を取得
   - `init_db()`: テーブルを初期化
   - テーブル作成 SQL

2. `pomodoro/domain/models.py`:
   - `Settings` dataclass 定義
   - `Session` dataclass 定義

3. `pomodoro/repositories/settings_repository.py`:
   - `SettingsRepository` クラス
   - `get_settings()`: 設定を取得
   - `update_settings(settings)`: 設定を更新

4. `pomodoro/repositories/session_repository.py`:
   - `SessionRepository` クラス
   - `save_session(session)`: セッションを保存
   - `get_sessions_today()`: 当日のセッション一覧を取得
   - `get_today_stats()`: 当日の合計完了回数、集中時間を計算

5. 初期化処理:
   - app.py で `init_db()` を実行

**テーブル設計**:

```sql
CREATE TABLE settings (
  id INTEGER PRIMARY KEY,
  work_duration_minutes INTEGER,
  short_break_minutes INTEGER,
  long_break_minutes INTEGER,
  long_break_interval INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE sessions (
  id INTEGER PRIMARY KEY,
  session_type TEXT, -- 'work', 'short_break', 'long_break'
  focus_seconds INTEGER,
  completed_at TIMESTAMP
);
```

**動作確認方法**:

```python
from pomodoro.repositories.settings_repository import SettingsRepository
repo = SettingsRepository()
settings = repo.get_settings()
print(settings)
```

**テスト対象**:

- テーブルが正常に作成されること
- 設定値が保存・取得できること
- セッションが保存できること
- 当日統計が正確に計算されること

**次段階への接続**:

- API エンドポイントから Repository を呼び出す基盤が整う

---

## Phase 5: API 実装（設定管理）

**目的**: フロントエンドから設定を取得・更新できるようにする。

**実装対象**:

- Service 層（設定検証、ビジネスロジック）
- API ルート（設定取得・更新）
- クライアント側の API 通信層

**実装ファイル**:

```
1.pomodoro/
  pomodoro/
    routes/
      api_routes.py (API ルート)
    services/
      settings_service.py (設定検証、操作ロジック)
    domain/
      validators.py (入力値検証)
  static/
    js/
      api.js (API 通信ラッパー)
```

**実装内容**:

1. `pomodoro/domain/validators.py`:
   - `validate_work_duration(minutes)`: 1 以上 60 以下か確認
   - `validate_break_duration(minutes)`: 1 以上 30 以下か確認
   - `validate_long_break_interval(count)`: 1 以上 10 以下か確認

2. `pomodoro/services/settings_service.py`:
   - `SettingsService` クラス
   - `get_settings()`: Repository から取得
   - `update_settings(data)`: 検証後に Repository へ保存

3. `pomodoro/routes/api_routes.py`:
   - `@app.route('/api/settings', methods=['GET'])`
     - JSON で設定値を返す
   - `@app.route('/api/settings', methods=['PUT'])`
     - リクエストボディの設定を検証して保存
     - 正常系: `{ "success": true, "settings": {...} }`
     - エラー系: `{ "success": false, "errors": {...} }` (HTTP 400)

4. `static/js/api.js`:
   - `getSettings()`: GET /api/settings を呼び出し
   - `updateSettings(settings)`: PUT /api/settings を呼び出し

5. 初期化:
   - `app.py` に API ルートを登録

**API 仕様**:

```
GET /api/settings
Response 200:
{
  "work_duration_minutes": 25,
  "short_break_minutes": 5,
  "long_break_minutes": 15,
  "long_break_interval": 4
}

PUT /api/settings
Request:
{
  "work_duration_minutes": 30,
  ...
}
Response 200:
{
  "success": true,
  "settings": {...}
}
Response 400:
{
  "success": false,
  "errors": {
    "work_duration_minutes": "Must be between 1 and 60"
  }
}
```

**動作確認方法**:

```bash
curl http://localhost:5000/api/settings | jq
curl -X PUT http://localhost:5000/api/settings \
  -H "Content-Type: application/json" \
  -d '{"work_duration_minutes": 30, ...}' | jq
```

**テスト対象**:

- GET /api/settings が正常に設定を返すこと
- PUT /api/settings で設定が更新されること
- 不正な値に対して 400 エラーが返ること
- バリデーション関数が正確に動作すること

**フロントエンド連携**:

- `index.html` に設定変更フォームを追加（この段階では表示のみ）
- `api.js` を読み込んで、必要に応じて設定を取得

**次段階への接続**:

- 次段階でセッション記録 API を実装

---

## Phase 6: API 実装（セッション記録と統計）

**目的**: セッション終了時に実績を記録し、今日の進捗を表示できるようにする。

**実装対象**:

- Service 層（セッション記録、統計計算）
- API ルート（セッション記録、統計取得）
- フロントエンド側でセッション完了時に記録を送信

**実装ファイル**:

```
1.pomodoro/
  pomodoro/
    routes/
      api_routes.py (API ルート追加)
    services/
      stats_service.py (統計計算ロジック)
```

**実装内容**:

1. `pomodoro/services/stats_service.py`:
   - `StatsService` クラス
   - `get_today_stats(session_repository)`: 当日統計を計算
     - 完了回数、集中時間合計

2. `pomodoro/routes/api_routes.py`:
   - `@app.route('/api/sessions', methods=['POST'])`
     - セッション完了時の記録
     - リクエスト例:
       ```json
       {
         "session_type": "work",
         "focus_seconds": 1500
       }
       ```
     - レスポンス: `{ "success": true, "session": {...} }`

   - `@app.route('/api/stats/today', methods=['GET'])`
     - 当日統計を返す
     - レスポンス例:
       ```json
       {
         "completed_count": 4,
         "focus_seconds_total": 6000
       }
       ```

3. `static/js/api.js`:
   - `recordSession(sessionType, focusSeconds)`: POST /api/sessions を呼び出し
   - `getTodayStats()`: GET /api/stats/today を呼び出し

4. `static/js/timer-ui.js`:
   - フェーズ遷移時に `recordSession()` を呼び出し

5. `index.html`:
   - 今日の統計表示エリア（UI モックの下部）
   - `<div id="todayStats"></div>`

**API 仕様**:

```
POST /api/sessions
Request:
{
  "session_type": "work",
  "focus_seconds": 1500
}
Response 200:
{
  "success": true,
  "session": {
    "id": 1,
    "session_type": "work",
    "focus_seconds": 1500,
    "completed_at": "2026-04-17T10:30:00"
  }
}

GET /api/stats/today
Response 200:
{
  "completed_count": 4,
  "focus_seconds_total": 6000
}
```

**動作確認方法**:

1. ブラウザで http://localhost:5000 にアクセス
2. 作業セッション終了後、統計が更新されことを確認
3. ブラウザ再読み込み後も統計が変わらないことを確認（永続化）

**テスト対象**:

- POST /api/sessions でセッションが保存されること
- GET /api/stats/today で正確な統計が返ること
- セッション記録と統計が連動すること

**次段階への接続**:

- 次段階で状態復元機能を実装

---

## Phase 7: 状態復元と高度な機能

**目的**: ブラウザリロード後にタイマー状態を復元し、より堅牢な運用を実現する。

**実装対象**:

- ローカルストレージ管理 (storage.js)
- ブラウザリロード時の状態復元
- エラーハンドリングの充実

**実装ファイル**:

```
1.pomodoro/
  static/
    js/
      storage.js (localStorage 操作)
```

**実装内容**:

1. `static/js/storage.js`:
   - `saveTimerState(state)`: 状態を localStorage に保存
   - `loadTimerState()`: localStorage から状態を復元
   - `clearTimerState()`: 状態をクリア

2. `index.html` の初期化処理:
   - 起動時に `loadTimerState()` を呼び出し
   - 保存済み状態があれば復元、なければ新規作成

3. エラーハンドリング:
   - API 通信失敗時の再試行
   - ネットワーク接続状態の監視

**実装内容（詳細）**:

```javascript
// storage.js

function saveTimerState(state) {
  localStorage.setItem('timerState', JSON.stringify({
    phase: state.phase,
    isRunning: state.isRunning,
    endTime: state.endTime,
    completedSessions: state.completedSessions,
    savedAt: Date.now()
  }));
}

function loadTimerState(settings, currentTime) {
  const saved = localStorage.getItem('timerState');
  if (!saved) return startTimer(settings, currentTime);

  const state = JSON.parse(saved);
  const elapsed = currentTime - state.savedAt;

  // 終了予定時刻を経過時間分だけ進める
  state.endTime += elapsed;

  // 終了予定時刻が過ぎていたら最後のフェーズ遷移を反映
  if (state.isRunning && state.endTime <= currentTime) {
    return transitionPhase(state, currentTime, settings);
  }

  return state;
}

function clearTimerState() {
  localStorage.removeItem('timerState');
}
```

4. `index.html` の初期化:
   ```javascript
   document.addEventListener('DOMContentLoaded', () => {
     timerState = loadTimerState(defaultSettings, Date.now());
     updateDisplay(timerState, defaultSettings);
     setEventListeners();
     
     // 状態変更時に保存
     setInterval(() => {
       if (timerState) {
         saveTimerState(timerState);
       }
     }, 1000);
   });
   ```

**動作確認方法**:

1. ブラウザで http://localhost:5000 にアクセス
2. 「開始」をクリック
3. ブラウザをリロード
4. タイマーが中断したところから再開されることを確認

**テスト対象**:

- 状態が localStorage に正確に保存されること
- 復元後の残り時間が正確に計算されること
- リロード後のフェーズ遷移が正確に処理されること

**次段階への接続**:

- 次段階でテスト整備を行う

---

## Phase 8: テスト整備

**目的**: 全体をテストでカバーし、バグを予防する。

**実装対象**:

- ユニットテスト（Python 側）
- ユニットテスト（JavaScript 側）
- 統合テスト
- API テスト

**実装ファイル**:

```
1.pomodoro/
  tests/
    __init__.py
    test_validators.py (バリデーション)
    test_timer_state.js (タイマー状態ロジック)
    test_timer_ui.js (UI 更新ロジック)
    test_repositories.py (データベース操作)
    test_services.py (ビジネスロジック)
    test_api.py (API エンドポイント)
```

**テスト対象と目安**:

| テスト対象 | ツール | 目安 |
|-----------|--------|------|
| 入力値バリデーション | pytest | 8-10 テスト |
| 状態遷移ロジック | pytest (またはテスト実行ツール) | 10-15 テスト |
| 残り時間計算 | pytest | 5-8 テスト |
| 進捗率計算 | pytest | 4-6 テスト |
| Repository (SQLite) | pytest | 10-15 テスト |
| Service層 | pytest | 8-12 テスト |
| API エンドポイント | pytest | 15-20 テスト |
| UI 更新ロジック | Jest または実装言語のテスト | 8-12 テスト |

**テスト実行コマンド例**:

```bash
# Python テスト
pytest tests/ -v

# JavaScript テスト（Jest の場合）
npm test

# カバレッジ確認
pytest tests/ --cov=pomodoro
```

**テスト記述の指針**:

- 各テストは 1 つの責務のみ検証
- テスト名は検証内容を明確に記述
- Setup/Teardown で重複を削減
- Mock を活用してテスト間の依存を排除

---

## 全体スケジュール概要

| Phase | 主な実装 | 予想工数 | マイルストーン |
|-------|--------|--------|--------------|
| 1 | Flask + UI 骨組み | 1-2h | 画面表示 |
| 2 | 状態管理ロジック | 2-3h | カウントダウン可能 |
| 3 | UI 更新と操作 | 1-2h | ボタン操作可能 |
| 4 | DB 基盤 | 2-3h | データ永続化可能 |
| 5 | 設定 API | 2-3h | 設定保存可能 |
| 6 | セッション記録 API | 2-3h | 実績表示可能 |
| 7 | 状態復元 | 1-2h | リロード後も復元 |
| 8 | テスト整備 | 4-6h | テストカバレッジ向上 |
| **合計** | | **15-24h** | **MVP完了** |

---

## 実装時の留意点

### 責務分離の維持

- ロジック関数は必ず純粋関数にする
- API ルートは薄く保つ
- Service 層に判定ロジックを寄せる

### テスト容易性

- 時刻依存は注入可能にする
- Repository は差し替え可能にする
- JavaScript のロジックと DOM 操作を分離

### デバッグ性

- API レスポンスは常に構造化形式 (JSON) にする
- ログ出力は開発段階では詳細に、本番では適切に制限

### 段階の見直し

- 各段階は独立して実装できるよう設計
- 前段階に問題が見つかったら後の段階を進める前に修正
- テストを増やしながら進め、バグを早期に検出

---

## 次のステップ

1. **Phase 1 から開始**: Flask と UI 骨組みを実装
2. **動作確認**: 各段階で実装後、動作確認してから次へ進む
3. **テストファイル作成**: 実装と並行してテストを作成
4. **ドキュメント更新**: 各段階完了時にこのドキュメントの完了状況を記録

このプラン内で実装が難しい場合や、順序の入れ替えが必要な場合は、遠慮なく相談してください。
