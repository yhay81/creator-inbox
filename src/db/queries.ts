import { and, desc, eq, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import type { Bindings } from "../bindings";
import type { InboxInput, MessageInput } from "../domain/messages";
import { events, inboxes, messages, schema, user } from "./schema";

export function createDatabase(env: Bindings) {
  return drizzle(env.DB, { schema });
}

export type Database = ReturnType<typeof createDatabase>;

export async function findInboxBySlug(database: Database, slug: string) {
  return database.select().from(inboxes).where(eq(inboxes.slug, slug)).get();
}

export async function findInboxByOwner(database: Database, ownerUserId: string) {
  return database.select().from(inboxes).where(eq(inboxes.ownerUserId, ownerUserId)).get();
}

export async function saveInbox(database: Database, ownerUserId: string, input: InboxInput) {
  const existing = await findInboxByOwner(database, ownerUserId);
  const now = new Date();

  if (existing) {
    await database
      .update(inboxes)
      .set({
        active: input.active,
        displayName: input.displayName,
        intro: input.intro,
        mutedWords: input.mutedWords,
        slug: input.slug,
        updatedAt: now,
      })
      .where(eq(inboxes.id, existing.id));
    return { ...existing, ...input, updatedAt: now };
  }

  const inbox = {
    active: input.active,
    createdAt: now,
    displayName: input.displayName,
    id: crypto.randomUUID(),
    intro: input.intro,
    mutedWords: input.mutedWords,
    ownerUserId,
    slug: input.slug,
    updatedAt: now,
  };
  await database.insert(inboxes).values(inbox);
  await recordEvent(database, "inbox_created", inbox.id);
  return inbox;
}

export async function createMessage(database: Database, inboxId: string, input: MessageInput) {
  const now = new Date();
  await database.insert(messages).values({
    body: input.body,
    createdAt: now,
    id: crypto.randomUUID(),
    inboxId,
    kind: input.kind,
    status: "unread",
    updatedAt: now,
  });
  await recordEvent(database, "message_received", inboxId);
}

export async function listVisibleMessages(database: Database, inboxId: string) {
  return database
    .select()
    .from(messages)
    .where(and(eq(messages.inboxId, inboxId), ne(messages.status, "archived")))
    .orderBy(desc(messages.createdAt))
    .limit(100)
    .all();
}

export async function markUnreadMessagesOpened(database: Database, inboxId: string) {
  const unread = await database
    .select({ id: messages.id })
    .from(messages)
    .where(and(eq(messages.inboxId, inboxId), eq(messages.status, "unread")))
    .all();

  if (unread.length === 0) {
    return;
  }

  await database
    .update(messages)
    .set({ status: "read", updatedAt: new Date() })
    .where(and(eq(messages.inboxId, inboxId), eq(messages.status, "unread")));
  await recordEvent(database, "message_opened", inboxId);
}

export async function archiveMessage(database: Database, inboxId: string, messageId: string) {
  const result = await database
    .update(messages)
    .set({ status: "archived", updatedAt: new Date() })
    .where(and(eq(messages.id, messageId), eq(messages.inboxId, inboxId)))
    .returning({ id: messages.id })
    .get();

  if (result) {
    await recordEvent(database, "message_archived", inboxId);
  }
  return Boolean(result);
}

export async function deleteOwnerAccount(database: Database, ownerUserId: string) {
  await database.delete(user).where(eq(user.id, ownerUserId));
}

async function recordEvent(
  database: Database,
  name: "inbox_created" | "message_received" | "message_opened" | "message_archived",
  inboxId: string,
) {
  const now = new Date();
  await database.insert(events).values({
    createdAt: now,
    id: crypto.randomUUID(),
    inboxId,
    name,
    occurredOn: now.toISOString().slice(0, 10),
  });
}
