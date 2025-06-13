interface TopBarRootProps {
  title?: string;
}

/**
 * Same as TopBar, but without the back button.
 */
export default function TopBarRoot(props: TopBarRootProps) {
  return (
    <div className="sticky top-0 left-0 z-50 flex h-14 w-full items-center gap-2 border-b border-slate-200 bg-white px-4">
      <span className="font-bold">{props.title}</span>
    </div>
  );
}
