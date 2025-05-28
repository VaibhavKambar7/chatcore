import React, { useState } from "react";
import { FiCopy } from "react-icons/fi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { toast } from "sonner";

const CopyButton = ({ textToCopy }: { textToCopy: string }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <Button
      onClick={handleCopy}
      variant="ghost"
      className="flex h-9 w-9 items-center justify-center rounded-lg cursor-pointer p-0 text-black hover:bg-gray-400 hover:text-black"
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={isCopied ? "check" : "copy"}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.15 }}
        >
          {isCopied ? (
            <FontAwesomeIcon
              icon={faCheck}
              className="mt-[2px] h-4 w-4 text-black-500"
            />
          ) : (
            <FiCopy className="h-4 w-4 opacity-100" />
          )}
        </motion.div>
      </AnimatePresence>
    </Button>
  );
};

export default CopyButton;
