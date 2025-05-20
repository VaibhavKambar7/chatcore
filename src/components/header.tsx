import React, { forwardRef } from "react";
import { RefObject } from "react";

interface HeaderProps {
  featuresRef: RefObject<HTMLElement>;
  faqRef: RefObject<HTMLElement>;
  pricingRef: RefObject<HTMLElement>;
}

const Header = forwardRef<HTMLElement, HeaderProps>(
  ({ featuresRef, faqRef, pricingRef }) => {
    const scrollToSection = (ref: RefObject<HTMLElement>) => {
      if (ref.current) {
        ref.current.scrollIntoView({ behavior: "smooth" });
      }
    };

    return (
      <header className="border-b border-gray-100">
        <div className="container mx-auto flex h-16 items-center justify-center px-4">
          <nav className="block">
            <ul className="flex space-x-8">
              <li>
                <a
                  className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
                  onClick={() => scrollToSection(featuresRef)}
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
                  onClick={() => scrollToSection(faqRef)}
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
                  onClick={() => scrollToSection(pricingRef)}
                >
                  Pricing
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    );
  },
);

export default Header;
