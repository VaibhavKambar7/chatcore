"use client";

import { useState, useEffect, useRef } from "react";
import { FileUpload } from "@/components/file-upload";
import { GoSidebarExpand } from "react-icons/go";
import { getIP } from "@/app/utils/getIP";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare, Zap, BookOpen } from "lucide-react";
import { IoSparkles } from "react-icons/io5";
import Sidebar from "@/components/sidebar";
import { motion } from "framer-motion";
import { RefObject } from "react";
import axios from "axios";
import { toast } from "sonner";
import { PiSpinnerBold } from "react-icons/pi";

export default function Home() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const ipRef = useRef<string>("");

  const featuresRef = useRef<HTMLElement>(null);
  const homeRef = useRef<HTMLElement>(null);
  const faqRef = useRef<HTMLElement>(null);
  const pricingRef = useRef<HTMLElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const fetchIP = async () => {
      const ip = await getIP();
      ipRef.current = ip;
    };
    fetchIP();
  }, []);

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

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">(
    "yearly",
  );
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setLoading(true);

      const response = await axios.post("/api/createCheckoutSession", {
        plan: selectedPlan,
      });

      const { url, error } = response.data;

      if (error) {
        console.error("Checkout error:", error);
        toast.error("Failed to start checkout process. Please try again.");
        return;
      }

      window.location.href = url;
    } catch (err) {
      console.error("Error initiating checkout:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex relative">
        {!isSidebarOpen && (
          <div className="fixed left-0 top-0 h-full w-14 bg-gray-100 border-r-black border-1 z-40">
            <GoSidebarExpand
              className="text-xl mt-5 ml-4 cursor-pointer"
              onClick={() => setIsSidebarOpen(true)}
            />
          </div>
        )}
        {isSidebarOpen && (
          <div className="fixed left-0 top-0 h-full z-50">
            <Sidebar setIsSidebarOpen={setIsSidebarOpen} ip={ipRef.current} />
          </div>
        )}
        <div
          className={`flex-1 flex flex-col ${isSidebarOpen ? "ml-[280px]" : "ml-14"}`}
        >
          <header className="border-b border-gray-100">
            <div className="container mx-auto flex h-16 items-center justify-center px-4">
              <nav className="block">
                <ul className="flex space-x-8">
                  <li>
                    <a
                      href="#"
                      className="text-sm text-gray-600 hover:text-gray-900"
                      onClick={() =>
                        scrollToSection(featuresRef as RefObject<HTMLElement>)
                      }
                    >
                      Features
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-sm text-gray-600 hover:text-gray-900"
                      onClick={() =>
                        scrollToSection(faqRef as RefObject<HTMLElement>)
                      }
                    >
                      FAQ
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-sm text-gray-600 hover:text-gray-900"
                      onClick={() =>
                        scrollToSection(pricingRef as RefObject<HTMLElement>)
                      }
                    >
                      Pricing
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </header>

          <main ref={homeRef} className="flex-1">
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
                  <FileUpload setPdfUrl={(url) => setPdfUrl(url)} />
                </motion.div>
                <motion.p
                  variants={childVariants}
                  className="mt-4 text-sm text-gray-500"
                >
                  Free to use. 10MB file size limit.
                </motion.p>
              </div>
            </motion.section>

            <motion.section
              ref={featuresRef}
              className="bg-gray-50 py-24"
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
                      Chat with your PDF in plain language. Get specific answers
                      to your questions.
                    </p>
                  </motion.div>
                  <motion.div
                    variants={childVariants}
                    className="rounded-none bg-white p-6 shadow-sm"
                  >
                    <div className="mb-4 rounded-full bg-gray-100 p-3 inline-block">
                      <FileText className="h-6 w-6 text-black" />
                    </div>
                    <h4 className="mb-2 text-xl font-semibold">
                      Works with any PDF
                    </h4>
                    <p className="text-gray-600">
                      Research papers, contracts, books, or documentation -
                      ChatCore handles them all.
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
                      Extract insights in seconds instead of spending hours
                      reading through documents.
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.section>

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
                    <h4 className="mb-2 text-xl font-semibold">
                      1. Upload Your PDF
                    </h4>
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
                    <h4 className="mb-2 text-xl font-semibold">
                      2. Ask Questions
                    </h4>
                    <p className="text-gray-600">
                      Use natural language to ask any question about the content
                      of your PDF.
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

            <motion.section
              ref={faqRef}
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
                      ChatPDF brings the power of conversational AI to your
                      documents, letting you chat with your PDFs as easily as
                      using ChatGPT. Whether you're studying, researching, or
                      analyzing documents, our platform helps you understand and
                      extract information in seconds, backed up by the latest
                      PDF AI technology.
                    </p>
                  </motion.div>
                  <motion.div
                    variants={childVariants}
                    className="rounded-none bg-white p-6 shadow-sm"
                  >
                    <h4 className="mb-2 text-lg font-semibold">
                      Is ChatPDF free?
                    </h4>
                    <p className="text-gray-600">
                      Absolutely! We offer a free plan that lets you analyze 2
                      documents every day. For power users, our ChatPDF Plus
                      plan provides unlimited document analysis, and more
                      advanced features.
                    </p>
                  </motion.div>
                  {/* <motion.div variants={childVariants} className="rounded-none bg-white p-6 shadow-sm">
                    <h4 className="mb-2 text-lg font-semibold">How does ChatPDF's AI technology work?</h4>
                    <p className="text-gray-600">
                      ChatPDF uses sophisticated AI to build a comprehensive map of your document's content and meaning. When you chat with your PDF, our system quickly identifies relevant information and generates clear, accurate responses - complete with citations to help you verify sources and explore further.
                    </p>
                  </motion.div> */}
                  {/* <motion.div variants={childVariants} className="rounded-none bg-white p-6 shadow-sm">
                    <h4 className="mb-2 text-lg font-semibold">Does ChatPDF support file types other than PDFs?</h4>
                    <p className="text-gray-600">
                      Yes, ChatPDF supports a growing range of document formats including PDF (.pdf), Word (.doc, .docx), PowerPoint (.ppt, .pptx), Markdown (.md), and Text files (.txt). From academic papers to corporate presentations, to legal documents - one platform for all your document AI needs.
                    </p>
                  </motion.div> */}
                  <motion.div
                    variants={childVariants}
                    className="rounded-none bg-white p-6 shadow-sm"
                  >
                    <h4 className="mb-2 text-lg font-semibold">
                      Do I need to create an account to use ChatPDF?
                    </h4>
                    <p className="text-gray-600">
                      No, jump right in! ChatPDF is free to try and requires no
                      account to get started. While creating a free account
                      unlocks additional features like saved history and
                      multi-document chats, you can experience ChatPDF's
                      powerful core features immediately.
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
                      Yes! ChatPDF is fully multilingual - upload documents in
                      any language and chat in your preferred language. You can
                      even upload a document in one language and ask questions
                      in another, making it perfect for international research.
                      Switch between languages at any time by simply asking
                      ChatPDF.
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
                      Absolutely! ChatPDF is designed to be compatible with all
                      devices. Access your documents from your desktop at work,
                      your tablet in class, or your phone while on the go - all
                      you need is a web browser.
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
                      Absolutely! While ChatPDF keeps all your documents
                      strictly private by default, you can easily share when
                      needed. Generate secure links for specific PDFs to invite
                      others, who can access them for free without needing an
                      account. You stay in control - manage access rights and
                      revoke sharing permissions anytime.
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.section>

            <section className="py-24" ref={pricingRef}>
              <div className="container mx-auto px-4">
                <h3 className="mb-12 text-center text-2xl font-bold text-gray-900 md:text-3xl">
                  Pricing Plans
                </h3>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <div className="relative flex flex-col justify-between border rounded-none p-6 w-full sm:w-1/3 max-w-md">
                    <div className="mt-1 text-xl font-bold text-gray-900">
                      Free
                    </div>
                    <ul className="space-y-3 text-black text-md mt-4">
                      {[
                        "✔ 2 PDFs/Day",
                        "✔ 20 Questions/Day",
                        "✔ 500 Pages/PDF",
                        "✔ 10 MB/PDF",
                      ].map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="font-semibold">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full bg-gray-300 rounded-none text-sm h-12 cursor-not-allowed text-gray-500 mt-4"
                      disabled
                    >
                      <div className="flex items-center gap-2">
                        Current Plan
                      </div>
                    </Button>
                  </div>

                  <div
                    onClick={() => setSelectedPlan("monthly")}
                    className={`relative flex flex-col cursor-pointer justify-between border rounded-none p-6 w-full sm:w-1/3 max-w-md ${
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
                    <ul className="space-y-3 text-black text-md mt-4">
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
                    <Button
                      onClick={handleUpgrade}
                      className={`w-full rounded-none text-sm h-12 cursor-pointer text-white mt-4 ${
                        selectedPlan === "monthly"
                          ? "bg-black hover:bg-gray-800"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                      disabled={selectedPlan !== "monthly"}
                    >
                      {loading ? (
                        <PiSpinnerBold className="animate-spin text-4xl" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <IoSparkles />
                          Upgrade to Plus
                        </div>
                      )}
                    </Button>
                  </div>

                  <div
                    onClick={() => setSelectedPlan("yearly")}
                    className={`relative flex flex-col cursor-pointer justify-between border rounded-none p-6 w-full sm:w-1/3 max-w-md ${
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
                      <span className="ml-2 bg-black text-white text-[10px] font-semibold px-1.5 py-0.5">
                        SAVE 60%
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="text-xl font-bold text-gray-900">
                          ₹2399
                        </div>
                        <span className="text-xs font-normal text-gray-500">
                          /yr
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">(₹199.92/mo)</div>
                    </div>
                    <ul className="space-y-3 text-black text-md mt-4">
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
                    <Button
                      onClick={handleUpgrade}
                      className={`w-full rounded-none text-sm h-12 cursor-pointer text-white mt-4 ${
                        selectedPlan === "yearly"
                          ? "bg-black hover:bg-gray-800"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                      disabled={selectedPlan !== "yearly"}
                    >
                      {loading ? (
                        <PiSpinnerBold className="animate-spin text-4xl" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <IoSparkles />
                          Upgrade to Plus
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-black py-24 text-white">
              <div className="container mx-auto px-4 text-center">
                <h3 className="mb-6 text-3xl font-bold">
                  Ready to chat with your PDFs?
                </h3>
                <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-300">
                  Upload your first document and experience the power of
                  AI-powered document chat.
                </p>
                <div>
                  <Button
                    onClick={() =>
                      scrollToSection(homeRef as RefObject<HTMLElement>)
                    }
                    className="bg-white px-8 py-6 rounded-none cursor-pointer hover:bg-black hover:text-white  hover:border hover:border-white text-black"
                  >
                    Get Started for Free
                  </Button>
                </div>
              </div>
            </section>
          </main>

          <footer className="border-t border-gray-100 bg-white py-12">
            <div className="container mx-auto px-4">
              <div className="flex flex-col items-center justify-between md:flex-row">
                <div className="mb-4 md:mb-0">
                  <h1 className="text-xl font-bold text-gray-900">
                    <span className="text-black">Chat</span>Core
                  </h1>
                </div>
                <div className="flex ml-40 space-x-6">
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Terms
                  </a>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Privacy
                  </a>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Contact
                  </a>
                </div>
                <div className="mt-4 text-sm text-gray-500 md:mt-0">
                  © {new Date().getFullYear()} ChatCore. All rights reserved.
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
