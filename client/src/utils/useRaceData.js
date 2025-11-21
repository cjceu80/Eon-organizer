import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * Custom hook for fetching and managing race data
 */
export const useRaceData = (worldId, initialRaceId) => {
  const { token } = useAuth();
  const [races, setRaces] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [categoryData, setCategoryData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRacesAndCategories = useCallback(async () => {
    if (!token || !worldId) return;

    setLoading(true);
    setError('');
    
    try {
      // Fetch world to get ruleset
      const worldResponse = await fetch(`/api/worlds/${worldId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!worldResponse.ok) {
        throw new Error('Failed to fetch world');
      }

      const worldData = await worldResponse.json();
      const ruleset = worldData.world?.ruleset || 'EON';

      // Fetch races
      const racesResponse = await fetch(`/api/races/world/${worldId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!racesResponse.ok) {
        throw new Error('Failed to fetch races');
      }

      const racesData = await racesResponse.json();
      const racesList = racesData.races || [];
      setRaces(racesList);

      // Extract unique categories
      const uniqueCategories = new Set();
      racesList.forEach(race => {
        uniqueCategories.add(race.category || 'Okategoriserade');
      });
      setCategoryList(Array.from(uniqueCategories).sort());

      // Fetch category details
      try {
        const categoriesResponse = await fetch(`/api/race-categories/${ruleset}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          const categoryObj = {};
          categoriesData.categories?.forEach(cat => {
            categoryObj[cat.name] = cat;
          });
          setCategoryData(categoryObj);
        }
      } catch (catErr) {
        console.error('Error fetching categories:', catErr);
        // Non-fatal error, continue without category details
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Misslyckades att ladda data');
    } finally {
      setLoading(false);
    }
  }, [token, worldId]);

  useEffect(() => {
    if (worldId) {
      fetchRacesAndCategories();
    }
  }, [worldId, fetchRacesAndCategories]);

  return {
    races,
    categoryList,
    categoryData,
    loading,
    error,
    refetch: fetchRacesAndCategories
  };
};

