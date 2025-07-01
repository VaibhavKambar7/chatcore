import React, { RefObject } from "react";
import { motion } from "framer-motion";
import { FileUpload } from "@/components/file-upload";
import Header from "./header";

interface HeroProps {
  setPdfUrl: (url: string) => void;
  featuresRef: RefObject<HTMLElement | null>;
  faqRef: RefObject<HTMLElement | null>;
  pricingRef: RefObject<HTMLElement | null>;
}

const Hero: React.FC<HeroProps> = ({
  setPdfUrl,
  featuresRef,
  faqRef,
  pricingRef,
}) => {
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.1,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.1 },
    },
  };

  return (
    <div className="min-h-screen w-full relative">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e2e8f0 1px, rgba(215, 218, 223, 0.72) 1px),
            linear-gradient(to bottom, #e2e8f0 1px, rgba(231, 233, 239, 0.64) 1px)
          `,
          backgroundSize: "20px 30px",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)",
        }}
      />
      <div className="relative z-10">
        <Header
          featuresRef={featuresRef as RefObject<HTMLElement>}
          faqRef={faqRef as RefObject<HTMLElement>}
          pricingRef={pricingRef as RefObject<HTMLElement>}
        />
      </div>
      <motion.section
        className="py-24 md:py-32 relative z-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={sectionVariants}
      >
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            variants={childVariants}
            className="text-5xl font-bold mb-4 text-center text-black"
          >
            Chat with any
            <span className="bg-black text-white px-4 ml-2">PDF</span>
          </motion.h1>
          <motion.p
            variants={childVariants}
            className="mx-auto mb-8 max-w-2xl text-md text-gray-600"
          >
            Upload your PDF and ask questions using AI.
          </motion.p>
          <motion.div
            variants={childVariants}
            className="mx-auto max-w-3xl rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-8"
          >
            <FileUpload setPdfUrl={(url) => setPdfUrl(url as string)} />
          </motion.div>
          <motion.p
            variants={childVariants}
            className="mt-4 text-sm text-gray-500"
          >
            Free to use. 10MB file size limit.
          </motion.p>
        </div>
      </motion.section>
    </div>
  );
};

export default Hero;
