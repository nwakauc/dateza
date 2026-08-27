import { ContentReportDialog } from "../safety/ContentReportDialog.tsx";

type Props = {
  messageId: string;
  name: string;
  onClose: () => void;
};

export function MessageReportDialog({ messageId, name, onClose }: Props) {
  return <ContentReportDialog targetType="message" targetId={messageId} name={name} onClose={onClose} />;
}
