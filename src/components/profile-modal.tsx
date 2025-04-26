import React, { useState } from "react";
import { Dialog, DialogContent, DialogPortal, DialogTitle } from "./ui/dialog";
import { signOut, useSession } from "next-auth/react";
import { Progress } from "./ui/progress";
import UpgradeModal from "./upgrade-modal";

interface UserProfileModalProps {
  openProfileModal: boolean;
  setOpenProfileModal: (open: boolean) => void;
  openUpgradeModal: boolean;
  setOpenUpgradeModal: (open: boolean) => void;
}

const ProfileModal: React.FC<UserProfileModalProps> = ({
  openProfileModal,
  setOpenProfileModal,
  openUpgradeModal,
  setOpenUpgradeModal,
}) => {
  const { data } = useSession();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <>
      <Dialog
        open={openProfileModal}
        onOpenChange={(open) => setOpenProfileModal(open)}
      >
        <DialogPortal>
          <div className="data-[state:closed]:fade-out-0 fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0" />
          <DialogContent className="p-6 sm:p-8 space-y-2 w-1/2">
            <DialogTitle className="text-center text-2xl font-semibold">
              My Account
            </DialogTitle>
            <div className="flex justify-between items-center">
              <div className="text-black text-md">{data?.user?.email}</div>
              <button
                aria-label="Sign out"
                className="text-black rounded-none cursor-pointer text-md border-1 border-black bg-white px-4 py-1 hover:bg-black hover:text-white"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>

            <div className="border border-gray-300 rounded-none p-5 space-y-5">
              <div className="flex justify-between text-md text-gray-700">
                <span className="font-semibold">Free usage today</span>
                <span>resets at 5:30 PM</span>
              </div>

              <div className="space-y-3 border-t pt-5">
                <div className="flex flex-row items-center justify-between">
                  <Progress value={10} className="w-120 h-3" />
                  <p className="text-md ml-3">1/2 PDFs</p>
                </div>
                <div className="flex flex-row items-center justify-between">
                  <Progress value={30} className="w-120 h-3" />
                  <p className="text-md ml-3">4/20 Messages</p>
                </div>
              </div>

              <div className="flex justify-between items-center border-t pt-5">
                <p className="text-md font-semibold">Free Plan</p>
                <button
                  aria-label="Upgrade plan"
                  onClick={() => {
                    setOpenUpgradeModal(true);
                    setOpenProfileModal(false);
                  }}
                  className="bg-black cursor-pointer text-white px-4 py-2 text-md rounded-none hover:bg-gray-800"
                >
                  Upgrade
                </button>
              </div>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
      {openUpgradeModal && (
        <UpgradeModal
          openUpgradeModal={openUpgradeModal}
          setOpenUpgradeModal={setOpenUpgradeModal}
        />
      )}
    </>
  );
};

export default ProfileModal;
