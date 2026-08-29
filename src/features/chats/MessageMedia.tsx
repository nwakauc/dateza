import { useEffect, useId, useRef, useState } from "react";
import type { ChatMediaDelivery, MessageAttachment } from "../../lib/api/chatMediaTypes.ts";
import type { Message } from "../../lib/api/socialTypes.ts";
import { Modal } from "../verification/Modal.tsx";
import { CloseIcon, DownloadIcon, MoreIcon } from "../shell/icons.tsx";
import { MessageReportDialog } from "./MessageReportDialog.tsx";

type Props = {
  message: Message;
  counterpartName: string;
  canDelete: boolean;
  canReport: boolean;
  canReply?: boolean;
  actionsOpen?: boolean;
  onActionsOpenChange?: (open: boolean) => void;
  onReply?: (message: Message) => void;
  onDelete?: (messageId: string, attachmentId: string) => void;
  deletingAttachmentId?: string;
};

async function saveDelivery(delivery: ChatMediaDelivery): Promise<void> {
  try {
    const response = await fetch(delivery.url, { credentials: "omit", mode: "cors" });
    if (!response.ok) throw new Error("download_failed");
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = delivery.filename || "media";
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2_000);
  } catch {
    window.open(delivery.url, "_blank", "noopener,noreferrer");
  }
}

async function copyMessageText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
}

function attachmentLabel(attachment: MessageAttachment): string {
  return attachment.media_kind === "video" ? "Video" : "Photo";
}

export function MessageMedia({
  message,
  counterpartName,
  canDelete,
  canReport,
  canReply,
  actionsOpen,
  onActionsOpenChange,
  onReply,
  onDelete,
  deletingAttachmentId,
}: Props) {
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const [lightbox, setLightbox] = useState<MessageAttachment>();
  const [reporting, setReporting] = useState(false);
  const menuOpen = actionsOpen ?? internalOpen;
  const kept = message.attachments.filter((item) => !item.deleted);
  const removable = kept[0];
  const canCopy = message.body.trim().length > 0;
  const showDelete = canDelete && Boolean(removable);
  const hasActions = Boolean((canReply && onReply) || canCopy || showDelete || canReport);

  function setMenuOpen(next: boolean) {
    onActionsOpenChange?.(next);
    if (actionsOpen === undefined) setInternalOpen(next);
  }

  useEffect(() => {
    if (!menuOpen) return;
    function onPointer(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onActionsOpenChange?.(false);
        if (actionsOpen === undefined) setInternalOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [actionsOpen, menuOpen, onActionsOpenChange]);

  return (
    <>
      {message.attachments.map((attachment) => (
        <AttachmentBlock
          key={attachment.id}
          attachment={attachment}
          onOpen={() => {
            if (attachment.media_kind === "image" && attachment.display && !attachment.deleted) {
              setLightbox(attachment);
            }
          }}
        />
      ))}
      {message.body.trim() ? <p>{message.body}</p> : null}
      {hasActions ? (
        <div
          className="message-bubble__actions"
          ref={menuRef}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="message-bubble__more"
            aria-label="Message actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <MoreIcon />
          </button>
          {menuOpen ? (
            <div className="message-bubble__menu" id={menuId} role="menu">
              {canReply && onReply ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onReply(message);
                  }}
                >
                  Reply
                </button>
              ) : null}
              {canCopy ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    void copyMessageText(message.body.trim()).then(() => setMenuOpen(false));
                  }}
                >
                  Copy
                </button>
              ) : null}
              {showDelete && onDelete && removable ? (
                <button
                  type="button"
                  role="menuitem"
                  disabled={deletingAttachmentId === removable.id}
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(message.id, removable.id);
                  }}
                >
                  {deletingAttachmentId === removable.id ? "Deleting…" : "Delete"}
                </button>
              ) : null}
              {canReport ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setReporting(true);
                  }}
                >
                  Report
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {lightbox?.display ? (
        <Modal
          ariaLabel="Photo"
          onClose={() => setLightbox(undefined)}
          hideCloseButton
          backdropClassName="message-lightbox-backdrop"
          panelClassName="message-lightbox"
        >
          <button type="button" className="message-lightbox__close" aria-label="Close photo" onClick={() => setLightbox(undefined)}>
            <CloseIcon />
          </button>
          <img src={lightbox.display.url} alt="" />
          {lightbox.download || lightbox.display ? (
            <button
              type="button"
              className="message-lightbox__save"
              onClick={() => void saveDelivery(lightbox.download ?? lightbox.display!)}
            >
              <DownloadIcon />
              Save photo
            </button>
          ) : null}
        </Modal>
      ) : null}
      {reporting ? (
        <MessageReportDialog messageId={message.id} name={counterpartName} onClose={() => setReporting(false)} />
      ) : null}
    </>
  );
}

function AttachmentBlock({
  attachment,
  onOpen,
}: {
  attachment: MessageAttachment;
  onOpen: () => void;
}) {
  const label = attachmentLabel(attachment);
  if (attachment.deleted) {
    return <p className="message-media__status">{label} removed</p>;
  }
  if (attachment.processing_state === "failed") {
    return <p className="message-media__status">{label} couldn’t be shown</p>;
  }
  if (attachment.processing_state !== "ready" || !attachment.display) {
    return (
      <p className="message-media__status" aria-busy="true">
        {attachment.media_kind === "video" ? "Preparing video…" : "Preparing photo…"}
      </p>
    );
  }
  if (attachment.media_kind === "video") {
    return (
      <video
        className="message-media__video"
        controls
        playsInline
        preload="metadata"
        poster={attachment.poster?.url}
        src={attachment.display.url}
      >
        Your browser can’t play this video.
      </video>
    );
  }
  return (
    <button type="button" className="message-media__photo" onClick={onOpen}>
      <img src={attachment.display.url} alt="" />
      <span className="sr-only">Open photo</span>
    </button>
  );
}
