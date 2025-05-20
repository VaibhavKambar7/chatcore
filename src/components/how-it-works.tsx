import React from "react";
import { motion } from "framer-motion";
import { FileText, MessageSquare, BookOpen } from "lucide-react";

const HowItWorks: React.FC = () => {
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
      className="py-24"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={sectionVariants}
    >
      <div className="container mx-auto px-4">
        <h3 className="mb-12 text-center text-2xl font-bold text-gray-900 md:text-3xl">
          How It Works
        </h3>
        <div className="grid gap-8 md:grid-cols-3">
          <motion.div
            variants={childVariants}
            className="rounded-none bg-white p-6 shadow-sm"
          >
            <div className="mb-4 rounded-full bg-gray-100 p-3 inline-block">
              <FileText className="h-6 w-6 text-black" />
            </div>
            <h4 className="mb-2 text-xl font-semibold">1. Upload Your PDF</h4>
            <p className="text-gray-600">
              Simply drag and drop your PDF file or browse to upload it
              securely.
            </p>
          </motion.div>
          <motion.div
            variants={childVariants}
            className="rounded-none bg-white p-6 shadow-sm"
          >
            <div className="mb-4 rounded-full bg-gray-100 p-3 inline-block">
              <MessageSquare className="h-6 w-6 text-black" />
            </div>
            <h4 className="mb-2 text-xl font-semibold">2. Ask Questions</h4>
            <p className="text-gray-600">
              Use natural language to ask any question about the content of your
              PDF.
            </p>
          </motion.div>
          <motion.div
            variants={childVariants}
            className="rounded-none bg-white p-6 shadow-sm"
          >
            <div className="mb-4 rounded-full bg-gray-100 p-3 inline-block">
              <BookOpen className="h-6 w-6 text-black" />
            </div>
            <h4 className="mb-2 text-xl font-semibold">
              3. Get Instant Answers
            </h4>
            <p className="text-gray-600">
              Receive accurate, AI-powered responses in seconds.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default HowItWorks;
