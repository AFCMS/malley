import { useState } from "react";
import { HiChevronLeft, HiChevronRight, HiDocumentArrowDown } from "react-icons/hi2";

interface MediaCarouselProps {
  mediaUrls: string[];
}

export default function MediaCarousel({ mediaUrls }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (mediaUrls.length === 0) {
    return null;
  }

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % mediaUrls.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + mediaUrls.length) % mediaUrls.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const isImage = (url: string) => {
    const ext = url.split(".").pop()?.toLowerCase() ?? "";
    return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
  };

  const isPdf = (url: string) => {
    const ext = url.split(".").pop()?.toLowerCase() ?? "";
    return ext === "pdf";
  };

  return (
    <div className="relative w-full">
      {/* Main media display */}
      <div className="relative overflow-hidden rounded-2xl bg-gray-100">
        {mediaUrls.length > 1 && (
          <>
            {/* Previous button */}
            <button
              onClick={prevSlide}
              className="absolute top-1/2 left-2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80"
            >
              <HiChevronLeft className="h-5 w-5" />
            </button>

            {/* Next button */}
            <button
              onClick={nextSlide}
              className="absolute top-1/2 right-2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80"
            >
              <HiChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Media content */}
        <div className="relative aspect-video w-full">
          {mediaUrls.map((url, index) => (
            <div key={index} className={`absolute inset-0 ${index === currentIndex ? "opacity-100" : "opacity-0"}`}>
              {isImage(url) ? (
                <img
                  src={url}
                  alt={`Media ${(index + 1).toString()}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : isPdf(url) ? (
                <div className="flex h-full w-full items-center justify-center bg-gray-200">
                  <div className="flex flex-col items-center gap-3 text-gray-600">
                    <HiDocumentArrowDown className="h-12 w-12" />
                    <span className="text-sm font-medium">PDF Document</span>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">
                      Download PDF
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-200">
                  <div className="flex flex-col items-center gap-3 text-gray-600">
                    <HiDocumentArrowDown className="h-12 w-12" />
                    <span className="text-sm font-medium">File</span>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">
                      Download
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dots indicator */}
      {mediaUrls.length > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {mediaUrls.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                goToSlide(index);
              }}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentIndex ? "bg-blue-500" : "bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
