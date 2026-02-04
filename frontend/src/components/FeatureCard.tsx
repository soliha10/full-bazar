import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-border">
      <div className="w-14 h-14 bg-[#FF7A00]/10 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-[#FF7A00]" />
      </div>
      <h3 className="font-semibold text-lg text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}