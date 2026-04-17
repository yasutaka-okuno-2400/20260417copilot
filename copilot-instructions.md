# Copilot Instructions

## 重要：言語設定

**必ず日本語でレビューを行ってください。すべてのコメント、提案、説明は日本語で記述してください。**

## ファイル配置ルール

- **Pomodoro タイマー**に関する作業では、ファイルを `1.pomodoro/` 配下に保存してください。
- **Copilot Web Relay** に関する作業では、ファイルを `2.copilotWebRelay/` 配下に保存してください。

---

## 1. pomodoro（`1.pomodoro/`）

### 起動・テスト

```bash
# アプリ起動
cd 1.pomodoro
python app.py

# テスト（pytest が導入されたら）
cd 1.pomodoro
pytest tests/                        # 全テスト
pytest tests/test_timer_service.py   # 単一ファイル
pytest tests/test_timer_service.py::test_get_next_phase  # 単一テスト
```

### アーキテクチャ

4 層構成。詳細は `architecture.md` を参照。

| 層 | 場所 | 役割 |
|---|---|---|
| Web 層 | `pomodoro/routes/` | Flask ルーティング・HTTP 入出力のみ。業務ロジック禁止 |
| Service 層 | `pomodoro/services/` | 業務ロジック。Flask・SQLite に直接依存しない |
| Repository 層 | `pomodoro/repositories/` | SQLite アクセスのみ。上位層へは抽象 I/F を提供 |
| Frontend 層 | `static/js/` | ブラウザ上の状態管理と描画 |

Flask アプリは `create_app()` ファクトリパターン（`pomodoro/__init__.py`）を使う。

### Flask の約束事

- ルート関数は薄く保つ（入力受取 → サービス呼出 → レスポンス返却のみ）
- 現在時刻はサービス層の引数で渡す（`datetime.now()` を直接呼ばない）
- Repository はサービス層へ DI する（テスト時にインメモリ実装と差し替え可能にする）
- `create_app()` で本番・テスト設定を切り替える

### API エンドポイント

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/` | タイマー画面 |
| GET | `/api/stats/today` | 当日の完了回数・集中時間 |
| GET | `/api/settings` | 設定値取得 |
| PUT | `/api/settings` | 設定値更新 |
| POST | `/api/sessions` | 作業セッション完了記録 |

### データベース（SQLite）

保存対象は設定値（`settings`）とセッション履歴（`sessions`）のみ。タイマーの進行状態はサーバーに持たない（クライアント側で管理）。  
初期実装では `daily_stats` テーブルは不要。`sessions` から当日分を集計する。

### JavaScript の約束事

JS ファイルは役割で分離する：

| ファイル | 役割 |
|---|---|
| `timer-state.js` | 状態遷移・残り時間・進捗率の**純粋関数**。DOM 依存なし |
| `timer-ui.js` | DOM 更新・円形プログレス描画。`timer-state.js` の関数を呼び出す |
| `api.js` | Flask API 通信 |
| `storage.js` | localStorage 読み書き |

- `timer-state.js` は IIFE でラップし、`window` と `module.exports` の両方に export する（ブラウザとテストランナーの両対応）
- 変数宣言は `var`（ES5 スタイル）を維持する
- 時刻引数 `currentTime`（ミリ秒）を受け取る形にし、`Date.now()` を関数内で直接呼ばない（テスト容易性）
- タイマーの残り時間は「終了予定時刻（`endTime`）との差分」で計算する（毎秒減算しない）

### テスト方針

- タイマー状態遷移・進捗率計算・バリデーション → 純粋関数のユニットテスト
- Repository → インメモリ SQLite（`:memory:`）で実テスト
- Flask ルート → `app.test_client()` で HTTP 入出力のみ検証
- フロントエンドのロジック（`timer-state.js`）→ Node.js で関数単体テスト可能
