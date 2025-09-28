'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Users,
  Filter,
  UserPlus,
  CheckCircle,
  X,
  Clock,
  Shield,
  Target,
  ChefHat,
  Globe,
  RotateCcw
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { UserWithPreferences } from '@/types/friendship';
import { FriendRequest } from '@/types/friendship';

export default function JuntadasPage() {
  const [users, setUsers] = useState<UserWithPreferences[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedHealthCondition, setSelectedHealthCondition] = useState('');
  const [selectedPersonalGoal, setSelectedPersonalGoal] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [friends, setFriends] = useState<UserWithPreferences[]>([]);
  const [refreshingFriends, setRefreshingFriends] = useState(false);

  // Estados para filtros
  const [allHealthConditions, setAllHealthConditions] = useState<string[]>([]);
  const [allPersonalGoals, setAllPersonalGoals] = useState<string[]>([]);
  const [allCountries, setAllCountries] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchFriendRequests();
    fetchFriends();
    fetchFilterOptions();
  }, [searchTerm, selectedCountry, selectedHealthCondition, selectedPersonalGoal, currentPage]);

  // Auto-refresh de amigos cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchFriends();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      // Solo agregar filtros si tienen valor
      if (searchTerm.trim()) {
        params.append('search', searchTerm);
      }
      if (selectedCountry) {
        params.append('country', selectedCountry);
      }
      if (selectedHealthCondition) {
        params.append('healthCondition', selectedHealthCondition);
      }
      if (selectedPersonalGoal) {
        params.append('personalGoal', selectedPersonalGoal);
      }

      console.log('🔍 DEBUG: Parámetros de búsqueda:', params.toString());

      // TEMPORAL: Usar API simple para debug
      const response = await fetch('/api/users/simple');
      console.log('🔍 DEBUG: Respuesta de API:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 DEBUG: Datos recibidos:', data);
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
      } else {
        const errorData = await response.json();
        console.error('🔍 DEBUG: Error de API:', errorData);
      }
    } catch (error) {
      console.error('Error buscando usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await fetch('/api/friends/requests?type=sent');
      if (response.ok) {
        const data = await response.json();
        setFriendRequests(data);
      }
    } catch (error) {
      console.error('Error obteniendo solicitudes:', error);
    }
  };

  const fetchFriends = async () => {
    try {
      setRefreshingFriends(true);
      const response = await fetch('/api/friends');
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (error) {
      console.error('Error obteniendo amigos:', error);
    } finally {
      setRefreshingFriends(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      // Obtener todas las condiciones de salud únicas
      const healthResponse = await fetch('/api/users/search?limit=1000');
      if (healthResponse.ok) {
        const data = await healthResponse.json();
        const healthConditions = new Set<string>();
        const personalGoals = new Set<string>();
        const countries = new Set<string>();

        data.users.forEach((user: UserWithPreferences) => {
          if (user.userPreferences) {
            user.userPreferences.healthConditions.forEach(condition => healthConditions.add(condition));
            user.userPreferences.customHealthConditions.forEach(condition => healthConditions.add(condition));
            user.userPreferences.personalGoals.forEach(goal => personalGoals.add(goal));
            user.userPreferences.customPersonalGoals.forEach(goal => personalGoals.add(goal));
            if (user.userPreferences.country) countries.add(user.userPreferences.country);
          }
        });

        setAllHealthConditions(Array.from(healthConditions).sort());
        setAllPersonalGoals(Array.from(personalGoals).sort());
        setAllCountries(Array.from(countries).sort());
      }
    } catch (error) {
      console.error('Error obteniendo opciones de filtro:', error);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      setSendingRequest(userId);
      const response = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: userId,
          message: `¡Hola! Me gustaría ser tu amigo en Cookify para poder organizar juntadas de cocina.`
        }),
      });

      if (response.ok) {
        await fetchUsers(); // Refrescar la lista
        await fetchFriendRequests();
        await fetchFriends(); // Refrescar lista de amigos
      } else {
        const error = await response.json();
        alert(error.error || 'Error enviando solicitud');
      }
    } catch (error) {
      console.error('Error enviando solicitud:', error);
      alert('Error enviando solicitud');
    } finally {
      setSendingRequest(null);
    }
  };

  const getFriendRequestStatus = (userId: string) => {
    const request = friendRequests.find(req => req.receiverId === userId);
    return request?.status || 'NONE';
  };

  const getHealthConditions = (user: UserWithPreferences) => {
    if (!user.userPreferences) return [];
    return [
      ...user.userPreferences.healthConditions,
      ...user.userPreferences.customHealthConditions
    ];
  };

  const getPersonalGoals = (user: UserWithPreferences) => {
    if (!user.userPreferences) return [];
    return [
      ...user.userPreferences.personalGoals,
      ...user.userPreferences.customPersonalGoals
    ];
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCountry('');
    setSelectedHealthCondition('');
    setSelectedPersonalGoal('');
    setCurrentPage(1);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Juntadas
                  </h1>
                  <p className="text-gray-600">
                    Encuentra personas con gustos similares para cocinar juntos
                  </p>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-200">
                <div className="flex flex-col lg:flex-row gap-4 mb-4">
                  {/* Search Bar */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  {/* Filter Toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-2 px-4 py-3 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors"
                  >
                    <Filter className="w-5 h-5" />
                    <span>Filtros</span>
                  </button>
                </div>

                {/* Filters Panel */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-200 pt-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Country Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Globe className="w-4 h-4 inline mr-2" />
                            País
                          </label>
                          <select
                            value={selectedCountry}
                            onChange={(e) => setSelectedCountry(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Todos los países</option>
                            {allCountries.map(country => (
                              <option key={country} value={country}>
                                {country}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Health Condition Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Shield className="w-4 h-4 inline mr-2" />
                            Condición de Salud
                          </label>
                          <select
                            value={selectedHealthCondition}
                            onChange={(e) => setSelectedHealthCondition(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Todas las condiciones</option>
                            {allHealthConditions.map(condition => (
                              <option key={condition} value={condition}>
                                {condition}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Personal Goal Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Target className="w-4 h-4 inline mr-2" />
                            Objetivo Personal
                          </label>
                          <select
                            value={selectedPersonalGoal}
                            onChange={(e) => setSelectedPersonalGoal(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Todos los objetivos</option>
                            {allPersonalGoals.map(goal => (
                              <option key={goal} value={goal}>
                                {goal}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end mt-4">
                        <button
                          onClick={clearFilters}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Limpiar filtros
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Main Content with Sidebar */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Users Grid */}
              <div className="flex-1">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {users.map((user) => {
                  const friendRequestStatus = getFriendRequestStatus(user.id);
                  const healthConditions = getHealthConditions(user);
                  const personalGoals = getPersonalGoals(user);

                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl p-6 shadow-soft border border-gray-200 hover:shadow-medium transition-all duration-200"
                    >
                      {/* User Header */}
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name || 'Usuario'}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <Users className="w-6 h-6 text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {user.name || 'Usuario'}
                          </h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          {user.userPreferences?.country && (
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {user.userPreferences.country}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Health Conditions */}
                      {healthConditions.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <Shield className="w-4 h-4 mr-2" />
                            Condiciones de Salud
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {healthConditions.slice(0, 3).map((condition, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                              >
                                {condition}
                              </span>
                            ))}
                            {healthConditions.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{healthConditions.length - 3} más
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Personal Goals */}
                      {personalGoals.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <Target className="w-4 h-4 mr-2" />
                            Objetivos
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {personalGoals.slice(0, 2).map((goal, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                              >
                                {goal}
                              </span>
                            ))}
                            {personalGoals.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{personalGoals.length - 2} más
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Cooking Preferences */}
                      {user.userPreferences && (
                        <div className="mb-4 text-xs text-gray-600">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <ChefHat className="w-3 h-3 mr-1" />
                              {user.userPreferences.cookingSkill}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {user.userPreferences.cookingTime}
                            </div>
                            <div className="flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {user.userPreferences.servings} personas
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="pt-4 border-t border-gray-200">
                        {user.isFriend ? (
                          <div className="flex items-center justify-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Amigo</span>
                          </div>
                        ) : friendRequestStatus === 'PENDING' ? (
                          <div className="flex items-center justify-center text-yellow-600">
                            <Clock className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Solicitud enviada</span>
                          </div>
                        ) : friendRequestStatus === 'DECLINED' ? (
                          <div className="flex items-center justify-center text-red-600">
                            <X className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Solicitud rechazada</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => sendFriendRequest(user.id)}
                            disabled={sendingRequest === user.id}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-lg transition-colors"
                          >
                            {sendingRequest === user.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Enviando...</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4" />
                                <span>Enviar solicitud</span>
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

              {/* Friends Sidebar */}
              <div className="lg:w-80">
                <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-200 sticky top-24">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Users className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Mis Amigos
                        </h3>
                        <div className="text-sm text-gray-600 flex items-center">
                          {refreshingFriends ? (
                            <>
                              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                              Actualizando...
                            </>
                          ) : (
                            `${friends.length} amigo${friends.length !== 1 ? 's' : ''}`
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={fetchFriends}
                      disabled={refreshingFriends}
                      className={`p-2 rounded-lg transition-colors ${
                        refreshingFriends
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      }`}
                      title="Actualizar lista de amigos"
                    >
                      <RotateCcw className={`w-4 h-4 ${refreshingFriends ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {friends.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">
                        Aún no tienes amigos
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Envía solicitudes para hacer amigos
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {friends.map((friend) => (
                        <motion.div
                          key={friend.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            {friend.image ? (
                              <img
                                src={friend.image}
                                alt={friend.name || 'Amigo'}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <Users className="w-5 h-5 text-purple-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {friend.name || 'Usuario'}
                            </h4>
                            <p className="text-xs text-gray-500 truncate">
                              {friend.email}
                            </p>
                            {friend.userPreferences?.country && (
                              <p className="text-xs text-gray-400 flex items-center mt-1">
                                <MapPin className="w-3 h-3 mr-1" />
                                {friend.userPreferences.country}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        page === currentPage
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
