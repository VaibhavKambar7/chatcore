export function truncateChatHistory(
  chatHistory: any[],
  maxLength: number,
): any[] {
  const serialized = JSON.stringify(chatHistory);
  if (serialized.length <= maxLength) {
    return chatHistory;
  }

  const truncated = [];
  let currentLength = 2;

  for (let i = chatHistory.length - 1; i >= 0; i--) {
    const messageLength = JSON.stringify(chatHistory[i]).length + 1;
    if (currentLength + messageLength > maxLength) {
      break;
    }
    truncated.unshift(chatHistory[i]);
    currentLength += messageLength;
  }

  return truncated;
}

export function parseJsonSafely(jsonString: string): any {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    let fixed = jsonString
      .replace(/,(\s*[}\]])/g, "$1")
      .replace(/([{,]\s*)(\w+):/g, '$1"$2":')
      .trim();

    return JSON.parse(fixed);
  }
}
