import { Suspense } from "react";
import { BrokersView } from "@/components/BrokersView";

export default function BrokersPage() {
  return (
    <>
      <div className="page-hero">
        <p className="eyebrow">Fixtures</p>
        <h1 className="page-title">Brokers</h1>
        <p className="page-lede">Fixture listings and opt-out pages for each broker in the session.</p>
      </div>
      <Suspense fallback={<p className="empty">Loading…</p>}>
        <BrokersView />
      </Suspense>
    </>
  );
}
