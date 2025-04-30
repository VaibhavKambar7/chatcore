import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) {
        console.error("SignIn callback: No profile email found.");
        return false;
      }

      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: profile.email },
        });

        if (existingUser) {
          if (profile.name && existingUser.name !== profile.name) {
            await prisma.user.update({
              where: { email: profile.email },
              data: { name: profile.name },
            });
            console.log(`Updated name for user ${profile.email}`);
          }
        } else {
          console.log(
            `SignIn callback: User ${profile.email} not found. Creation deferred to post-login flow with IP.`,
          );
        }

        return true;
      } catch (error) {
        console.error("Error during signIn callback:", error);
        return false;
      }
    },
  },
};
