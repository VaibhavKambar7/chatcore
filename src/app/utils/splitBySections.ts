import { SECTION_REGEX } from "./constants";

export function splitBySections(text: string): string[] {
  const sections: string[] = [];
  let matches = text.split(SECTION_REGEX);
  for (let i = 0; i < matches.length; i += 2) {
    const title = matches[i]?.trim();
    const content = matches[i + 1]?.trim();
    if (title || content) {
      const chunk = `${title}\n${content}`.trim();
      if (chunk.length > 500) sections.push(chunk);
    }
  }
  return sections;
}
