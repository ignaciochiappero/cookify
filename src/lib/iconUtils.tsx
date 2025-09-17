import React from 'react';
import { 
  Apple,
  Banana,
  Carrot,
  Cherry,
  Coffee,
  Cookie,
  Egg,
  Fish,
  Grape,
  IceCream,
  Milk,
  Pizza,
  Sandwich,
  Utensils,
  Wine,
  Beef,
  Croissant,
  Drumstick,
  Hamburger,
  IceCream2,
  Salad,
  Soup,
  Wheat,
  Leaf,
  Droplets,
  Package,
  Zap,
  Circle,
  Square,
  Triangle,
  Heart,
  Star,
  Sun,
  Moon,
  Cloud,
  Flame,
  Snowflake,
  Flower,
  TreePine,
  Bug,
  Bird,
  ChefHat
} from 'lucide-react';

// Mapeo de nombres de iconos de Lucide React a componentes
const lucideIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Apple,
  Banana,
  Carrot,
  Cherry,
  Coffee,
  Cookie,
  Egg,
  Fish,
  Grape,
  IceCream,
  Milk,
  Pizza,
  Sandwich,
  Utensils,
  Wine,
  Beef,
  Croissant,
  Drumstick,
  Hamburger,
  IceCream2,
  Salad,
  Soup,
  Wheat,
  Leaf,
  Droplets,
  Package,
  Zap,
  Circle,
  Square,
  Triangle,
  Heart,
  Star,
  Sun,
  Moon,
  Cloud,
  Flame,
  Snowflake,
  Flower,
  TreePine,
  Bug,
  Bird,
  ChefHat
};

// Función para renderizar un icono (emoji o Lucide React)
export const renderIcon = (iconString: string | undefined, className: string = "w-8 h-8") => {
  if (!iconString) {
    return <ChefHat className={className} />;
  }

  // Si es un emoji (contiene caracteres Unicode de emojis)
  if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(iconString)) {
    return <span className="text-3xl">{iconString}</span>;
  }

  // Si es un nombre de icono de Lucide React
  const IconComponent = lucideIconMap[iconString];
  if (IconComponent) {
    return <IconComponent className={className} />;
  }

  // Fallback
  return <ChefHat className={className} />;
};

// Función para obtener el componente de icono de Lucide React
export const getLucideIcon = (iconName: string) => {
  return lucideIconMap[iconName] || ChefHat;
};
