const MAX_TOKEN_THRESHOLD = 25000;
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const PDF_LIMIT = 2;
const MESSAGE_LIMIT = 20;
const STORAGE_KEY = "chatcore_chat_data";
const MAX_LOOP_ITERATIONS = 10;
const TAVILY_API_URL = "https://api.tavily.com/search";
const SECTION_REGEX = /(?:^|\n)(#{1,6}|[A-Z][^\n:]{3,100})(?=\n|:)/g;

export {
  MAX_TOKEN_THRESHOLD,
  MAX_SIZE_MB,
  MAX_SIZE_BYTES,
  PDF_LIMIT,
  MESSAGE_LIMIT,
  STORAGE_KEY,
  MAX_LOOP_ITERATIONS,
  TAVILY_API_URL,
  SECTION_REGEX,
};
