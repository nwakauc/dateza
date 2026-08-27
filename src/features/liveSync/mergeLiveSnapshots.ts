import type { ReceivedOpener } from "../../lib/api/openerTypes.ts";
import type { Conversation, Message } from "../../lib/api/socialTypes.ts";

export function mergeNewestMessagePage(current: Message[], newestPage: Message[]): { messages: Message[]; newIds: string[] } {
  const currentIds = new Set(current.map((item) => item.id));
  const newIds = newestPage.filter((item) => !currentIds.has(item.id)).map((item) => item.id);
  const newestIds = new Set(newestPage.map((item) => item.id));
  const older = current.filter((item) => !newestIds.has(item.id));
  return { messages: [...newestPage, ...older], newIds };
}

export function mergeConversationSnapshot(current: Conversation[], newestPage: Conversation[]): Conversation[] {
  const newestIds = new Set(newestPage.map((item) => item.id));
  const rest = current.filter((item) => !newestIds.has(item.id));
  return [...newestPage, ...rest];
}

export function mergeOpenerSnapshot(current: ReceivedOpener[], newestPage: ReceivedOpener[]): ReceivedOpener[] {
  const newestIds = new Set(newestPage.map((item) => item.id));
  const rest = current.filter((item) => !newestIds.has(item.id));
  return [...newestPage, ...rest];
}
