'use client';

import React, { useState, useEffect } from 'react';
import { UserPreferences } from '@/types/user-preferences';

export default function UserPreferencesDebug() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/user/preferences');
        if (response.ok) {
          const data = await response.json();
          setPreferences(data);
        } else {
          console.error('Error cargando preferencias:', response.status);
        }
      } catch (error) {
        console.error('Error cargando preferencias:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">Cargando preferencias del usuario...</p>
      </div>
    );
  }

  return (
    <div />
  );
}
