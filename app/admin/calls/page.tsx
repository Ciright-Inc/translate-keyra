import { CallsView } from "@/components/admin/calls-view";

export default function AdminCallsPage() {
  return (
    <>
      <h1 className="tr-page-title">Translation Calls</h1>
      <p className="tr-page-sub">
        Call logging, object linking, and initiation — auditable from first click regardless of answer
      </p>
      <CallsView />
    </>
  );
}
