import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";

export default function AuthPage() {
  const handleGoogleSignIn = async () => {
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Promotional Content */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-8 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to ChatCore</h1>
          <p className="text-xl mb-6">
            The ultimate RAG-powered chat experience. Connect, converse, and
            create with the most advanced AI assistant.
          </p>
          <p className="text-lg">
            Join thousands of users who trust ChatCore for seamless,
            intelligent, and engaging conversations.
          </p>
        </div>
      </div>

      {/* Right Side - Authentication */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-100 p-8">
        <div className="max-w-sm w-full space-y-6">
          <h2 className="text-3xl font-semibold text-center text-gray-800">
            Sign In
          </h2>
          <p className="text-center text-gray-600">
            Get started with ChatCore in seconds
          </p>
          <Button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 border border-gray-300 hover:bg-gray-50"
          >
            <FcGoogle size={24} />
            Sign in with Google
          </Button>
        </div>
      </div>
    </div>
  );
}
