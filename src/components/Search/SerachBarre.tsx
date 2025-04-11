import { useState, useEffect } from 'react';
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";
import { supabase } from '../../contexts/supabase/supabase';
import type { Tables } from '../../contexts/supabase/database';

interface SearchBarProps {
  onSearch: (results: Tables<"posts">[]) => void;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  const [keyword, setKeyword] = useState<string>('');
  const [category, setCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Charger les catégories disponibles
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*');
      
      if (error) {
        console.error('Erreur lors du chargement des catégories:', error);
      } else if (data) {
        setCategories(data);
      }
    };

    fetchCategories();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('posts')
        .select('*');
      
      // Filtrer par mot-clé dans le contenu si fourni
      if (keyword.trim()) {
        query = query.ilike('body', `%${keyword}%`);
      }
      
      // Filtrer par catégorie si sélectionnée
      if (category) {
        query = query.eq('category_id', category);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Erreur lors de la recherche:', error);
      } else if (data) {
        onSearch(data);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setKeyword('');
    setCategory(null);
    // Réinitialiser les résultats de recherche en récupérant tous les posts
    const fetchAllPosts = async () => {
      const { data } = await supabase.from('posts').select('*');
      if (data) {
        onSearch(data);
      }
    };
    fetchAllPosts();
  };

  return (
    <div className="card bg-base-100 shadow-md p-4 space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <HiOutlineMagnifyingGlass className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="input input-bordered w-full pl-10"
            placeholder="Rechercher par mot-clé dans le contenu"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        
        <select
          className="select select-bordered w-full sm:w-64"
          value={category || ''}
          onChange={(e) => setCategory(e.target.value || null)}
        >
          <option value="">Filtrer par catégorie</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        
        <button 
          className={`btn btn-primary ${loading ? 'loading' : ''}`} 
          onClick={handleSearch}
          disabled={loading}
        >
          Rechercher
        </button>
        
        <button 
          className="btn btn-outline" 
          onClick={handleReset}
        >
          Réinitialiser
        </button>
      </div>
      
      {loading && <p className="text-center">Recherche en cours...</p>}
    </div>
  );
};

export default SearchBar;