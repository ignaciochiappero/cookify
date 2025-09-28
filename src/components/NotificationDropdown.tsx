'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  UserPlus,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { Notification } from '@/types/notification';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications?limit=10');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.counts.unread);
      }
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: [notificationId]
        }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  };

  const respondToFriendRequest = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      setProcessingRequest(requestId);
      
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        // Mostrar notificación de éxito
        const message = action === 'accept' ? '¡Solicitud aceptada! Ahora son amigos.' : 'Solicitud rechazada.';
        
        // Remover la notificación de la lista inmediatamente
        setNotifications(prev => prev.filter(notif => notif.id !== requestId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Recargar notificaciones para obtener actualizaciones
        await fetchNotifications();
        
        // Mostrar mensaje de éxito (opcional)
        console.log(message);
      } else {
        const error = await response.json();
        alert(error.error || 'Error procesando solicitud');
      }
    } catch (error) {
      console.error('Error respondiendo a solicitud:', error);
      alert('Error procesando solicitud');
    } finally {
      setProcessingRequest(null);
    }
  };

  const respondToEventInvitation = async (eventId: string, action: 'accept' | 'decline') => {
    try {
      setProcessingRequest(eventId);
      
      const response = await fetch(`/api/events/${eventId}/participants`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        // Mostrar notificación de éxito
        const message = action === 'accept' ? '¡Invitación aceptada! Te esperamos en el evento.' : 'Invitación rechazada.';
        
        // Remover la notificación de la lista inmediatamente
        setNotifications(prev => prev.filter(notif => notif.id !== eventId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Recargar notificaciones para obtener actualizaciones
        await fetchNotifications();
        
        // Mostrar mensaje de éxito (opcional)
        console.log(message);
      } else {
        const error = await response.json();
        alert(error.error || 'Error procesando invitación');
      }
    } catch (error) {
      console.error('Error respondiendo a invitación:', error);
      alert('Error procesando invitación');
    } finally {
      setProcessingRequest(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markAllAsRead: true
        }),
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marcando todas las notificaciones como leídas:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'FRIEND_REQUEST':
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case 'FRIEND_REQUEST_ACCEPTED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'EVENT_INVITATION':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'EVENT_CANCELLED':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'EVENT_RECIPE_GENERATED':
        return <Sparkles className="w-4 h-4 text-yellow-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'FRIEND_REQUEST':
        return 'bg-blue-50 border-blue-200';
      case 'FRIEND_REQUEST_ACCEPTED':
        return 'bg-green-50 border-green-200';
      case 'EVENT_INVITATION':
        return 'bg-purple-50 border-purple-200';
      case 'EVENT_CANCELLED':
        return 'bg-red-50 border-red-200';
      case 'EVENT_RECIPE_GENERATED':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
    return `Hace ${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notificaciones</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-purple-600 hover:text-purple-800 transition-colors"
                >
                  Marcar todas como leídas
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Bell className="w-8 h-8 mb-2" />
                <p className="text-sm">No hay notificaciones</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      {/* Botones de acción para solicitudes de amistad */}
                      {notification.type === 'FRIEND_REQUEST' && notification.relatedId && (
                        <div className="flex items-center space-x-2 mt-3">
                          <button
                            onClick={() => respondToFriendRequest(notification.relatedId!, 'accept')}
                            disabled={processingRequest === notification.relatedId}
                            className={`flex items-center space-x-1 px-3 py-1 text-white text-xs rounded-lg transition-colors ${
                              processingRequest === notification.relatedId
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {processingRequest === notification.relatedId ? (
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            <span>
                              {processingRequest === notification.relatedId ? 'Procesando...' : 'Aceptar'}
                            </span>
                          </button>
                          <button
                            onClick={() => respondToFriendRequest(notification.relatedId!, 'decline')}
                            disabled={processingRequest === notification.relatedId}
                            className={`flex items-center space-x-1 px-3 py-1 text-white text-xs rounded-lg transition-colors ${
                              processingRequest === notification.relatedId
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700'
                            }`}
                          >
                            {processingRequest === notification.relatedId ? (
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                            <span>
                              {processingRequest === notification.relatedId ? 'Procesando...' : 'Rechazar'}
                            </span>
                          </button>
                        </div>
                      )}

                      {/* Botones de acción para invitaciones a eventos */}
                      {notification.type === 'EVENT_INVITATION' && notification.relatedId && (
                        <div className="flex items-center space-x-2 mt-3">
                          <button
                            onClick={() => respondToEventInvitation(notification.relatedId!, 'accept')}
                            disabled={processingRequest === notification.relatedId}
                            className={`flex items-center space-x-1 px-3 py-1 text-white text-xs rounded-lg transition-colors ${
                              processingRequest === notification.relatedId
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                          >
                            {processingRequest === notification.relatedId ? (
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            <span>
                              {processingRequest === notification.relatedId ? 'Procesando...' : 'Aceptar'}
                            </span>
                          </button>
                          <button
                            onClick={() => respondToEventInvitation(notification.relatedId!, 'decline')}
                            disabled={processingRequest === notification.relatedId}
                            className={`flex items-center space-x-1 px-3 py-1 text-white text-xs rounded-lg transition-colors ${
                              processingRequest === notification.relatedId
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700'
                            }`}
                          >
                            {processingRequest === notification.relatedId ? (
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                            <span>
                              {processingRequest === notification.relatedId ? 'Procesando...' : 'Rechazar'}
                            </span>
                          </button>
                        </div>
                      )}
                      
                      {/* Botón para marcar como leída */}
                      {!notification.isRead && notification.type !== 'FRIEND_REQUEST' && notification.type !== 'EVENT_INVITATION' && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Marcar como leída
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <button className="w-full text-center text-sm text-purple-600 hover:text-purple-800 transition-colors">
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
