import FoodManager from '@/components/FoodManager';

export default function Home() {

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🥬 Cookify
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Sistema CRUD completo para gestión de verduras
              </p>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              CRUD con React Hook Form
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FoodManager />
        
        {/* API Documentation */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🔗 Documentación de la API CRUD
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Endpoints Disponibles:</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">GET /api/food</code> - Obtener todas las verduras</li>
                <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">POST /api/food</code> - Crear nueva verdura</li>
                <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">GET /api/food/[id]</code> - Obtener verdura específica</li>
                <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">PUT /api/food/[id]</code> - Actualizar verdura</li>
                <li><code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">DELETE /api/food/[id]</code> - Eliminar verdura</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Ejemplo de uso:</h4>
              <pre className="text-xs bg-gray-50 dark:bg-gray-700 p-3 rounded text-gray-800 dark:text-gray-200 overflow-x-auto">
{`// Crear verdura
POST /api/food
{
  "name": "Apio",
  "description": "Tallo crujiente y refrescante",
  "image": "https://example.com/apio.jpg"
}

// Actualizar verdura
PUT /api/food/[id]
{
  "name": "Apio Orgánico",
  "description": "Tallo crujiente y refrescante, 100% orgánico"
}`}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
