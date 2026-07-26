# Security Policy

## Reporting

脆弱性や匿名投稿の濫用を公開Issueへ投稿しないでください。脆弱性は[GitHubのprivate vulnerability reporting](https://github.com/yhay81/creator-inbox/security/advisories/new)、パイロット中の濫用は参加時に案内した非公開連絡先へ報告してください。24時間以内に一次確認します。

## Implemented baseline

- Better Authによる所有者認証。招待コード必須、パスワード12文字以上、30日セッション。
- 認証側のIP追跡を無効化。匿名投稿もIP・識別子をD1へ保存しない。
- 本番の匿名投稿はTurnstile必須。IPを一時キーに8件/分のCloudflare Rate Limitingを適用。
- 16 KiBのリクエスト上限、2,000文字の本文上限、ハニーポット、ミュートワード。
- Hono JSXの既定エスケープを利用し、ユーザー生成HTMLを描画しない。
- CSP、HSTS、クリックジャッキング防止、MIME sniffing防止、同一オリジン検査。
- 秘密値はCloudflare Secretsまたは`.dev.vars`だけに置き、Gitへ保存しない。
- CIでformat、lint、型検査、unit test、production buildを実行。

## Pilot limitations

- メール確認とパスワード再設定メールは未実装。招待制パイロット中は運営が本人確認後に個別対応する。
- 投稿者の永続ブロックは、匿名性を守るため未実装。Turnstile、短時間制限、ミュート、受信停止で対応する。
- 公開前にCloudflareのログ保持、アカウント権限、D1バックアップ、秘密値ローテーションを確認する。
