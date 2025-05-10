import PaymentSuccess from "@/components/success";
import { Suspense } from "react";

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccess />
    </Suspense>
  );
}
