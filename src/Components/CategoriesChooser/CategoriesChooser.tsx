import { useEffect, useState } from "react";
import { queries } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";
import { HiXMark } from "react-icons/hi2";

interface CategoriesChooserProps {
  selectedCategories: Tables<"categories">[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<Tables<"categories">[]>>;
}

export default function CategoriesChooser({ selectedCategories, setSelectedCategories }: CategoriesChooserProps) {
  const [entry, setEntry] = useState("");
  const [matching, setMatching] = useState<Tables<"categories">[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null); // Track highlighted index

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

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      setHighlightedIndex((prevIndex) => (prevIndex === null || prevIndex === matching.length - 1 ? 0 : prevIndex + 1));
    } else if (e.key === "ArrowUp") {
      setHighlightedIndex((prevIndex) => (prevIndex === null || prevIndex === 0 ? matching.length - 1 : prevIndex - 1));
    } else if (e.key === "Enter") {
      // If there's no category selected, add the entry itself
      if (entry.trim() !== "") {
        handleAddEntryAsCategory();
      } else if (highlightedIndex !== null) {
        handleSelectCategory(matching[highlightedIndex]);
      }
      e.preventDefault(); // Prevent form submission
    }
  };

  const handleAddEntryAsCategory = () => {
    const newCategory = { id: "", name: entry }; // initiate one that has a blank id, aka doesn’t exist yet
    if (!selectedCategories.find((c) => c.name === newCategory.name)) {
      setSelectedCategories((prev) => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setEntry("");
  };

  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">Add Categories</legend>
      <div className="mb-2 flex flex-wrap gap-2">
        {selectedCategories.map((category) => (
          <div
            key={category.id}
            className="badge badge-neutral flex items-center gap-1 px-2 py-1 text-xs uppercase select-none"
          >
            {category.name}
            <button
              className="size-[0.75rem] cursor-pointer"
              onClick={() => {
                handleRemoveCategory(category.id);
              }}
              aria-label={`Remove ${category.name}`}
            >
              <HiXMark className="size-[0.75rem]" />
            </button>
          </div>
        ))}
      </div>
      {/* Dropdown with input and matches */}
      <div className="dropdown mb-2 w-full items-center">
        <div className="relative w-full">
          {/* Input field with button inside */}
          <input
            type="text"
            placeholder="Type here"
            className="input w-full pr-10" // Add padding to the right to make space for the button
            value={entry}
            onChange={(e) => {
              setEntry(e.target.value);
            }}
            onKeyDown={handleKeyDown} // Listen for keydown events
          />
          {/* Add butt on positioned inside the input */}
          <button
            className="btn btn-circle absolute top-1/2 right-2 -translate-y-1/2 transform"
            onClick={handleAddEntryAsCategory}
            disabled={entry.trim() === ""}
            aria-label="Add Category"
          >
            +
          </button>
        </div>
      </div>

      {matching.length > 0 && (
        <ul
          tabIndex={0}
          className="dropdown-content menu bg-base-100 rounded-box z-10 max-h-48 w-52 overflow-y-auto p-2 shadow-sm"
        >
          {matching.map((category, index) => (
            <li key={category.id} className={highlightedIndex === index ? "bg-primary text-white" : ""}>
              <a
                onClick={() => {
                  handleSelectCategory(category);
                }}
                className="cursor-pointer"
              >
                {category.name}
              </a>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
