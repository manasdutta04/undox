import { Suspense } from "react";
import { ExposureView } from "@/components/ExposureView";

export default function ExposurePage() {
  return (
    <>
      <div className="page-hero">
        <p className="eyebrow">Session</p>
        <h1 className="page-title">Exposure</h1>
        <p className="page-lede">Risk score and broker statuses for the loaded session.</p>
      </div>
      <Suspense fallback={<p className="empty">Loading…</p>}>
        <ExposureView />
      </Suspense>
    </>
  );
}
