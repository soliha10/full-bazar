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
    <Link to={link} className="group">
      <div className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-border">
        <div className="h-48 overflow-hidden">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#FF7A00]/10 rounded-lg">
              <Icon className="w-6 h-6 text-[#FF7A00]" />
            </div>
            <h3 className="font-semibold text-lg text-foreground">{title}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Link>
  );
}