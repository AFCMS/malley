import { HiArrowLeft } from "react-icons/hi2";
import { useNavigate } from "react-router";

interface TopBarProps {
  title?: string;
}

export default function TopBar(props: TopBarProps) {
  const navigate = useNavigate();

  const handleBackClick = () => {
    void navigate(-1); // Navigate back to the previous page
  };

  return (
    <div className="sticky top-0 left-0 z-50 flex h-14 w-full items-center gap-2 border-b border-slate-200 bg-white px-4">
      <button className="btn btn-square btn-ghost" onClick={handleBackClick} aria-label="Go back to previous page">
        <HiArrowLeft className="h-5 w-5" />
      </button>
      <span className="font-bold">{props.title}</span>
    </div>
  );
}
