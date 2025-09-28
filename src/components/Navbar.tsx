"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChefHat,
  User,
  LogOut,
  Settings,
  BookOpen,
  Home,
  Menu,
  X,
  Shield,
  Calendar,
  Bell,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import NotificationDropdown from "./NotificationDropdown";

export default function Navbar() {
  const { session, isAuthenticated, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Fetch notification count
  useEffect(() => {
    if (isAuthenticated) {
      const fetchNotificationCount = async () => {
        try {
          const response = await fetch('/api/notifications?limit=1');
          if (response.ok) {
            const data = await response.json();
            setNotificationCount(data.counts.unread);
          }
        } catch (error) {
          console.error('Error fetching notification count:', error);
        }
      };

      fetchNotificationCount();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/95 backdrop-blur-md shadow-soft border-b border-gray-100 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 text-xl font-bold text-gray-900 hover:text-primary-600 transition-colors"
          >
            <ChefHat className="w-8 h-8 text-primary-600" />
            <span>Cookify</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">


            {session && (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                >
                  <Settings className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                >
                  <User className="w-4 h-4" />
                  <span>Perfil</span>
                </Link>
                <Link
                  href="/meal-planner"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Planificador</span>
                </Link>
                <Link
                  href="/recipes"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Recetas</span>
                </Link>
                <Link
                  href="/juntadas"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                >
                  <Users className="w-4 h-4" />
                  <span>Juntadas</span>
                </Link>
                <Link
                  href="/eventos"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Eventos</span>
                </Link>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* Notifications Button */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                  >
                    <Bell className="w-5 h-5" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </motion.button>
                  <NotificationDropdown
                    isOpen={isNotificationOpen}
                    onClose={() => setIsNotificationOpen(false)}
                  />
                </div>

                <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      {session?.user?.name}
                    </span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => signOut()}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Salir</span>
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-soft hover:shadow-medium"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-gray-100 py-4"
          >
            <div className="space-y-2">
              <Link
                href="/"
                className="flex items-center space-x-2 px-4 py-3 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="w-5 h-5" />
                <span>Inicio</span>
              </Link>

              {session && (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-2 px-4 py-3 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings className="w-5 h-5" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 px-4 py-3 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    <span>Perfil</span>
                  </Link>
                  <Link
                    href="/meal-planner"
                    className="flex items-center space-x-2 px-4 py-3 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Calendar className="w-5 h-5" />
                    <span>Planificador</span>
                  </Link>
                  <Link
                    href="/recipes"
                    className="flex items-center space-x-2 px-4 py-3 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>Recetas</span>
                  </Link>
                  <Link
                    href="/juntadas"
                    className="flex items-center space-x-2 px-4 py-3 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Users className="w-5 h-5" />
                    <span>Juntadas</span>
                  </Link>
                  <Link
                    href="/eventos"
                    className="flex items-center space-x-2 px-4 py-3 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Calendar className="w-5 h-5" />
                    <span>Eventos</span>
                  </Link>
                </>
              )}

              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center space-x-2 px-4 py-3 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Shield className="w-5 h-5" />
                  <span>Admin</span>
                </Link>
              )}

              {isAuthenticated ? (
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <div className="flex items-center space-x-2 px-4 py-3 bg-gray-50 rounded-lg mb-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {session?.user?.name}
                      </div>
                      {isAdmin && (
                        <div className="text-xs text-primary-600 font-medium">
                          Administrador
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 px-4 py-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-100 pt-4 mt-4 space-y-2">
                  <Link
                    href="/auth/signin"
                    className="block px-4 py-3 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all duration-200 text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Registrarse
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
