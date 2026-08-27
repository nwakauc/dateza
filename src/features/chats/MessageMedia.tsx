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

function attachmentLabel(attachment: MessageAttachment): string {
  return attachment.media_kind === "video" ? "Video" : "Photo";
}

export function MessageMedia({
  message,
  counterpartName,
  canDelete,
  canReport,
  canReply,
  onReply,
  onDelete,
  deletingAttachmentId,
}: Props) {
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightbox, setLightbox] = useState<MessageAttachment>();
  const [reporting, setReporting] = useState(false);
  const kept = message.attachments.filter((item) => !item.deleted);
  const downloadable = kept.find((item) => item.download)?.download ?? kept.find((item) => item.display)?.display;
  const canDownload = Boolean(downloadable);
  const removable = kept[0];
  const showDelete = canDelete && Boolean(removable);
  const showMenu = Boolean(canReply) || canDownload || showDelete || canReport;

  useEffect(() => {
    if (!menuOpen) return;
    function onPointer(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [menuOpen]);

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
      {showMenu ? (
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
            onClick={() => setMenuOpen((current) => !current)}
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
              {canDownload && downloadable ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    void saveDelivery(downloadable);
                  }}
                >
                  Save
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
                  {deletingAttachmentId === removable.id ? "Removing…" : "Remove"}
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
