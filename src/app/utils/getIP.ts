"use server";

export async function getIP() {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip as string;
  } catch (err) {
    console.error("Failed to get IP", err);
    return "";
  }
}
