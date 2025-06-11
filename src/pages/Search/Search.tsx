import { useSearchParams } from "react-router";

import TopBar from "../../layouts/TopBar/TopBar";
import { useState } from "react";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("query") ?? "";

  // FORM CONTEXT
  const [formQuery, setFormQuery] = useState(query);

  const handleSearchSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const trimmedQuery = formQuery.trim();
    if (trimmedQuery) {
      setSearchParams({ query: trimmedQuery });
    }
  };

  return (
    <div className="w-full">
      <TopBar title={"Search"} />
      <div className="flex flex-col px-4">
        <form onSubmit={handleSearchSubmit} className="my-4">
          <label className="input w-full">
            <input
              type="search"
              name="search"
              className="w-full"
              required
              placeholder="Search"
              defaultValue={formQuery}
              onChange={(e) => {
                setFormQuery(e.target.value.trim());
              }}
            />
          </label>
        </form>
        <div>{query}</div>
      </div>
    </div>
  );
}
