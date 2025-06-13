import { queries } from "../../contexts/supabase/supabase";
import { useEffect, useState } from "react";
import CategoryBadge from "../../Components/CategoryBadge/CategoryBadge";

export default function RightToolbarWide() {
  const [trendingTags, setTrendingTags] = useState<{ name: string; estimated_total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchTrendingTags() {
      try {
        // use your new function here
        setTrendingTags(await queries.categories.getAproximateRankings(10));
      } catch (e) {
        // you might want to handle this differently
        setTrendingTags([]);
        console.log(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    void fetchTrendingTags();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="hidden border-l border-slate-200 lg:block lg:w-full lg:max-w-72 lg:shrink-0 lg:pt-[30px] lg:pl-8">
      <div className="sticky top-8 flex h-[calc(100vh-60px)] flex-col">
        <div className="flex flex-col items-start space-y-4">
          <div className="card card-md w-full shadow-sm">
            <div className="card-body">
              <div className="card-title mb-2">Trending categories</div>
              {loading ? (
                <div className="text-sm text-gray-400">Loading...</div>
              ) : trendingTags.length === 0 ? (
                <div className="text-sm text-gray-400">No trending categories found.</div>
              ) : (
                trendingTags.map((tag) => (
                  <div key={tag.name} className="flex w-full items-center justify-between p-1">
                    <CategoryBadge name={tag.name} />
                    <span className="text-xs text-gray-500">{tag.estimated_total} posts</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
