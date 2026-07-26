export const MESSAGE_KINDS = ["emoji", "feedback", "prompt", "question"] as const;
export const EMOJI_CHOICES = ["❤️", "👏", "✨", "🙏"] as const;

export type MessageKind = (typeof MESSAGE_KINDS)[number];

export type MessageInput =
  | { kind: "emoji"; body: (typeof EMOJI_CHOICES)[number] }
  | { kind: Exclude<MessageKind, "emoji">; body: string };

export type InboxInput = {
  active: boolean;
  displayName: string;
  intro: string;
  mutedWords: string;
  slug: string;
};

const slugPattern = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/;

export function parseInboxInput(formData: FormData): InboxInput {
  const active = getTextField(formData, "active") === "on";
  const displayName = getTextField(formData, "displayName").trim();
  const intro = getTextField(formData, "intro").trim();
  const mutedWords = getTextField(formData, "mutedWords").trim();
  const slug = getTextField(formData, "slug").trim().toLowerCase();

  if (displayName.length < 1 || displayName.length > 50) {
    throw new InputError("表示名は1〜50文字で入力してください。");
  }
  if (!slugPattern.test(slug)) {
    throw new InputError("URL名は英小文字・数字・ハイフンの3〜32文字で入力してください。");
  }
  if (intro.length > 300) {
    throw new InputError("紹介文は300文字以内で入力してください。");
  }
  if (mutedWords.length > 500) {
    throw new InputError("ミュートワードは合計500文字以内で入力してください。");
  }

  return { active, displayName, intro, mutedWords, slug };
}

export function parseMessageInput(formData: FormData): MessageInput {
  const emoji = getTextField(formData, "emoji");
  if (isEmojiChoice(emoji)) {
    return { body: emoji, kind: "emoji" };
  }

  const kind = getTextField(formData, "kind");
  const body = getTextField(formData, "body").trim();
  if (!isTextMessageKind(kind)) {
    throw new InputError("メッセージの種類を選んでください。");
  }
  if (body.length < 1 || body.length > 2000) {
    throw new InputError("メッセージは1〜2,000文字で入力してください。");
  }

  return { body, kind };
}

export function containsMutedWord(body: string, mutedWords: string): boolean {
  const normalized = body.toLocaleLowerCase("ja-JP");
  return mutedWords
    .split(/\r?\n/u)
    .map((word) => word.trim().toLocaleLowerCase("ja-JP"))
    .filter(Boolean)
    .some((word) => normalized.includes(word));
}

export function getTextField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function isSameOrigin(request: Request): boolean {
  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin) {
    return origin === expectedOrigin;
  }

  const referer = request.headers.get("referer");
  return referer ? new URL(referer).origin === expectedOrigin : false;
}

export class InputError extends Error {}

function isEmojiChoice(value: string): value is (typeof EMOJI_CHOICES)[number] {
  return EMOJI_CHOICES.some((emoji) => emoji === value);
}

function isTextMessageKind(value: string): value is Exclude<MessageKind, "emoji"> {
  return value === "feedback" || value === "prompt" || value === "question";
}
