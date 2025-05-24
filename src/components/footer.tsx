import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-100 bg-white py-12 bg-fabric-light">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between md:flex-row">
          <div className="mb-4 md:mb-0">
            <h1 className="text-xl font-bold text-gray-900">
              <span className="text-black">Chat</span>Core
            </h1>
          </div>
          <div className="flex ml-40 space-x-6">
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
              Terms
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
              Privacy
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
              Contact
            </a>
          </div>
          <div className="mt-4 text-sm text-gray-500 md:mt-0">
            © {new Date().getFullYear()} ChatCore. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
