import { Suspense } from "react";
import UnsubscribeView from "./UnsubscribeView";

export const metadata = {
  title: "Unsubscribe | Morgan Collado",
  robots: { index: false, follow: false },
};

export default function UnsubscribePage() {
  return (
    <Suspense fallback={null}>
      <UnsubscribeView />
    </Suspense>
  );
}
