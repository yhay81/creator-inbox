# Metrics

## Canonical events

D1の`events`には識別可能な送信者情報や投稿本文を入れません。

| Event              | Meaning                              | Personal data |
| ------------------ | ------------------------------------ | ------------- |
| `inbox_created`    | 創作者が公開受信箱を作成             | Inbox ID only |
| `message_received` | ミュートされていない反応を1件受信    | Inbox ID only |
| `message_opened`   | 未読がある状態で創作者が受信箱を表示 | Inbox ID only |
| `message_archived` | 創作者が反応を整理                   | Inbox ID only |

## Experiment fields

参加者ごとに、検証台帳へ次だけを記録します。プロダクトDBと台帳を公開しません。

- 匿名化した参加者ID
- 既存箱の直前2週間の反応数
- Creator Inboxの2週間の反応数
- 迷惑投稿件数とテスト中止の有無
- 旧URLを外してよいか（yes / no / unsure）
- 任意の改善コメント

## Decision ratios

- Activation: `message_received`が1件以上ある受信箱 / 参加受信箱
- Reaction multiplier: Creator Inbox反応数 / 既存箱の直前2週間反応数
- Migration intent: `yes`の参加者 / 全参加者
- Safety stop rate: 迷惑投稿対応で中止した参加者 / 全参加者

既存箱が0件だった参加者の倍率は算出せず、件数差とactivationへ含めます。中央値の母数、欠測数、0件除外数を結果と一緒に示します。
