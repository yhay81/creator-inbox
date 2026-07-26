# Decisions

## 2026-07-26: product boundary

- 既存サービスの全機能複製ではなく、感想・お題・質問の分類と絵文字送信を最初の差別化仮説にする。
- 所有者だけをBetter Authで認証し、匿名送信者には登録やログインを求めない。
- 歴史的データの移行は作らず、新規受付URLの2週間併用でswitchabilityを検証する。

## 2026-07-26: stack

- Cloudflare Workers/D1、Hono/Hono JSX、Better Auth、Drizzle ORM、Vite+。
- Vite+ betaとVitestの互換性のため、production buildはVite+ core、unit testは固定した標準Vitestを`vp test`から起動する。
- Drizzle Kitは本番依存にせず、レビュー可能なSQL migrationを正本にする。

## 2026-07-26: privacy and abuse

- 匿名送信者のIPや永続識別子をD1へ保存しない。
- レート制限のキーとしてCloudflare側でIPを短時間だけ利用し、Turnstileと併用する。
- ミュート語一致は保存せず、送信者には通常の完了応答を返す。
- パイロット中は決済、公開返信、メール通知、ファイル添付を持たせない。
