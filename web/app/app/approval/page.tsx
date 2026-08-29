import { Suspense } from "react";
import { ApprovalView } from "@/components/ApprovalView";

export default function ApprovalPage() {
  return (
    <>
      <div className="page-hero">
        <p className="eyebrow">Gate</p>
        <h1 className="page-title">Approval</h1>
        <p className="page-lede">
          Read-only preview of the exact PII and form fields TrueForge shows before Allow on submit.
        </p>
      </div>
      <Suspense fallback={<p className="empty">Loading…</p>}>
        <ApprovalView />
      </Suspense>
    </>
  );
}
