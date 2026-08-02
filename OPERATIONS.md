# Operations

## One-time production setup

1. [x] Cloudflare APAC上でD1 `creator-inbox`を作り、実IDを設定する。
2. [x] `creator-inbox.yhay81.com`を許可したTurnstile widgetとRate Limitingを設定する。
3. [x] Better Auth secretをCloudflare Secretsへ登録する。
4. [x] D1 migrationをremoteへ適用する。
5. [x] `yhay81`の個人運営とセルフサービス削除を明記する。
6. [x] GitHubのprivate vulnerability reportingを有効化し、`SECURITY.md`から案内する。
7. [x] Turnstileの許可ドメインとBetter Auth originを独自ドメインへ更新する。
8. [x] `npm run deploy`後、下記のsmoke testを行う。

## Smoke test

- `/healthz`が200と`healthy: true`を返す。
- Turnstile未完了の公開登録が拒否される。
- 12文字未満のパスワードが拒否される。
- ログイン後に受信箱を作成し、公開URLを別ブラウザで開ける。
- 絵文字、感想、お題、質問を各1件送り、受信箱で表示・アーカイブできる。
- Turnstile未完了の投稿が拒否される。
- 1分に9件送った際、少なくとも9件目が429になる。
- ミュート語を含む投稿が受信箱へ保存されず、送信側は通常の完了画面になる。
- クロスオリジンの設定更新とアーカイブが403になる。
- モバイル幅、キーボード操作、スクリーンリーダーの主要ラベルを確認する。

## Routine

- 毎日: Workersの5xx、Turnstile失敗急増、D1エラー、参加者の安全報告を確認。
- 毎日: `npm run metrics`で登録、受信箱作成、実受信、開封、複数日利用を集計する。個別利用者や投稿本文は出力しない。
- 毎週: 依存監査、D1 exportの復元テスト、集計値と欠測の確認。
- インシデント時: 影響を受けた受信箱を停止し、秘密値流出ならローテーション。投稿本文をログへ貼らない。
- パイロット終了: 成功・失敗・不確定を事前条件で判定し、90日以内の削除または正式移行を選ぶ。
