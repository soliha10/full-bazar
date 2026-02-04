import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CategoryCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  image: string;
  link: string;
}

export function CategoryCard({ icon: Icon, title, description, image, link }: CategoryCardProps) {
  return (
    <Link to={link} className="group block">
      <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-500 border border-border/50">
        <img 
          src={image} 
          alt={title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
        
        <div className="absolute inset-x-0 bottom-0 p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-primary/20 backdrop-blur-md rounded-xl border border-white/20 group-hover:bg-primary transition-colors duration-500">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-xl md:text-2xl leading-tight">{title}</h3>
          </div>
          <p className="text-sm md:text-base text-gray-200 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 font-medium">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}