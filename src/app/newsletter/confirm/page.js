import { Suspense } from "react";
import ConfirmView from "./ConfirmView";

export const metadata = {
  title: "Confirm your subscription | Morgan Collado",
  robots: { index: false, follow: false },
};

export default function ConfirmPage() {
  // useSearchParams needs a Suspense boundary or the page opts into dynamic
  // rendering, which would break the all-static build.
  return (
    <Suspense fallback={null}>
      <ConfirmView />
    </Suspense>
  );
}
