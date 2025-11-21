import { useState, useEffect } from 'react';

/**
 * Custom hook to load characteristics data from JSON file
 */
export const useCharacteristicsData = () => {
  const [characteristicsData, setCharacteristicsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/copyrighted/characteristics.json');
        if (response.ok) {
          const data = await response.json();
          setCharacteristicsData(data);
        } else {
          console.error('Failed to load characteristics data');
          // Set empty data as fallback
          setCharacteristicsData({
            descriptions: {},
            highSpecializationExamples: {},
            lowSpecializationExamples: {}
          });
        }
      } catch (err) {
        console.error('Error loading characteristics data:', err);
        // Set empty data as fallback
        setCharacteristicsData({
          descriptions: {},
          highSpecializationExamples: {},
          lowSpecializationExamples: {}
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { characteristicsData, loading };
};

