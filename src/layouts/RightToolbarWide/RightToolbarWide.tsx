export default function RightToolbarWide() {
  return (
    <div className="hidden border-l border-slate-200 lg:block lg:w-full lg:max-w-72 lg:shrink-0 lg:pt-[30px] lg:pl-8">
      {/* You can put any content here, for now just a placeholder */}
      <div className="sticky top-8 pb-8">
        <div className="flex flex-col items-start space-y-4">
          <div className="text-lg font-semibold">Right Sidebar</div>
          {/* Add more content as needed */}
        </div>
      </div>
    </div>
  );
}
