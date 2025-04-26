import React, { useState } from "react";
import { Dialog, DialogContent, DialogPortal, DialogTitle } from "./ui/dialog";
import { useSession } from "next-auth/react";
import { Button } from "./ui/button";
import Image from "next/image";
import { IoSparkles } from "react-icons/io5";

interface UserProfileModalProps {
  openUpgradeModal: boolean;
  setOpenUpgradeModal: (open: boolean) => void;
}

const UpgradeModal: React.FC<UserProfileModalProps> = ({
  openUpgradeModal,
  setOpenUpgradeModal,
}) => {
  const { data } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">(
    "yearly",
  );

  return (
    <Dialog open={openUpgradeModal} onOpenChange={setOpenUpgradeModal}>
      <DialogPortal>
        <DialogTitle />
        <div className="data-[state=closed]:fade-out-0 fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0" />

        <DialogContent className="p-8 sm:p-10 space-y-6 w-3/5 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex justify-center">
              <Image
                src="/assets/upgrade-plan.png"
                alt="Upgrade Plan"
                width={4000}
                height={4080}
                className="h-auto w-3/4 object-contain"
              />
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-black">Upgrade to Plus</h2>

              <ul className="space-y-3 text-black text-md">
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

              <div className="flex flex-col sm:flex-row gap-3">
                <div
                  onClick={() => setSelectedPlan("monthly")}
                  className={`relative flex flex-col justify-between border rounded-none p-3 w-full sm:w-1/2 cursor-pointer ${
                    selectedPlan === "monthly"
                      ? "border-black"
                      : "border-gray-300"
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
                    <label
                      htmlFor="monthly"
                      className="font-medium text-gray-900"
                    >
                      Monthly
                    </label>
                  </div>
                  <div className="mt-1 text-xl font-bold text-gray-900">
                    ₹499{" "}
                    <span className="text-xs font-normal text-gray-500">
                      /mo
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setSelectedPlan("yearly")}
                  className={`relative flex flex-col justify-between border rounded-none p-3 w-full sm:w-1/2 cursor-pointer ${
                    selectedPlan === "yearly"
                      ? "border-black"
                      : "border-gray-300"
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
                    <label
                      htmlFor="yearly"
                      className="font-medium text-gray-900"
                    >
                      Yearly
                    </label>
                    <span className="ml-2 bg-black text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-none">
                      SAVE 60%
                    </span>
                  </div>
                  <div className="mt-1 text-xl font-bold text-gray-900">
                    ₹199.92{" "}
                    <span className="text-xs font-normal text-gray-500">
                      /mo
                    </span>
                  </div>
                </div>
              </div>

              <Button className="w-full bg-black rounded-none text-sm h-12 cursor-pointer text-white hover:bg-gray-800 mt-3">
                <IoSparkles />
                Upgrade to Plus
              </Button>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default UpgradeModal;
