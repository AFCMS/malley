import TopNavbar from "../TopNavbar/TopNavbar";
import LeftToolbarWide from "../LeftToolbarWide/LeftToolbarWide";
import RightToolbarWide from "../RightToolbarWide/RightToolbarWide";
import BottomDock from "../BottomDock/BottomDock";

interface BaseProps {
  children: React.ReactNode;
}

export default function Base(props: BaseProps) {
  return (
    <div className="h-screen min-h-screen">
      <TopNavbar />
      <div className="mx-auto flex max-w-3xl md:max-w-7xl lg:px-8">
        <LeftToolbarWide />
        <div className="flex flex-1 flex-col items-center lg:pb-[30px]">{props.children}</div>
        <RightToolbarWide />
        <BottomDock />
      </div>
    </div>
  );
}
