import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import TopBar from "../../layouts/TopBar/TopBar";
import CategoriesChooser from "../../Components/CategoriesChooser/CategoriesChooser";

import { useAuth } from "../../contexts/auth/AuthContext";
import { queries } from "../../contexts/supabase/supabase";
import { Tables } from "../../contexts/supabase/database";

const ProfileCategories = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<Tables<"categories">[]>([]);
  const [initialCategories, setInitialCategories] = useState<Tables<"categories">[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      void navigate("/login");
      return;
    }

    async function loadCurrentCategories() {
      if (!auth.user) return;

      try {
        const categories = await queries.profilesCategories.get(auth.user.id);
        setSelectedCategories(categories);
        setInitialCategories(categories);
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadCurrentCategories();
  }, [auth.isAuthenticated, auth.user, navigate]);

  const handleSave = async () => {
    if (!auth.user || isSaving) return;

    setIsSaving(true);
    try {
      // Find categories to add
      const categoriesToAdd = selectedCategories.filter(
        (selected) => !initialCategories.find((initial) => initial.id === selected.id),
      );

      // Find categories to remove
      const categoriesToRemove = initialCategories.filter(
        (initial) => !selectedCategories.find((selected) => selected.id === initial.id),
      );

      // Add new categories
      for (const category of categoriesToAdd) {
        await queries.profilesCategories.add(category.name);
      }

      // Remove deselected categories
      for (const category of categoriesToRemove) {
        await queries.profilesCategories.remove(category.name);
      }
      // Retourner au profil
      // Retourner au profil : on déclare d’abord un handle bien typé
      // on remonte le handle en tant qu’unknown pour le typer ensuite
      const rawHandle: unknown = (auth.user.user_metadata as Record<string, unknown>).handle;
      const handle = typeof rawHandle === "string" && rawHandle.length > 0 ? rawHandle : auth.user.id;
      void navigate(`/@${handle}`);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    void navigate(-1);
  };

  if (isLoading) {
    return <TopBar title="Loading..." />;
  }

  return (
    <div className="w-full">
      <TopBar title="My Categories" />

      <div className="p-4">
        <CategoriesChooser selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories} />

        <div className="mt-6 flex gap-3">
          <button className="btn btn-primary flex-1" onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button className="btn btn-secondary flex-1" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileCategories;
