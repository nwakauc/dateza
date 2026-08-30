import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { formatOperatorRole } from "../../../lib/hq/capabilities.ts";
import {
  createManagedOperator,
  fetchManagedOperators,
  hqErrorMessage,
  updateManagedOperator,
} from "../../../lib/hq/api.ts";
import type { HqManagedOperator, HqOperatorRole } from "../../../lib/hq/types.ts";
import { useHqOperator } from "../../hq/useHqOperator.ts";
import { OpsBanner, OpsEmpty, OpsTable } from "../components/OpsPrimitives.tsx";
import { opsCan } from "../opsCapabilities.ts";

export default function OpsOperatorsPage() {
  const { operator: current } = useHqOperator();
  const canRead = opsCan(current, "admin.operators.read");
  const canManage = opsCan(current, "admin.operators.manage");
  const emailId = useId();
  const roleId = useId();

  const [operators, setOperators] = useState<HqManagedOperator[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "forbidden">("loading");
  const [message, setMessage] = useState<string>();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<HqOperatorRole>("support");
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    if (!canRead) {
      return;
    }
    setStatus("loading");
    try {
      setOperators(await fetchManagedOperators());
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setMessage(hqErrorMessage(error));
    }
  }, [canRead]);

  useEffect(() => {
    if (!canRead) {
      return;
    }
    let cancelled = false;
    void fetchManagedOperators()
      .then((rows) => {
        if (!cancelled) {
          setOperators(rows);
          setStatus("ready");
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setStatus("error");
          setMessage(hqErrorMessage(error));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [canRead]);

  if (!canRead) {
    return <OpsBanner tone="forbidden" title="Forbidden" body="You cannot view operators for this brand." />;
  }

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!canManage) return;
    setPending(true);
    setMessage(undefined);
    try {
      await createManagedOperator({ email: email.trim(), role });
      setEmail("");
      await load();
    } catch (error) {
      setMessage(hqErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  async function revokeOperator(target: HqManagedOperator) {
    if (!canManage || !current) return;
    if (target.admin_user_id === current.admin_user_id) {
      setMessage("You cannot change your own assignment.");
      return;
    }
    setPending(true);
    setMessage(undefined);
    try {
      await updateManagedOperator(target.admin_user_id, { status: "revoked" });
      await load();
    } catch (error) {
      setMessage(hqErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  if (status === "forbidden") {
    return <OpsBanner tone="forbidden" title="Forbidden" body="Operator management is not available for your role." />;
  }

  if (status === "loading") return <p className="ops-muted">Loading operators…</p>;

  if (status === "error") {
    return (
      <OpsBanner
        tone="error"
        title="Could not load operators"
        body={message ?? ""}
        action={
          <button type="button" className="ops-btn" onClick={() => void load()}>
            Retry
          </button>
        }
      />
    );
  }

  const grantable = current?.grantable_roles ?? [];

  return (
    <div>
      {message ? <OpsBanner tone="error" title="Operator action failed" body={message} /> : null}

      {canManage && grantable.length > 0 ? (
        <section className="ops-card" style={{ marginBottom: 16 }}>
          <h3>Assign operator</h3>
          <form onSubmit={(event) => void onCreate(event)}>
            <label className="ops-field" htmlFor={emailId}>
              Email
              <input
                id={emailId}
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="ops-field" htmlFor={roleId}>
              Role
              <select id={roleId} value={role} onChange={(event) => setRole(event.target.value as HqOperatorRole)}>
                {grantable.map((item) => (
                  <option key={item} value={item}>
                    {formatOperatorRole(item)}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="ops-btn ops-btn--primary" disabled={pending}>
              {pending ? "Saving…" : "Assign"}
            </button>
          </form>
        </section>
      ) : null}

      <section className="ops-card">
        <h3>Current brand operators</h3>
        {operators.length === 0 ? (
          <OpsEmpty title="No operators" body="No operator assignments are active on this brand." />
        ) : (
          <OpsTable
            columns={[
              { key: "user", header: "User" },
              { key: "role", header: "Role" },
              { key: "status", header: "Assignment" },
              { key: "mfa", header: "MFA" },
              { key: "actions", header: "Actions" },
            ]}
            rows={operators.map((row) => ({
              user: row.user_id,
              role: formatOperatorRole(row.role),
              status: row.assignment_status,
              mfa: row.mfa_enrolled ? "Enrolled" : "Not enrolled",
              actions:
                canManage && current && row.admin_user_id !== current.admin_user_id ? (
                  <button
                    type="button"
                    className="ops-btn ops-btn--danger"
                    disabled={pending || row.assignment_status === "revoked"}
                    onClick={() => void revokeOperator(row)}
                  >
                    Revoke
                  </button>
                ) : (
                  "—"
                ),
            }))}
            empty="No operators."
          />
        )}
      </section>
    </div>
  );
}
