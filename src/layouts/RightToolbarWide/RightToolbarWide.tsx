import CategoryBadge from "../../Components/CategoryBadge/CategoryBadge";

export default function RightToolbarWide() {
  const trendingTags: { name: string; count: number }[] = [
    { name: "react", count: 120 },
    { name: "javascript", count: 95 },
    { name: "css", count: 80 },
    { name: "html", count: 75 },
  ];

  return (
    <div className="hidden border-l border-slate-200 lg:block lg:w-full lg:max-w-72 lg:shrink-0 lg:pt-[30px] lg:pl-8">
      <div className="sticky top-8 flex h-[calc(100vh-60px)] flex-col">
        <div className="flex flex-col items-start space-y-4">
          <div className="card card-md w-full shadow-sm">
            <div className="card-body">
              <div className="card-title mb-2">Trending categories</div>
              {trendingTags.map((tag) => (
                <div key={tag.name} className="flex w-full items-center justify-between p-1">
                  <CategoryBadge name={tag.name} />
                  <span className="text-xs text-gray-500">{tag.count} posts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
