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

  const steps = [
    {
      title: "Upload Your PDF",
      description:
        "Simply drag and drop your PDF file or browse to upload it securely.",
      icon: <FileText className="h-6 w-6 text-black" />,
    },
    {
      title: "Ask Questions",
      description:
        "Use natural language to ask any question about the content of your PDF.",
      icon: <MessageSquare className="h-6 w-6 text-black" />,
    },
    {
      title: "Get Instant Answers",
      description: "Receive accurate, AI-powered responses in seconds.",
      icon: <BookOpen className="h-6 w-6 text-black" />,
    },
  ];

  return (
    <motion.section
      className="py-24 bg-fabric-light"
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
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={childVariants}
              className="relative bg-white p-6 shadow-sm"
            >
              <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-lg">
                {index + 1}
              </div>

              <div className="mb-4 rounded-full bg-gray-100 p-3 inline-block">
                {step.icon}
              </div>
              <h4 className="mb-2 text-xl font-semibold">{step.title}</h4>
              <p className="text-gray-600">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default HowItWorks;
