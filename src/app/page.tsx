import { useState } from "react";

export default function Home() {
  const [response, setResponse] = useState<string>("");
  const [query, setQuery] = useState<string>("");

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    const formData = new FormData();
    formData.append("pdfFile", event.target.files[0]);

    await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
  };

  const handleQuery = async () => {
    const res = await fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    setResponse(data.response);
  };

  return (
    <div>
      <h1>AI PDF Analyzer</h1>
      <input type="file" accept="application/pdf" onChange={handleUpload} />
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter your question here"
      />
      <button onClick={handleQuery}>Ask</button>
      <div>{response}</div>
    </div>
  );
}
