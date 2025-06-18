import { useState } from "react";
import { HiChevronLeft, HiChevronRight, HiOutlineXMark } from "react-icons/hi2";

interface MediaCarouselProps {
  mediaUrls: string[];
}

export default function MediaCarousel({ mediaUrls }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // Create a unique ID for this carousel instance
  const carouselId = useState(() => Math.random().toString(36).substring(2, 15))[0];

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
  const openModal = (imageIndex: number) => {
    setModalImageIndex(imageIndex);
    const modal = document.getElementById(`image-modal-${carouselId}`) as HTMLDialogElement;
    modal.showModal();
  };

  const nextModalImage = () => {
    setModalImageIndex((prev) => (prev + 1) % mediaUrls.length);
  };

  const prevModalImage = () => {
    setModalImageIndex((prev) => (prev - 1 + mediaUrls.length) % mediaUrls.length);
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
        )}{" "}
        {/* Media content */}
        <div className="relative aspect-video w-full">
          {mediaUrls.map((url, index) => (
            <div key={index} className={`absolute inset-0 ${index === currentIndex ? "opacity-100" : "opacity-0"}`}>
              <img
                src={url}
                alt={`Image ${(index + 1).toString()}`}
                className="h-full w-full cursor-pointer object-cover transition-transform hover:scale-105"
                onClick={() => {
                  openModal(index);
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
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
      )}{" "}
      {/* Image Modal */}
      <dialog id={`image-modal-${carouselId}`} className="modal">
        <div className="modal-box h-full max-h-screen w-full max-w-7xl bg-black p-0">
          {/* Close button */}
          <div className="absolute top-4 right-4 z-20">
            <form method="dialog">
              <button className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20">
                <HiOutlineXMark className="h-6 w-6" />
              </button>
            </form>
          </div>

          {/* Navigation buttons for multiple images */}
          {mediaUrls.length > 1 && (
            <>
              <button
                onClick={prevModalImage}
                className="absolute top-1/2 left-4 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80"
              >
                <HiChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={nextModalImage}
                className="absolute top-1/2 right-4 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80"
              >
                <HiChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Full-size image */}
          <div className="flex h-full w-full items-center justify-center p-4">
            <img
              src={mediaUrls[modalImageIndex]}
              alt={`Image ${(modalImageIndex + 1).toString()} full size`}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* Image counter */}
          {mediaUrls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
              <div className="rounded-full bg-black/60 px-3 py-1 text-sm text-white">
                {modalImageIndex + 1} / {mediaUrls.length}
              </div>
            </div>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
