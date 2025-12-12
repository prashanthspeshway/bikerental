import { Bike } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gauge, Clock, Zap, Mountain, Building, Trophy } from 'lucide-react';

interface BikeCardProps {
  bike: Bike;
  onRent?: (bike: Bike) => void;
}

const typeIcons = {
  electric: Zap,
  mountain: Mountain,
  city: Building,
  sport: Trophy,
};

const typeColors = {
  electric: 'bg-primary/10 text-primary',
  mountain: 'bg-accent/10 text-accent',
  city: 'bg-secondary text-secondary-foreground',
  sport: 'bg-destructive/10 text-destructive',
};

export function BikeCard({ bike, onRent }: BikeCardProps) {
  const TypeIcon = typeIcons[bike.type];

  return (
    <div className="group relative bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-500 hover:-translate-y-2">
      {/* Image Container */}
      <div className="relative h-48 bg-muted overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent z-10" />
        <div className="absolute inset-0 flex items-center justify-center">
          <TypeIcon className="h-24 w-24 text-muted-foreground/20" />
        </div>
        
        {/* Availability Badge */}
        <div className="absolute top-4 right-4 z-20">
          <Badge
            variant={bike.available ? 'default' : 'secondary'}
            className={bike.available ? 'bg-accent text-accent-foreground' : ''}
          >
            {bike.available ? 'Available' : 'In Use'}
          </Badge>
        </div>

        {/* Type Badge */}
        <div className="absolute top-4 left-4 z-20">
          <Badge className={typeColors[bike.type]}>
            <TypeIcon className="h-3 w-3 mr-1" />
            {bike.type.charAt(0).toUpperCase() + bike.type.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition-colors">
          {bike.name}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {bike.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-semibold">${bike.pricePerHour}</span>
            <span className="text-muted-foreground">/hr</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Gauge className="h-4 w-4 text-accent" />
            <span className="font-semibold">{bike.kmLimit}</span>
            <span className="text-muted-foreground">km limit</span>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-4">
          {bike.features.slice(0, 3).map((feature) => (
            <span
              key={feature}
              className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
            >
              {feature}
            </span>
          ))}
        </div>

        {/* Action Button */}
        <Button
          className="w-full"
          variant={bike.available ? 'default' : 'secondary'}
          disabled={!bike.available}
          onClick={() => onRent?.(bike)}
        >
          {bike.available ? 'Rent Now' : 'Not Available'}
        </Button>
      </div>
    </div>
  );
}
