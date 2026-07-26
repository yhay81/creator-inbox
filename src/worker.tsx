import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { requestId } from "hono/request-id";

import type { Bindings } from "./bindings";
import {
  archiveMessage,
  createDatabase,
  createMessage,
  deleteOwnerAccount,
  findInboxByOwner,
  findInboxBySlug,
  listVisibleMessages,
  markUnreadMessagesOpened,
  saveInbox,
} from "./db/queries";
import {
  containsMutedWord,
  getTextField,
  InputError,
  isSameOrigin,
  parseInboxInput,
  parseMessageInput,
} from "./domain/messages";
import { securityHeaders } from "./middleware/security";
import { createAuth } from "./services/auth";
import { verifyTurnstile } from "./services/turnstile";
import {
  AuthPage,
  DashboardPage,
  ErrorPage,
  HomePage,
  PrivacyPage,
  PublicInboxPage,
} from "./ui/pages";

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", requestId());
app.use("*", securityHeaders);
app.use(
  "/api/auth/*",
  bodyLimit({
    maxSize: 16 * 1024,
    onError: (c) => c.json({ message: "入力サイズが大きすぎます。" }, 413),
  }),
);
app.use(
  "/b/:slug/messages",
  bodyLimit({
    maxSize: 16 * 1024,
    onError: (c) => c.text("入力サイズが大きすぎます。", 413),
  }),
);
app.use(
  "/dashboard/*",
  bodyLimit({
    maxSize: 16 * 1024,
    onError: (c) => c.text("入力サイズが大きすぎます。", 413),
  }),
);

app.get("/", (c) => c.html(<HomePage />));
app.get("/privacy", (c) => c.html(<PrivacyPage />));
app.get("/login", (c) =>
  c.html(<AuthPage mode="login" registered={c.req.query("registered") === "1"} />),
);
app.get("/signup", (c) =>
  c.html(<AuthPage mode="signup" turnstileSiteKey={c.env.PUBLIC_TURNSTILE_SITE_KEY} />),
);

app.on(["GET", "POST"], "/api/auth/*", async (c) => {
  if (c.req.method === "POST" && new URL(c.req.url).pathname.endsWith("/sign-up/email")) {
    const clientKey = `${c.req.header("cf-connecting-ip") ?? "unknown"}:signup`;
    const rate = await c.env.SIGNUP_RATE_LIMITER.limit({ key: clientKey });
    if (!rate.success) {
      return c.json({ message: "登録試行が多すぎます。1分ほど待ってください。" }, 429);
    }
  }
  const auth = createAuth(c.env, new URL(c.req.url).origin);
  return auth.handler(c.req.raw);
});

app.get("/b/:slug", async (c) => {
  const database = createDatabase(c.env);
  const inbox = await findInboxBySlug(database, c.req.param("slug"));
  if (!inbox?.active) {
    return c.html(
      <ErrorPage
        message="この受信箱は存在しないか、現在受付を停止しています。"
        title="見つかりません"
      />,
      404,
    );
  }

  c.header("Cache-Control", "private, no-store");
  return c.html(
    <PublicInboxPage
      inbox={inbox}
      sent={c.req.query("sent") === "1"}
      turnstileSiteKey={c.env.PUBLIC_TURNSTILE_SITE_KEY}
    />,
  );
});

app.post("/b/:slug/messages", async (c) => {
  const database = createDatabase(c.env);
  const inbox = await findInboxBySlug(database, c.req.param("slug"));
  if (!inbox?.active) {
    return c.html(
      <ErrorPage
        message="この受信箱は存在しないか、現在受付を停止しています。"
        title="見つかりません"
      />,
      404,
    );
  }

  const formData = await c.req.formData();
  if (getTextField(formData, "website")) {
    return c.redirect(`/b/${inbox.slug}?sent=1`, 303);
  }

  const clientKey = c.req.header("cf-connecting-ip") ?? "unknown";
  const rateLimit = await c.env.RATE_LIMITER.limit({ key: clientKey });
  if (!rateLimit.success) {
    return c.html(
      <PublicInboxPage
        error="短時間の送信上限に達しました。少し時間をおいてください。"
        inbox={inbox}
        turnstileSiteKey={c.env.PUBLIC_TURNSTILE_SITE_KEY}
      />,
      429,
    );
  }

  const verified = await verifyTurnstile(
    c.env,
    getTextField(formData, "cf-turnstile-response"),
    c.get("requestId"),
  );
  if (!verified) {
    return c.html(
      <PublicInboxPage
        error="安全確認を完了できませんでした。もう一度お試しください。"
        inbox={inbox}
        turnstileSiteKey={c.env.PUBLIC_TURNSTILE_SITE_KEY}
      />,
      400,
    );
  }

  try {
    const input = parseMessageInput(formData);
    if (!containsMutedWord(input.body, inbox.mutedWords)) {
      await createMessage(database, inbox.id, input);
    }
    return c.redirect(`/b/${inbox.slug}?sent=1`, 303);
  } catch (error) {
    if (error instanceof InputError) {
      return c.html(
        <PublicInboxPage
          error={error.message}
          inbox={inbox}
          turnstileSiteKey={c.env.PUBLIC_TURNSTILE_SITE_KEY}
        />,
        400,
      );
    }
    throw error;
  }
});

app.get("/dashboard", async (c) => {
  const auth = createAuth(c.env, new URL(c.req.url).origin);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.redirect("/login", 303);
  }

  const database = createDatabase(c.env);
  const inbox = await findInboxByOwner(database, session.user.id);
  const received = inbox ? await listVisibleMessages(database, inbox.id) : [];
  if (inbox) {
    await markUnreadMessagesOpened(database, inbox.id);
  }

  c.header("Cache-Control", "private, no-store");
  return c.html(<DashboardPage inbox={inbox} messages={received} userName={session.user.name} />);
});

app.post("/dashboard/inbox", async (c) => {
  if (!isSameOrigin(c.req.raw)) {
    return c.json({ error: "invalid_origin" }, 403);
  }

  const auth = createAuth(c.env, new URL(c.req.url).origin);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.redirect("/login", 303);
  }

  try {
    const input = parseInboxInput(await c.req.formData());
    await saveInbox(createDatabase(c.env), session.user.id, input);
    return c.redirect("/dashboard", 303);
  } catch (error) {
    if (error instanceof InputError) {
      return c.html(<ErrorPage message={error.message} title="設定を保存できませんでした" />, 400);
    }
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return c.html(
        <ErrorPage
          message="そのURL名はすでに使われています。別の名前を選んでください。"
          title="設定を保存できませんでした"
        />,
        409,
      );
    }
    throw error;
  }
});

app.post("/dashboard/messages/:id/archive", async (c) => {
  if (!isSameOrigin(c.req.raw)) {
    return c.json({ error: "invalid_origin" }, 403);
  }

  const auth = createAuth(c.env, new URL(c.req.url).origin);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.redirect("/login", 303);
  }

  const database = createDatabase(c.env);
  const inbox = await findInboxByOwner(database, session.user.id);
  if (!inbox) {
    return c.redirect("/dashboard", 303);
  }

  await archiveMessage(database, inbox.id, c.req.param("id"));
  return c.redirect("/dashboard", 303);
});

app.post("/dashboard/account/delete", async (c) => {
  if (!isSameOrigin(c.req.raw)) {
    return c.json({ error: "invalid_origin" }, 403);
  }

  const auth = createAuth(c.env, new URL(c.req.url).origin);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.redirect("/login", 303);
  }

  const formData = await c.req.formData();
  if (getTextField(formData, "confirmation") !== "削除する") {
    return c.html(
      <ErrorPage message="確認欄へ「削除する」と入力してください。" title="削除できませんでした" />,
      400,
    );
  }

  await deleteOwnerAccount(createDatabase(c.env), session.user.id);
  const response = c.redirect("/?deleted=1", 303);
  response.headers.append(
    "Set-Cookie",
    "better-auth.session_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
  );
  return response;
});

app.get("/healthz", (c) =>
  c.json({
    healthy: true,
    service: "creator-inbox",
    time: new Date().toISOString(),
  }),
);

app.notFound((c) =>
  c.json(
    {
      error: "not_found",
      requestId: c.get("requestId"),
    },
    404,
  ),
);

app.onError((error, c) => {
  console.error(
    JSON.stringify({
      event: "request_failed",
      message: error.message,
      requestId: c.get("requestId"),
    }),
  );

  return c.json(
    {
      error: "internal_error",
      requestId: c.get("requestId"),
    },
    500,
  );
});

export { app };
export default app;
