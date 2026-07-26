import { describe, expect, it } from "vitest";

import {
  containsMutedWord,
  InputError,
  isSameOrigin,
  parseInboxInput,
  parseMessageInput,
} from "../src/domain/messages";

describe("message input", () => {
  it("accepts an allowed one-tap emoji", () => {
    const formData = new FormData();
    formData.set("emoji", "✨");

    expect(parseMessageInput(formData)).toEqual({ body: "✨", kind: "emoji" });
  });

  it("accepts a categorized text message", () => {
    const formData = new FormData();
    formData.set("kind", "feedback");
    formData.set("body", "新作の色づかいが好きです。");

    expect(parseMessageInput(formData)).toEqual({
      body: "新作の色づかいが好きです。",
      kind: "feedback",
    });
  });

  it("rejects unsupported emoji and empty text", () => {
    const formData = new FormData();
    formData.set("emoji", "💣");
    formData.set("kind", "feedback");

    expect(() => parseMessageInput(formData)).toThrow(InputError);
  });
});

describe("inbox settings", () => {
  it("normalizes the public slug", () => {
    const formData = new FormData();
    formData.set("displayName", "海辺");
    formData.set("slug", " Umibe-Art ");
    formData.set("intro", "感想をお待ちしています。");
    formData.set("mutedWords", "spam");
    formData.set("active", "on");

    expect(parseInboxInput(formData)).toMatchObject({
      active: true,
      slug: "umibe-art",
    });
  });

  it("rejects an unsafe public slug", () => {
    const formData = new FormData();
    formData.set("displayName", "海辺");
    formData.set("slug", "../admin");

    expect(() => parseInboxInput(formData)).toThrow(InputError);
  });
});

describe("abuse controls", () => {
  it("matches muted words case-insensitively and ignores blank lines", () => {
    expect(containsMutedWord("This is SPAM.", "\nspam\n")).toBe(true);
    expect(containsMutedWord("丁寧な感想です", "\nspam\n")).toBe(false);
  });

  it("requires a same-origin Origin or Referer for owner writes", () => {
    const sameOrigin = new Request("https://example.test/dashboard/inbox", {
      headers: { origin: "https://example.test" },
      method: "POST",
    });
    const crossOrigin = new Request("https://example.test/dashboard/inbox", {
      headers: { origin: "https://attacker.test" },
      method: "POST",
    });
    const missingOrigin = new Request("https://example.test/dashboard/inbox", {
      method: "POST",
    });

    expect(isSameOrigin(sameOrigin)).toBe(true);
    expect(isSameOrigin(crossOrigin)).toBe(false);
    expect(isSameOrigin(missingOrigin)).toBe(false);
  });
});
