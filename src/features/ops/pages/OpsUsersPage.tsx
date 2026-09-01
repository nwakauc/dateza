import { MemberDirectoryPanel } from "../../hq/components/MemberDirectoryPanel.tsx";
import { MetricCard } from "../../hq/components/HqPrimitives.tsx";

export default function OpsUsersPage() {
  return (
    <div className="ops-stack">
      <MetricCard title="Member directory">
        <p className="hq-card__subtitle" style={{ marginBottom: 12 }}>
          Browse and filter members on this brand. Use exact lookup on a row to open Member 360 with
          full operational detail.
        </p>
        <MemberDirectoryPanel variant="ops" memberBasePath="/ops/users" />
      </MetricCard>
    </div>
  );
}
