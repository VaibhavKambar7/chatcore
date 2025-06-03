import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogPortal, DialogTitle } from "./ui/dialog";
import { signOut, useSession } from "next-auth/react";
import { Progress } from "./ui/progress";
import UpgradeModal from "./upgrade-modal";
import { PDF_LIMIT, MESSAGE_LIMIT } from "@/app/utils/constants";

interface UserProfileModalProps {
  openProfileModal: boolean;
  setOpenProfileModal: (open: boolean) => void;
  openUpgradeModal: boolean;
  setOpenUpgradeModal: (open: boolean) => void;
  usage: {
    pdfCount: number;
    messageCount: number;
    isProUser: boolean;
    plan: string | null;
  };
}

const ProfileModal: React.FC<UserProfileModalProps> = ({
  openProfileModal,
  setOpenProfileModal,
  openUpgradeModal,
  setOpenUpgradeModal,
  usage,
}) => {
  const { data } = useSession();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const renderUsageSection = () => {
    if (usage.isProUser) {
      return (
        <div className="space-y-3 pt-1">
          <p className="text-md font-semibold text-green-600">
            Unlimited usage
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3 border-t pt-5">
        <div className="flex flex-row items-center justify-between">
          <Progress
            value={(usage.pdfCount / PDF_LIMIT) * 100}
            className="w-120 h-3"
          />
          <p className="text-md ml-3">
            {usage.pdfCount}/{PDF_LIMIT} PDFs
          </p>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Progress
            value={(usage.messageCount / MESSAGE_LIMIT) * 100}
            className="w-120 h-3"
          />
          <p className="text-md ml-3">
            {usage.messageCount}/{MESSAGE_LIMIT} Messages
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={openProfileModal} onOpenChange={setOpenProfileModal}>
        <DialogPortal>
          <div className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
          <DialogContent className="p-6 sm:p-8 space-y-4 w-1/2">
            <DialogTitle className="text-center text-2xl font-semibold">
              My Account
            </DialogTitle>

            <div className="flex justify-between items-center">
              <div className="text-black text-md">{data?.user?.email}</div>
              <button
                onClick={handleSignOut}
                className="text-black border border-black bg-white px-4 py-1 text-md hover:bg-black hover:text-white cursor-pointer"
              >
                Sign out
              </button>
            </div>

            <div className="border border-gray-300 p-5 space-y-5">
              {!usage.isProUser && (
                <div className="flex justify-between text-md text-gray-700">
                  <span className="font-semibold">Free usage today</span>
                  <span>Resets at 12:00 AM</span>
                </div>
              )}

              {renderUsageSection()}

              <div
                className={"flex justify-between items-center border-t pt-5"}
              >
                <p className="text-md font-semibold">
                  {usage.isProUser ? "Pro Plan" : "Free Plan"}
                </p>
                {!usage.isProUser && (
                  <button
                    onClick={() => {
                      setOpenUpgradeModal(true);
                      setOpenProfileModal(false);
                    }}
                    className="bg-black text-white px-4 py-2 text-md hover:bg-gray-800"
                  >
                    Upgrade
                  </button>
                )}
              </div>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      {openUpgradeModal && (
        <UpgradeModal
          openUpgradeModal={openUpgradeModal}
          setOpenUpgradeModal={setOpenUpgradeModal}
          usage={usage}
        />
      )}
    </>
  );
};

export default ProfileModal;
