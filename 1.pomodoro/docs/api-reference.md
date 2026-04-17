# API リファレンス

現在の実装では、Flask サーバーは画面配信のみを担当する。REST API エンドポイントはまだ実装されていない。

## 実装済みエンドポイント

### GET /

タイマー画面（HTML）を返す。

- **レスポンス**: `200 OK` — `templates/index.html` をレンダリングして返す
- **Content-Type**: `text/html`

```
GET / HTTP/1.1

HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
```

---

## 未実装エンドポイント（設計済み）

以下のエンドポイントは `features.md` および `architecture.md` に設計されているが、現時点では実装されていない。

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/stats/today` | 当日の完了回数・集中時間合計を返す |
| GET | `/api/settings` | 現在の設定値を返す |
| PUT | `/api/settings` | 設定値を更新する |
| POST | `/api/sessions` | 作業セッション完了を記録する |
