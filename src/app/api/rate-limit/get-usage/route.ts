import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { ip, email }: { ip?: string; email?: string } = await req.json();

    if (!ip) {
      return NextResponse.json(
        { error: "IP address is required" },
        { status: 400 },
      );
    }

    let user = null;
    let usage = null;
    let isProUser = false;
    let plan = null;

    if (email) {
      user = await prisma.user.findUnique({
        where: { email },
        include: { usage: true, subscription: true },
      });

      if (!user) {
        const userByIp = await prisma.user.findUnique({
          where: { ip },
          include: { usage: true, subscription: true },
        });

        if (userByIp) {
          isProUser = userByIp.subscription?.status === "ACTIVE";
          plan = userByIp.subscription?.plan;
        }

        if (userByIp && !userByIp.email) {
          console.log(
            `Linking email ${email} to existing user/usage for IP ${ip}`,
          );
          try {
            user = await prisma.user.update({
              where: { id: userByIp.id },
              data: { email: email },
              include: { usage: true },
            });

            if (user.usage) {
              await prisma.usage.update({
                where: { id: user.usage.id },
                data: { email: email },
              });
              usage =
                (await prisma.usage.findUnique({
                  where: { id: user.usage.id },
                })) ?? user.usage;
            } else {
              usage = await prisma.usage.create({
                data: {
                  ip: ip,
                  email: email,
                  userId: user.id,
                },
              });
            }
          } catch (error) {
            if (
              error instanceof Prisma.PrismaClientKnownRequestError &&
              error.code === "P2002"
            ) {
              console.warn(
                `Email ${email} conflict when linking IP ${ip}. Another user might have this email.`,
              );
              user = await prisma.user.findUnique({
                where: { email },
                include: { usage: true },
              });
              if (!user) {
                throw new Error("User conflict resolution failed.");
              }
              usage = user.usage;
            } else {
              throw error;
            }
          }
        }
      } else {
        usage = user.usage;
        isProUser = user.subscription?.status === "ACTIVE";
        plan = user.subscription?.plan;
      }
    }

    if (!user) {
      user = await prisma.user.findUnique({
        where: { ip },
        include: { usage: true },
      });
      if (user) {
        usage = user.usage;
      }
    }

    if (!user) {
      console.log(
        `Creating new user/usage for ${email ? `email ${email}` : `IP ${ip}`}`,
      );
      try {
        user = await prisma.user.create({
          data: {
            email: email ?? null,
            ip: ip,
            usage: {
              create: {
                ip: ip,
                email: email ?? null,
              },
            },
          },
          include: { usage: true },
        });
        usage = user.usage;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          console.warn(
            `Create conflict for ${email ? `email ${email}` : `IP ${ip}`}. Record likely created concurrently.`,
          );
          const whereClause = email ? { email } : { ip };
          user = await prisma.user.findUnique({
            where: whereClause,
            include: { usage: true },
          });
          if (!user) {
            throw new Error("User creation conflict resolution failed.");
          }
          usage = user.usage;
        } else {
          throw error;
        }
      }
    }

    if (user && !usage) {
      console.warn(
        `User ${user.id} found but usage was missing. Creating/linking usage.`,
      );
      usage = await prisma.usage.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          ip: user.ip,
          email: user.email,
          userId: user.id,
        },
      });
    }

    if (!usage) {
      console.error("FATAL: Could not find or create usage record for:", {
        email,
        ip,
      });
      return NextResponse.json(
        { error: "Could not initialize usage data" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      pdfCount: usage.pdfCount,
      messageCount: usage.messageCount,
      isProUser,
      plan,
    });
  } catch (error) {
    console.error("Get Usage Error:", error);
    return NextResponse.json(
      { error: "Server error processing usage request" },
      { status: 500 },
    );
  }
}
