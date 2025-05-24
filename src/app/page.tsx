"use client";

import { useState, useEffect, useRef, RefObject } from "react";
import { GoSidebarExpand } from "react-icons/go";
import { getIP } from "@/app/utils/getIP";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import Hero from "@/components/hero";
import Features from "@/components/features";
import HowItWorks from "@/components/how-it-works";
import FAQ from "@/components/faq";
import Pricing from "@/components/pricing";
import CTA from "@/components/cta";
import Footer from "@/components/footer";

export default function Home() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const ipRef = useRef<string>("");

  const featuresRef = useRef<HTMLElement>(null);
  const homeRef = useRef<HTMLElement>(null);
  const faqRef = useRef<HTMLElement>(null);
  const pricingRef = useRef<HTMLElement>(null);

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">(
    "yearly",
  );

  useEffect(() => {
    const fetchIP = async () => {
      const ip = await getIP();
      ipRef.current = ip;
    };
    fetchIP();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-fabric-light">
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
          <Header
            featuresRef={featuresRef as RefObject<HTMLElement>}
            faqRef={faqRef as RefObject<HTMLElement>}
            pricingRef={pricingRef as RefObject<HTMLElement>}
          />
          <main ref={homeRef} className="flex-1">
            <Hero setPdfUrl={(url) => setPdfUrl(url)} />
            <Features ref={featuresRef} />
            <HowItWorks />
            <FAQ ref={faqRef} />
            <Pricing
              ref={pricingRef}
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
            />
            <CTA ref={homeRef} homeRef={homeRef as RefObject<HTMLElement>} />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
