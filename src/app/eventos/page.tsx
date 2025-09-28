'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Calendar,
  Users,
  Clock,
  MapPin,
  ChefHat,
  Sparkles,
  CheckCircle,
  X,
  AlertCircle,
  Eye,
  RotateCcw
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Event } from '@/types/event';
import { UserWithPreferences } from '@/types/friendship';

export default function EventosPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [friends, setFriends] = useState<UserWithPreferences[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [generatingRecipe, setGeneratingRecipe] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    mealType: 'LUNCH' as const,
    location: '',
    maxParticipants: 10,
    selectedFriends: [] as string[]
  });

  useEffect(() => {
    fetchEvents();
    fetchFriends();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error obteniendo eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/friends');
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (error) {
      console.error('Error obteniendo amigos:', error);
    }
  };

  const createEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          date: new Date(formData.date),
          participantIds: formData.selectedFriends
        }),
      });

      if (response.ok) {
        await fetchEvents();
        setShowCreateForm(false);
        setFormData({
          title: '',
          description: '',
          date: '',
          mealType: 'LUNCH',
          location: '',
          maxParticipants: 10,
          selectedFriends: []
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Error creando evento');
      }
    } catch (error) {
      console.error('Error creando evento:', error);
      alert('Error creando evento');
    }
  };

  const generateRecipe = async (eventId: string) => {
    try {
      setGeneratingRecipe(eventId);
      const response = await fetch(`/api/events/${eventId}/generate-recipe`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchEvents();
        alert('¡Receta generada exitosamente! Se ha agregado al calendario de todos los participantes.');
      } else {
        const error = await response.json();
        alert(error.error || 'Error generando receta');
      }
    } catch (error) {
      console.error('Error generando receta:', error);
      alert('Error generando receta');
    } finally {
      setGeneratingRecipe(null);
    }
  };

  const getMealTypeLabel = (mealType: string) => {
    const labels = {
      BREAKFAST: 'Desayuno',
      LUNCH: 'Almuerzo',
      SNACK: 'Merienda',
      DINNER: 'Cena'
    };
    return labels[mealType as keyof typeof labels] || mealType;
  };

  const getMealTypeIcon = (mealType: string) => {
    const icons = {
      BREAKFAST: '☕',
      LUNCH: '🍽️',
      SNACK: '🍎',
      DINNER: '🌙'
    };
    return icons[mealType as keyof typeof icons] || '🍽️';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    
    if (eventDate < now) return 'past';
    if (event.recipeId) return 'recipe-generated';
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'past':
        return 'bg-gray-100 text-gray-700';
      case 'recipe-generated':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'past':
        return 'Finalizado';
      case 'recipe-generated':
        return 'Receta generada';
      case 'pending':
        return 'Pendiente';
      default:
        return 'Desconocido';
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Eventos
                  </h1>
                  <p className="text-gray-600">
                    Organiza juntadas de cocina con tus amigos
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateForm(true)}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Crear Evento</span>
              </motion.button>
            </div>

            {/* Events Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay eventos
                </h3>
                <p className="text-gray-600 mb-4">
                  Crea tu primer evento para comenzar a organizar juntadas
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Evento</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => {
                  const status = getEventStatus(event);
                  
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl p-6 shadow-soft border border-gray-200 hover:shadow-medium transition-all duration-200"
                    >
                      {/* Event Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {event.title}
                          </h3>
                          {event.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {getStatusLabel(status)}
                        </span>
                      </div>

                      {/* Event Details */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="mr-2">{getMealTypeIcon(event.mealType)}</span>
                          <span>{getMealTypeLabel(event.mealType)}</span>
                        </div>

                        {event.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>{event.location}</span>
                          </div>
                        )}

                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-2" />
                          <span>
                            {event.participants?.filter(p => p.status === 'ACCEPTED').length || 0} participantes
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedEvent(event)}
                          className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Ver</span>
                        </button>

                        {status === 'pending' && event.creatorId === session?.user?.id && (
                          <button
                            onClick={() => generateRecipe(event.id)}
                            disabled={generatingRecipe === event.id}
                            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-lg transition-colors"
                          >
                            {generatingRecipe === event.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Generando...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                <span>Generar Receta</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Create Event Modal */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowCreateForm(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Crear Evento
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={createEvent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título del Evento *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha y Hora *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Comida *
                    </label>
                    <select
                      value={formData.mealType}
                      onChange={(e) => setFormData({ ...formData, mealType: e.target.value as 'BREAKFAST' | 'LUNCH' | 'SNACK' | 'DINNER' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      <option value="BREAKFAST">Desayuno</option>
                      <option value="LUNCH">Almuerzo</option>
                      <option value="SNACK">Merienda</option>
                      <option value="DINNER">Cena</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ubicación
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Ej: Mi casa, Restaurante XYZ..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máximo de Participantes
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="20"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invitar Amigos *
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                      {friends.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-2">
                          No tienes amigos aún. Ve a la página de Juntadas para hacer amigos.
                        </p>
                      ) : (
                        friends.map((friend) => (
                          <label key={friend.id} className="flex items-center space-x-2 py-1">
                            <input
                              type="checkbox"
                              checked={formData.selectedFriends.includes(friend.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    selectedFriends: [...formData.selectedFriends, friend.id]
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    selectedFriends: formData.selectedFriends.filter(id => id !== friend.id)
                                  });
                                }
                              }}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">
                              {friend.name || friend.email}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={formData.selectedFriends.length === 0}
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-lg transition-colors"
                    >
                      Crear Evento
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Event Detail Modal */}
        <AnimatePresence>
          {selectedEvent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedEvent(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedEvent.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(selectedEvent.date)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Event Details */}
                <div className="space-y-6">
                  {selectedEvent.description && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Descripción</h4>
                      <p className="text-gray-700">{selectedEvent.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">{getMealTypeIcon(selectedEvent.mealType)}</span>
                      <span>{getMealTypeLabel(selectedEvent.mealType)}</span>
                    </div>
                    {selectedEvent.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{selectedEvent.location}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Participantes</h4>
                    <div className="space-y-2">
                      {selectedEvent.participants?.map((participant) => (
                        <div key={participant.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">
                              {participant.user?.name || participant.user?.email}
                            </span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            participant.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                            participant.status === 'DECLINED' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {participant.status === 'ACCEPTED' ? 'Confirmado' :
                             participant.status === 'DECLINED' ? 'Declinó' :
                             'Pendiente'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedEvent.recipe && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Receta Generada</h4>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <ChefHat className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-800">{selectedEvent.recipe.title}</span>
                        </div>
                        <p className="text-sm text-green-700">{selectedEvent.recipe.description}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
