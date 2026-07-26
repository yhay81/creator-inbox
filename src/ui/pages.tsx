import type { Inbox, Message } from "../db/schema";
import { EMOJI_CHOICES } from "../domain/messages";
import { product } from "../config/product";
import { Layout } from "./layout";

const kindLabels = {
  emoji: "絵文字",
  feedback: "感想",
  prompt: "お題",
  question: "質問",
} as const;

type NoticeProps = {
  children: string;
  tone?: "error" | "success";
};

function Notice({ children, tone = "error" }: NoticeProps) {
  return (
    <p aria-live="polite" class={`notice ${tone}`} role={tone === "error" ? "alert" : "status"}>
      {children}
    </p>
  );
}

export function HomePage() {
  return (
    <Layout>
      <section class="hero">
        <p class="eyebrow">FOR JAPANESE CREATORS</p>
        <h1>感想も、お題も、質問も。送りやすいひとつの箱へ。</h1>
        <p class="lead">
          匿名の一言や絵文字から、長文の感想まで。送る人が迷わず、創作者が安心して受け取れる小さな受信箱です。
        </p>
        <div class="actions">
          <a class="button primary" href="/signup">
            パイロットに参加
          </a>
          <a class="button secondary" href="#experiment">
            検証条件を見る
          </a>
        </div>
      </section>
      <section class="feature-grid" aria-label="特徴">
        <article>
          <span aria-hidden="true">01</span>
          <h2>種類を先に選ぶ</h2>
          <p>「お題箱だから感想は違うかも」という迷いを、感想・お題・質問の入口でなくします。</p>
        </article>
        <article>
          <span aria-hidden="true">02</span>
          <h2>絵文字だけでも届く</h2>
          <p>文章を考える余裕がない人も、ワンタップで応援を送れます。</p>
        </article>
        <article>
          <span aria-hidden="true">03</span>
          <h2>送信者を追跡しない</h2>
          <p>本文と種類だけを保存。アプリのデータベースに送信者のIPや識別子を残しません。</p>
        </article>
      </section>
      <section class="panel" id="experiment">
        <p class="eyebrow">PUBLIC EXPERIMENT</p>
        <h2>成功条件を先に公開します。</h2>
        <dl class="metrics">
          <div>
            <dt>対象</dt>
            <dd>既存の匿名箱を使う日本語創作者20人</dd>
          </div>
          <div>
            <dt>期間</dt>
            <dd>既存URLと2週間併用、{product.experiment.deadline}で判断</dd>
          </div>
          <div>
            <dt>成功条件</dt>
            <dd>{product.experiment.success}</dd>
          </div>
        </dl>
      </section>
    </Layout>
  );
}

type PublicInboxPageProps = {
  error?: string;
  inbox: Inbox;
  sent?: boolean;
  turnstileSiteKey: string | undefined;
};

export function PublicInboxPage({
  error,
  inbox,
  sent = false,
  turnstileSiteKey,
}: PublicInboxPageProps) {
  const scripts = turnstileSiteKey ? ["https://challenges.cloudflare.com/turnstile/v0/api.js"] : [];

  return (
    <Layout
      description={`${inbox.displayName}さんへ匿名で感想・お題・質問を送れます。`}
      scripts={scripts}
      title={`${inbox.displayName}さんの受信箱 | ${product.name}`}
    >
      <section class="inbox-intro">
        <p class="eyebrow">CREATOR INBOX</p>
        <h1>{inbox.displayName}さんへ届ける</h1>
        {inbox.intro && <p class="lead preserve-lines">{inbox.intro}</p>}
      </section>
      {sent && <Notice tone="success">届きました。送ってくれてありがとうございます。</Notice>}
      {error && <Notice>{error}</Notice>}
      <section class="composer">
        <div>
          <p class="eyebrow">ONE TAP</p>
          <h2>まずは絵文字だけ</h2>
          <p>名前やアカウント情報は必要ありません。</p>
          <form action={`/b/${inbox.slug}/messages`} method="post">
            <input
              aria-hidden="true"
              autocomplete="off"
              class="honeypot"
              name="website"
              tabindex={-1}
              type="text"
            />
            <div class="emoji-grid">
              {EMOJI_CHOICES.map((emoji) => (
                <button aria-label={`${emoji}を送る`} name="emoji" type="submit" value={emoji}>
                  {emoji}
                </button>
              ))}
            </div>
            {turnstileSiteKey && <div class="cf-turnstile" data-sitekey={turnstileSiteKey}></div>}
          </form>
        </div>
        <div>
          <p class="eyebrow">MESSAGE</p>
          <h2>言葉で届ける</h2>
          <form action={`/b/${inbox.slug}/messages`} class="stack" method="post">
            <input
              aria-hidden="true"
              autocomplete="off"
              class="honeypot"
              name="website"
              tabindex={-1}
              type="text"
            />
            <fieldset>
              <legend>どんなメッセージですか？</legend>
              <div class="choice-grid">
                <label>
                  <input checked name="kind" type="radio" value="feedback" />
                  感想
                </label>
                <label>
                  <input name="kind" type="radio" value="prompt" />
                  お題
                </label>
                <label>
                  <input name="kind" type="radio" value="question" />
                  質問
                </label>
              </div>
            </fieldset>
            <label>
              メッセージ
              <textarea
                maxlength={2000}
                name="body"
                placeholder="よかったところ、見てみたいもの、聞いてみたいこと…"
                required
                rows={8}
              ></textarea>
            </label>
            {turnstileSiteKey && <div class="cf-turnstile" data-sitekey={turnstileSiteKey}></div>}
            <button class="button primary" type="submit">
              匿名で送る
            </button>
            <p class="form-help">
              送信者のIPや識別子は保存しません。迷惑行為の防止には短時間のレート制限とTurnstileを使います。
            </p>
          </form>
        </div>
      </section>
    </Layout>
  );
}

type AuthPageProps = {
  mode: "login" | "signup";
  registered?: boolean;
};

export function AuthPage({ mode, registered = false }: AuthPageProps) {
  const signup = mode === "signup";
  return (
    <Layout scripts={["/app.js"]} title={`${signup ? "参加登録" : "ログイン"} | ${product.name}`}>
      <section class="auth-card">
        <p class="eyebrow">{signup ? "PILOT ACCESS" : "WELCOME BACK"}</p>
        <h1>{signup ? "自分の受信箱をつくる" : "受信箱をひらく"}</h1>
        <p>
          {signup
            ? "現在は20人の招待制パイロットです。"
            : "登録したメールアドレスでログインします。"}
        </p>
        {registered && <Notice tone="success">登録できました。続けてログインしてください。</Notice>}
        <form class="stack" data-auth-form={mode}>
          {signup && (
            <label>
              表示名
              <input autocomplete="name" maxlength={50} name="name" required type="text" />
            </label>
          )}
          <label>
            メールアドレス
            <input autocomplete="email" name="email" required type="email" />
          </label>
          <label>
            パスワード
            <input
              autocomplete={signup ? "new-password" : "current-password"}
              minlength={12}
              name="password"
              required
              type="password"
            />
            {signup && <small>12文字以上。ほかのサービスと同じものは使わないでください。</small>}
          </label>
          {signup && (
            <label>
              招待コード
              <input autocomplete="off" name="inviteCode" required type="text" />
            </label>
          )}
          <p aria-live="polite" class="notice hidden" data-auth-status role="status"></p>
          <button class="button primary" type="submit">
            {signup ? "登録する" : "ログイン"}
          </button>
        </form>
        <p>
          {signup ? (
            <a href="/login">すでに登録済みの方</a>
          ) : (
            <a href="/signup">招待コードをお持ちの方</a>
          )}
        </p>
      </section>
    </Layout>
  );
}

type DashboardPageProps = {
  inbox: Inbox | undefined;
  messages: Message[];
  userName: string;
};

export function DashboardPage({ inbox, messages, userName }: DashboardPageProps) {
  const counts = messages.reduce(
    (result, message) => {
      result[message.kind] += 1;
      return result;
    },
    { emoji: 0, feedback: 0, prompt: 0, question: 0 },
  );

  return (
    <Layout scripts={["/app.js"]} title={`受信箱 | ${product.name}`}>
      <section class="dashboard-head">
        <div>
          <p class="eyebrow">DASHBOARD</p>
          <h1>{userName}さんの受信箱</h1>
        </div>
        <button class="button secondary" data-sign-out type="button">
          ログアウト
        </button>
      </section>
      <section class="dashboard-grid">
        <aside class="settings-card">
          <h2>{inbox ? "受信箱の設定" : "公開URLをつくる"}</h2>
          <form action="/dashboard/inbox" class="stack" method="post">
            <label>
              表示名
              <input
                maxlength={50}
                name="displayName"
                required
                type="text"
                value={inbox?.displayName ?? userName}
              />
            </label>
            <label>
              URL名
              <span class="input-prefix">
                <span>/b/</span>
                <input
                  autocomplete="off"
                  maxlength={32}
                  minlength={3}
                  name="slug"
                  pattern="[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?"
                  required
                  type="text"
                  value={inbox?.slug ?? ""}
                />
              </span>
            </label>
            <label>
              紹介文
              <textarea maxlength={300} name="intro" rows={4}>
                {inbox?.intro ?? ""}
              </textarea>
            </label>
            <label>
              ミュートワード（1行に1つ）
              <textarea maxlength={500} name="mutedWords" rows={4}>
                {inbox?.mutedWords ?? ""}
              </textarea>
              <small>一致した投稿は保存せず、送信者には通常の完了画面を表示します。</small>
            </label>
            <label class="check-row">
              <input checked={inbox?.active ?? true} name="active" type="checkbox" />
              匿名投稿を受け付ける
            </label>
            <button class="button primary" type="submit">
              {inbox ? "設定を保存" : "受信箱を公開"}
            </button>
          </form>
          {inbox && (
            <div class="share-box">
              <p>公開URL</p>
              <a href={`/b/${inbox.slug}`}>/b/{inbox.slug}</a>
            </div>
          )}
          <details class="danger-zone">
            <summary>アカウントとデータを削除</summary>
            <p>受信箱、届いた投稿、認証情報を完全に削除します。この操作は取り消せません。</p>
            <form action="/dashboard/account/delete" class="stack" method="post">
              <label>
                確認のため「削除する」と入力
                <input
                  autocomplete="off"
                  name="confirmation"
                  pattern="削除する"
                  required
                  type="text"
                />
              </label>
              <button class="button danger" type="submit">
                完全に削除する
              </button>
            </form>
          </details>
        </aside>
        <div class="message-column">
          <dl class="summary-grid">
            {Object.entries(counts).map(([kind, count]) => (
              <div>
                <dt>{kindLabels[kind as keyof typeof kindLabels]}</dt>
                <dd>{count}</dd>
              </div>
            ))}
          </dl>
          <div class="section-heading">
            <div>
              <p class="eyebrow">LATEST 100</p>
              <h2>届いたもの</h2>
            </div>
            <span>{messages.length}件</span>
          </div>
          {!inbox && <Notice>まず公開URLを作成してください。</Notice>}
          {inbox && messages.length === 0 && (
            <div class="empty-state">
              <p>まだ届いていません。</p>
              <p>公開URLをプロフィールや固定ポストで案内してみましょう。</p>
            </div>
          )}
          <div class="message-list">
            {messages.map((message) => (
              <article class={`message-card ${message.status}`}>
                <header>
                  <span class="kind">{kindLabels[message.kind]}</span>
                  <time datetime={message.createdAt.toISOString()}>
                    {formatDate(message.createdAt)}
                  </time>
                </header>
                <p class={message.kind === "emoji" ? "emoji-message" : "preserve-lines"}>
                  {message.body}
                </p>
                <form action={`/dashboard/messages/${message.id}/archive`} method="post">
                  <button class="text-button" type="submit">
                    アーカイブ
                  </button>
                </form>
              </article>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

export function PrivacyPage() {
  return (
    <Layout title={`プライバシー | ${product.name}`}>
      <article class="prose">
        <p class="eyebrow">PRIVACY</p>
        <h1>必要なデータだけを扱います。</h1>
        <h2>保存するもの</h2>
        <p>
          受信箱の所有者について、表示名、メールアドレス、認証情報、受信箱設定を保存します。匿名投稿では、選ばれた種類と本文、送信日時を保存します。
        </p>
        <h2>保存しないもの</h2>
        <p>
          アプリのデータベースには匿名送信者のIPアドレス、Cookie識別子、ブラウザ識別子を保存しません。投稿本文を学習用データとして販売しません。
        </p>
        <h2>安全性と削除</h2>
        <p>
          濫用防止のためCloudflareによる短時間のレート制限とTurnstileを使います。受信者は投稿をアーカイブでき、ログイン後の設定からアカウントと関連データを即時削除できます。
        </p>
        <h2>検証データ</h2>
        <p>
          検証結果は人数や比率に集計して公開し、メールアドレスや投稿本文など、個人を推測できる情報は公開しません。
        </p>
      </article>
    </Layout>
  );
}

export function ErrorPage({ message, title }: { message: string; title: string }) {
  return (
    <Layout title={`${title} | ${product.name}`}>
      <section class="auth-card">
        <p class="eyebrow">NOTICE</p>
        <h1>{title}</h1>
        <p>{message}</p>
        <a class="button secondary" href="/">
          トップへ戻る
        </a>
      </section>
    </Layout>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo",
  }).format(date);
}
