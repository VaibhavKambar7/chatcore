import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { MessageSquare, FileText, Zap } from "lucide-react";

const Features = forwardRef<HTMLElement>((props, ref) => {
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
      ref={ref}
      className="py-24 bg-fabric-light"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={sectionVariants}
    >
      <div className="container mx-auto px-4">
        <h3 className="mb-12 text-center text-2xl font-bold text-gray-900 md:text-3xl">
          Why use ChatCore?
        </h3>
        <div className="grid gap-8 md:grid-cols-3">
          <motion.div
            variants={childVariants}
            className="rounded-none bg-white p-6 shadow-sm"
          >
            <div className="mb-4 rounded-full bg-gray-100 p-3 inline-block">
              <MessageSquare className="h-6 w-6 text-black" />
            </div>
            <h4 className="mb-2 text-xl font-semibold">
              Ask questions naturally
            </h4>
            <p className="text-gray-600">
              Chat with your PDF in plain language. Get specific answers to your
              questions.
            </p>
          </motion.div>
          <motion.div
            variants={childVariants}
            className="rounded-none bg-white p-6 shadow-sm"
          >
            <div className="mb-4 rounded-full bg-gray-100 p-3 inline-block">
              <FileText className="h-6 w-6 text-black" />
            </div>
            <h4 className="mb-2 text-xl font-semibold">Works with any PDF</h4>
            <p className="text-gray-600">
              Research papers, contracts, books, or documentation - ChatCore
              handles them all.
            </p>
          </motion.div>
          <motion.div
            variants={childVariants}
            className="rounded-none bg-white p-6 shadow-sm"
          >
            <div className="mb-4 rounded-full bg-gray-100 p-3 inline-block">
              <Zap className="h-6 w-6 text-black" />
            </div>
            <h4 className="mb-2 text-xl font-semibold">
              Save hours of reading
            </h4>
            <p className="text-gray-600">
              Extract insights in seconds instead of spending hours reading
              through documents.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
});

export default Features;
