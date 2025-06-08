import React, { forwardRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { IoSparkles } from "react-icons/io5";
import { PiSpinnerBold } from "react-icons/pi";
import axios from "axios";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";

interface PricingProps {
  selectedPlan: "monthly" | "yearly";
  setSelectedPlan: (plan: "monthly" | "yearly") => void;
}

const Pricing = forwardRef<HTMLElement, PricingProps>(
  ({ selectedPlan, setSelectedPlan }, ref) => {
    const [loading, setLoading] = useState(false);

    const { data: session } = useSession();

    useEffect(() => {
      if (session) {
        const storedPlan = localStorage.getItem("selectedPlan");
        if (storedPlan) {
          setSelectedPlan(storedPlan as "monthly" | "yearly");
          localStorage.removeItem("selectedPlan");
          handleUpgrade();
        }
      }
    }, [session]);

    const handleUpgrade = async () => {
      try {
        setLoading(true);

        if (!session) {
          localStorage.setItem("selectedPlan", selectedPlan);
          await signIn("google", {
            callbackUrl: `/?plan=${selectedPlan}#pricing`,
            redirect: true,
          });
          return;
        }

        const response = await axios.post("/api/createCheckoutSession", {
          plan: selectedPlan,
        });

        const { url, error } = response.data;

        if (error) {
          console.error("Checkout error:", error);
          toast.error("Failed to start checkout process. Please try again.");
          return;
        }

        window.location.href = url;
      } catch (err) {
        console.error("Error initiating checkout:", err);
        toast.error("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    return (
      <section ref={ref} className="py-24">
        <div className="container mx-auto px-4">
          <h3 className="mb-12 text-center text-2xl font-bold text-gray-900 md:text-3xl">
            Pricing Plans
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="relative flex flex-col justify-between border rounded-none p-6 w-full sm:w-1/3 max-w-md">
              <div className="mt-1 text-xl font-bold text-gray-900">Free</div>
              <ul className="space-y-3 text-black text-md mt-4">
                {[
                  "✔ 2 PDFs/Day",
                  "✔ 20 Questions/Day",
                  "✔ 500 Pages/PDF",
                  "✔ 10 MB/PDF",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="font-semibold">{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full bg-gray-300 rounded-none text-sm h-12 cursor-not-allowed text-gray-500 mt-4"
                disabled
              >
                <div className="flex items-center gap-2">Current Plan</div>
              </Button>
            </div>

            <div
              onClick={() => setSelectedPlan("monthly")}
              className={`relative flex flex-col cursor-pointer justify-between border rounded-none p-6 w-full sm:w-1/3 max-w-md ${
                selectedPlan === "monthly" ? "border-black" : "border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="monthly"
                  name="plan"
                  checked={selectedPlan === "monthly"}
                  onChange={() => setSelectedPlan("monthly")}
                  className="accent-black w-4 h-4"
                />
                <label htmlFor="monthly" className="font-medium text-gray-900">
                  Monthly
                </label>
              </div>
              <div className="mt-1 text-xl font-bold text-gray-900">
                ₹499{" "}
                <span className="text-xs font-normal text-gray-500">/mo</span>
              </div>
              <ul className="space-y-3 text-black text-md mt-4">
                {[
                  "✔ Unlimited PDFs",
                  "✔ Unlimited Questions",
                  "✔ 2,000 Pages/PDF",
                  "✔ 32 MB/PDF",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="font-semibold">{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={handleUpgrade}
                className={`w-full rounded-none text-sm h-12 cursor-pointer text-white mt-4 ${
                  selectedPlan === "monthly"
                    ? "bg-black hover:bg-gray-800"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
                disabled={selectedPlan !== "monthly"}
              >
                {loading ? (
                  <PiSpinnerBold className="animate-spin text-4xl" />
                ) : (
                  <div className="flex items-center gap-2">
                    <IoSparkles />
                    Upgrade to Plus
                  </div>
                )}
              </Button>
            </div>

            <div
              onClick={() => setSelectedPlan("yearly")}
              className={`relative flex flex-col cursor-pointer justify-between border rounded-none p-6 w-full sm:w-1/3 max-w-md ${
                selectedPlan === "yearly" ? "border-black" : "border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="yearly"
                  name="plan"
                  checked={selectedPlan === "yearly"}
                  onChange={() => setSelectedPlan("yearly")}
                  className="accent-black w-4 h-4"
                />
                <label htmlFor="yearly" className="font-medium text-gray-900">
                  Yearly
                </label>
                <span className="ml-2 bg-black text-white text-[10px] font-semibold px-1.5 py-0.5">
                  SAVE 60%
                </span>
              </div>
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold text-gray-900">₹2399</div>
                  <span className="text-xs font-normal text-gray-500">/yr</span>
                </div>
                <div className="text-sm text-gray-500">(₹199.92/mo)</div>
              </div>
              <ul className="space-y-3 text-black text-md mt-4">
                {[
                  "✔ Unlimited PDFs",
                  "✔ Unlimited Questions",
                  "✔ 2,000 Pages/PDF",
                  "✔ 32 MB/PDF",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="font-semibold">{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={handleUpgrade}
                className={`w-full rounded-none text-sm h-12 cursor-pointer text-white mt-4 ${
                  selectedPlan === "yearly"
                    ? "bg-black hover:bg-gray-800"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
                disabled={selectedPlan !== "yearly"}
              >
                {loading ? (
                  <PiSpinnerBold className="animate-spin text-4xl" />
                ) : (
                  <div className="flex items-center gap-2">
                    <IoSparkles />
                    Upgrade to Plus
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  },
);

export default Pricing;
