import React, { forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { RefObject } from "react";

interface CTAProps {
  homeRef: RefObject<HTMLElement>;
}

const CTA = forwardRef<HTMLElement, CTAProps>(({ homeRef }, ref) => {
  const scrollToSection = (ref: RefObject<HTMLElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section ref={ref} className="bg-black py-24 text-white">
      <div className="container mx-auto px-4 text-center">
        <h3 className="mb-6 text-3xl font-bold">
          Ready to chat with your PDFs?
        </h3>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-300">
          Upload your first document and experience the power of AI-powered
          document chat.
        </p>
        <div>
          <Button
            onClick={() => scrollToSection(homeRef)}
            className="bg-white px-8 py-6 rounded-none cursor-pointer hover:bg-black hover:text-white hover:border hover:border-white text-black"
          >
            Get Started for Free
          </Button>
        </div>
      </div>
    </section>
  );
});

export default CTA;
