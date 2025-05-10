"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function PaymentSuccess() {
  const [status, setStatus] = useState("loading");
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      router.push("/");
      return;
    }

    setStatus("success");
  }, [sessionId, router]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
        <div className="w-16 h-16 border-4 border-t-black border-r-gray-200 border-b-gray-200 border-l-gray-200 rounded-full animate-spin"></div>
        <h2 className="mt-6 text-xl font-medium">Confirming your payment...</h2>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="w-16 h-16 flex items-center justify-center bg-red-100 rounded-full">
          <span className="text-2xl">❌</span>
        </div>
        <h2 className="mt-6 text-2xl font-bold">Payment Verification Failed</h2>
        <p className="mt-2 text-gray-600">
          There was an issue confirming your payment.
        </p>
        <Link href="/upgrade" className="mt-6 px-4 py-2 bg-black text-white">
          Try Again
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <div className="w-16 h-16 flex items-center justify-center bg-green-100 rounded-full">
        <span className="text-2xl">✅</span>
      </div>
      <h2 className="mt-6 text-2xl font-bold">Payment Successful!</h2>
      <p className="mt-2 text-gray-600">
        Thank you for upgrading to Plus! Your account has been upgraded.
      </p>
      <Link href="/dashboard" className="mt-6 px-4 py-2 bg-black text-white">
        Go to Dashboard
      </Link>
    </div>
  );
}
