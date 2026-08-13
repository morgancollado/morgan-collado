import { Suspense } from "react";
import ManageView from "./ManageView";

export const metadata = {
  title: "Your subscription | Morgan Collado",
  robots: { index: false, follow: false },
};

export default function ManagePage() {
  return (
    <Suspense fallback={null}>
      <ManageView />
    </Suspense>
  );
}
