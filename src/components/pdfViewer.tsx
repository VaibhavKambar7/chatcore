import { PiSpinnerBold } from "react-icons/pi";

interface PDFViewerProps {
  loading: boolean;
  error: string;
  pdfUrl: string;
}

export function PDFViewer({ loading, error, pdfUrl }: PDFViewerProps) {
  return (
    <div className="w-1/2 h-full bg-gray-100 relative">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <PiSpinnerBold className="animate-spin text-4xl text-black" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-full text-red-500">
          {error}
        </div>
      ) : pdfUrl ? (
        <iframe src={pdfUrl} className="w-full h-full" title="PDF Viewer" />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          No PDF loaded
        </div>
      )}
    </div>
  );
}
