import { Bike } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gauge, Clock, Zap, Bike as BikeIcon } from 'lucide-react';

interface BikeCardProps {
  bike: Bike;
  onRent?: (bike: Bike) => void;
  variant?: 'grid' | 'list';
  pickupDateTime?: Date;
  dropoffDateTime?: Date;
  durationHours?: number;
}

const typeIcons = {
  fuel: Gauge,
  electric: Zap,
  scooter: BikeIcon,
};

const typeColors = {
  fuel: 'bg-accent/10 text-accent',
  electric: 'bg-primary/10 text-primary',
  scooter: 'bg-secondary text-secondary-foreground',
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

export function BikeCard({ bike, onRent, variant = 'grid', pickupDateTime, dropoffDateTime, durationHours }: BikeCardProps) {
  const TypeIcon = typeIcons[bike.type];

  if (variant === 'list') {
    return (
      <div className="bg-card rounded-2xl overflow-hidden shadow-card">
        <div className="relative h-44 overflow-hidden">
          {bike.image ? (
            <img src={bike.image} alt={bike.name} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <TypeIcon className="h-20 w-20 text-muted-foreground/20" />
            </div>
          )}
          <div className="absolute top-3 right-3 z-20">
            <Badge
              variant={bike.available ? 'default' : 'secondary'}
              className={bike.available ? 'bg-accent text-accent-foreground' : ''}
            >
              {bike.available ? 'Available' : 'In Use'}
            </Badge>
          </div>
          <div className="absolute top-3 left-3 z-20">
            <Badge className={typeColors[bike.type]}>
              <TypeIcon className="h-3 w-3 mr-1" />
              {bike.type.charAt(0).toUpperCase() + bike.type.slice(1)}
            </Badge>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <h3 className="font-display font-bold text-base">{bike.name}</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="h-3 w-3 text-primary" />
              <span className="font-semibold">₹{bike.pricePerHour}</span>
              <span className="text-muted-foreground">/hr</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Gauge className="h-3 w-3 text-accent" />
              <span className="font-semibold">{bike.kmLimit}</span>
              <span className="text-muted-foreground">km limit</span>
            </div>
          </div>
          {bike.location?.name && (
            <div className="text-xs text-muted-foreground">
              Available at <span className="font-semibold text-foreground">{bike.location.name}</span>
            </div>
          )}
          {(pickupDateTime && dropoffDateTime) && (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block">Pickup</span>
                <span className="font-medium">{formatTime(pickupDateTime)} {formatDate(pickupDateTime)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Dropoff</span>
                <span className="font-medium">{formatTime(dropoffDateTime)} {formatDate(dropoffDateTime)}</span>
              </div>
            </div>
          )}
          <Button
            className="w-full"
            variant={bike.available ? 'default' : 'secondary'}
            disabled={!bike.available}
            onClick={() => onRent?.(bike)}
          >
            {bike.available ? 'Book' : 'Not Available'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-500 hover:-translate-y-2">
      <div className="relative h-56 overflow-hidden">
        {bike.image ? (
          <img src={bike.image} alt={bike.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <TypeIcon className="h-24 w-24 text-muted-foreground/20" />
          </div>
        )}
        <div className="absolute top-4 right-4 z-20">
          <Badge
            variant={bike.available ? 'default' : 'secondary'}
            className={bike.available ? 'bg-accent text-accent-foreground' : ''}
          >
            {bike.available ? 'Available' : 'In Use'}
          </Badge>
        </div>
        <div className="absolute top-4 left-4 z-20">
          <Badge className={typeColors[bike.type]}>
            <TypeIcon className="h-3 w-3 mr-1" />
            {bike.type.charAt(0).toUpperCase() + bike.type.slice(1)}
          </Badge>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display font-bold text-base mb-2 group-hover:text-primary transition-colors">
          {bike.name}
        </h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="h-3 w-3 text-primary" />
            <span className="font-semibold">₹{bike.pricePerHour}</span>
            <span className="text-muted-foreground">/hr</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Gauge className="h-3 w-3 text-accent" />
            <span className="font-semibold">{bike.kmLimit}</span>
            <span className="text-muted-foreground">km limit</span>
          </div>
        </div>
        {(pickupDateTime && dropoffDateTime) && (
          <div className="flex items-center justify-between mb-4 bg-muted/30 p-3 rounded-lg border border-border/50">
            <div className="text-left">
              <div className="font-bold text-sm text-foreground">{formatTime(pickupDateTime)}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{formatDate(pickupDateTime)}</div>
            </div>
            <div className="flex flex-col items-center justify-center px-2">
               <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-bold z-10">to</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-sm text-foreground">{formatTime(dropoffDateTime)}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{formatDate(dropoffDateTime)}</div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 mt-auto">
          {(durationHours && durationHours > 0) ? (
            <div className="flex flex-col">
              <div className="font-bold text-xl text-foreground">
                ₹{Math.round(bike.pricePerHour * durationHours)}
              </div>
              <div className="text-[10px] text-muted-foreground">
                Total for {Math.round(durationHours)} hrs
              </div>
            </div>
          ) : null}
          <Button
            className={durationHours && durationHours > 0 ? "flex-1" : "w-full"}
            variant={bike.available ? 'default' : 'secondary'}
            disabled={!bike.available}
            onClick={() => onRent?.(bike)}
          >
            {bike.available ? 'Rent Now' : 'Not Available'}
          </Button>
        </div>
      </div>
    </div>
  );
}
