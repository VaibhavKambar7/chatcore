import React from "react";
import { motion } from "framer-motion";
import { FileUpload } from "@/components/file-upload";

interface HeroProps {
  setPdfUrl: (url: string) => void;
}

const Hero: React.FC<HeroProps> = ({ setPdfUrl }) => {
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
    <motion.section
      className="py-24 md:py-32"
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
          className="mx-auto max-w-3xl rounded-none border-2 border-dashed border-gray-200 bg-gray-50 p-8"
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
  );
};

export default Hero;
