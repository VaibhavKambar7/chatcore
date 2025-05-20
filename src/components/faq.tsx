import React, { forwardRef } from "react";
import { motion } from "framer-motion";

const FAQ = forwardRef<HTMLElement>((props, ref) => {
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
      className="py-24"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={sectionVariants}
    >
      <div className="container mx-auto px-4">
        <h3 className="mb-12 text-center text-2xl font-bold text-gray-900 md:text-3xl">
          Frequently Asked Questions
        </h3>
        <div className="mx-auto max-w-3xl space-y-6">
          <motion.div
            variants={childVariants}
            className="rounded-none bg-white p-6 shadow-sm"
          >
            <h4 className="mb-2 text-lg font-semibold">
              What is ChatPDF and how can it help me?
            </h4>
            <p className="text-gray-600">
              ChatPDF brings the power of conversational AI to your documents,
              letting you chat with your PDFs as easily as using ChatGPT.
              Whether you're studying, researching, or analyzing documents, our
              platform helps you understand and extract information in seconds,
              backed up by the latest PDF AI technology.
            </p>
          </motion.div>
          <motion.div
            variants={childVariants}
            className="rounded-none bg-white p-6 shadow-sm"
          >
            <h4 className="mb-2 text-lg font-semibold">Is ChatPDF free?</h4>
            <p className="text-gray-600">
              Absolutely! We offer a free plan that lets you analyze 2 documents
              every day. For power users, our ChatPDF Plus plan provides
              unlimited document analysis, and more advanced features.
            </p>
          </motion.div>
          <motion.div
            variants={childVariants}
            className="rounded-none bg-white p-6 shadow-sm"
          >
            <h4 className="mb-2 text-lg font-semibold">
              Do I need to create an account to use ChatPDF?
            </h4>
            <p className="text-gray-600">
              No, jump right in! ChatPDF is free to try and requires no account
              to get started. While creating a free account unlocks additional
              features like saved history and multi-document chats, you can
              experience ChatPDF's powerful core features immediately.
            </p>
          </motion.div>
          <motion.div
            variants={childVariants}
            className="rounded-none bg-white p-6 shadow-sm"
          >
            <h4 className="mb-2 text-lg font-semibold">
              Can I use ChatPDF in different languages?
            </h4>
            <p className="text-gray-600">
              Yes! ChatPDF is fully multilingual - upload documents in any
              language and chat in your preferred language. You can even upload
              a document in one language and ask questions in another, making it
              perfect for international research. Switch between languages at
              any time by simply asking ChatPDF.
            </p>
          </motion.div>
          <motion.div
            variants={childVariants}
            className="rounded-none bg-white p-6 shadow-sm"
          >
            <h4 className="mb-2 text-lg font-semibold">
              Is ChatPDF available on any device?
            </h4>
            <p className="text-gray-600">
              Absolutely! ChatPDF is designed to be compatible with all devices.
              Access your documents from your desktop at work, your tablet in
              class, or your phone while on the go - all you need is a web
              browser.
            </p>
          </motion.div>
          <motion.div
            variants={childVariants}
            className="rounded-none bg-white p-6 shadow-sm"
          >
            <h4 className="mb-2 text-lg font-semibold">
              Can I share my documents and chats with others?
            </h4>
            <p className="text-gray-600">
              Absolutely! While ChatPDF keeps all your documents strictly
              private by default, you can easily share when needed. Generate
              secure links for specific PDFs to invite others, who can access
              them for free without needing an account. You stay in control -
              manage access rights and revoke sharing permissions anytime.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
});

export default FAQ;
