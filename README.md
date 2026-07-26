# Creator Inbox

日本語の創作者が、絵文字・感想・お題・質問をひとつのURLで匿名受信するための受信箱です。送信者の登録は必要ありません。

[使う](https://creator-inbox.yusuke8h.workers.dev) · [実利用募集](https://github.com/yhay81/creator-inbox/issues/1)

![匿名の絵文字・感想・質問がひとつの受信箱へ届くCreator Inboxのイメージ](./public/og.jpg)

## Product

- 送信者: 登録なし。絵文字だけ、または種類を選んだ1〜2,000文字のメッセージを送信。
- 創作者: Better Authのメール/パスワード認証で受信箱を管理。
- 安全性: Turnstile、Cloudflare Rate Limiting、ハニーポット、ミュートワード、CSP、同一オリジン検査。
- プライバシー: 匿名送信者のIP、Cookie識別子、ブラウザ識別子をアプリDBへ保存しない。
- 計測: 個人情報を含まない日次イベントだけを保存。投稿本文は集計へ含めない。

技術構成はCloudflare Workers、D1、Hono、Hono JSX、Better Auth、Drizzle ORM、Vite+です。

## Local development

Node.js 24はfnmで管理し、Vite+によるランタイム管理は無効にします。

```powershell
vp env off
Copy-Item .dev.vars.example .dev.vars
npm ci
npx wrangler d1 migrations apply creator-inbox --local
npm run dev
```

`.dev.vars`のダミー値はローカル専用です。認証を試す前に、32文字以上の`BETTER_AUTH_SECRET`と予備の`PILOT_INVITE_CODE`へ変更してください。

## Quality gate

```powershell
npm run check
npm test
npm run build
npm run metrics
```

`npm run deploy`も同じ検査を先に実行します。

## Cloudflare setup

本番のD1、Rate Limiting、Turnstile、Better Auth secretは設定済みです。別アカウントへ複製する場合だけD1を作成し、返されたIDで`wrangler.jsonc`を更新します。

```powershell
npx wrangler d1 create creator-inbox
npx wrangler d1 migrations apply creator-inbox --remote
```

秘密値はリポジトリや`wrangler.jsonc`へ入れず、Cloudflareへ直接登録します。

```powershell
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put PILOT_INVITE_CODE
npx wrangler secret put TURNSTILE_SECRET_KEY
```

Turnstileの公開site keyは`PUBLIC_TURNSTILE_SITE_KEY`としてCloudflare環境変数へ設定します。productionではTurnstileの秘密値と応答がない投稿を受理しません。

## Deployment

```powershell
npm run deploy
```

公開前の作業順と確認項目は[OPERATIONS.md](./OPERATIONS.md)、参加者運用は[PILOT.md](./PILOT.md)、判定条件は[EXPERIMENT.md](./EXPERIMENT.md)を参照してください。
