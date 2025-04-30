import { useState } from "react";
import { queries } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";

/*
Has an input field that, when updated, shows a dropdown of the
categories mathing what’s written. Entries are clickable.
For use in the profile and the post editor
*/

export default function CategoriesChooser() {
  const [entry, setEntry] = useState("");
  const [matching, setMatching] = useState<Tables<"categories">[]>([]);

  const handleChange = async (newText: string) => {
    setEntry(newText);
    setMatching(await queries.categories.match(entry));
  };

  return (
    <div>
      <div className="dropdown">
        <div tabIndex={0} role="button" className="btn m-1">
          <input
            type="text"
            placeholder="Type here"
            className="input"
            value={entry}
            onChange={(e) => {
              void handleChange(e.target.textContent ?? "");
            }}
          />
        </div>
        <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
          {matching.map((category) => (
            <li key={category.id}>
              <a
                onClick={() => {
                  setEntry(category.name);
                }}
              >
                {category.name}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
