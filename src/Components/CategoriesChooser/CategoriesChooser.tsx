import { useEffect, useState } from "react";
import { queries } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";

interface CategoriesChooserProps {
  selectedCategories: Tables<"categories">[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<Tables<"categories">[]>>;
}

export default function CategoriesChooser({ selectedCategories, setSelectedCategories }: CategoriesChooserProps) {
  const [entry, setEntry] = useState("");
  const [matching, setMatching] = useState<Tables<"categories">[]>([]);

  useEffect(() => {
    if (entry.trim() === "") {
      setMatching([]);
      return;
    }

    queries.categories
      .match(entry)
      .then((newMatching) => {
        setMatching(newMatching);
      })
      .catch((error: unknown) => {
        console.error(error);
      });
  }, [entry]);

  const handleSelectCategory = (category: Tables<"categories">) => {
    if (!selectedCategories.find((c) => c.id === category.id)) {
      setSelectedCategories((prev) => [...prev, category].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setEntry("");
    setMatching([]);
  };

  const handleRemoveCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.filter((c) => {
        return c.id !== id;
      }),
    );
  };

  return (
    <div>
      {/* Selected category bubbles */}
      <div className="mb-2 flex flex-wrap gap-2">
        {selectedCategories.map((category) => (
          <div key={category.id} className="badge badge-neutral flex cursor-pointer items-center gap-1 px-2 py-1">
            {category.name}
            <button
              className="ml-1 text-xs"
              onClick={() => {
                handleRemoveCategory(category.id);
              }}
              aria-label={`Remove ${category.name}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Dropdown with input and matches */}
      <div className="dropdown">
        <div tabIndex={0} role="button" className="btn m-1 p-0">
          <input
            type="text"
            placeholder="Type here"
            className="input"
            value={entry}
            onChange={(e) => {
              setEntry(e.target.value);
            }}
          />
        </div>
        {matching.length > 0 && (
          <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-10 w-52 p-2 shadow-sm">
            {matching.map((category) => (
              <li key={category.id}>
                <a
                  onClick={() => {
                    handleSelectCategory(category);
                  }}
                >
                  {category.name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
