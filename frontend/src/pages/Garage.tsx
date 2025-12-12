import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BikeCard } from '@/components/BikeCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bike } from '@/types';
import { Search, Filter, Zap, Mountain, Building, Trophy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { bikesAPI, getCurrentUser } from '@/lib/api';

const bikeTypes = [
  { value: 'all', label: 'All Bikes', icon: null },
  { value: 'electric', label: 'Electric', icon: Zap },
  { value: 'mountain', label: 'Mountain', icon: Mountain },
  { value: 'city', label: 'City', icon: Building },
  { value: 'sport', label: 'Sport', icon: Trophy },
];

export default function Garage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBikes();
  }, []);

  const loadBikes = async () => {
    try {
      setIsLoading(true);
      const data = await bikesAPI.getAll();
      setBikes(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load bikes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBikes = bikes.filter((bike) => {
    const matchesSearch = bike.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || bike.type === selectedType;
    const matchesAvailability = !showAvailableOnly || bike.available;
    return matchesSearch && matchesType && matchesAvailability;
  });

  const handleRent = async (bike: Bike) => {
    const user = getCurrentUser();
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login or create an account to rent a bike.",
      });
      navigate('/auth?mode=signup');
      return;
    }

    try {
      await rentalsAPI.create(bike.id);
      toast({
        title: "Rental Started",
        description: `You've started renting ${bike.name}. Check your dashboard for details.`,
      });
      // Reload bikes to update availability
      await loadBikes();
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start rental",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Our Garage
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Browse our collection of premium bikes. Each bike comes with full insurance,
              a helmet, and 24/7 roadside assistance.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-card rounded-2xl p-4 md:p-6 shadow-card mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search bikes..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Type Filters */}
              <div className="flex flex-wrap gap-2">
                {bikeTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant={selectedType === type.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType(type.value)}
                    className="gap-1.5"
                  >
                    {type.icon && <type.icon className="h-4 w-4" />}
                    {type.label}
                  </Button>
                ))}
              </div>

              {/* Availability Toggle */}
              <Button
                variant={showAvailableOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowAvailableOnly(!showAvailableOnly)}
                className="gap-1.5"
              >
                <Filter className="h-4 w-4" />
                Available Only
              </Button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredBikes.length}</span> bikes
            </p>
          </div>

          {/* Bike Grid */}
          {isLoading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Loading bikes...</p>
            </div>
          ) : filteredBikes.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBikes.map((bike, index) => (
                <div
                  key={bike.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <BikeCard bike={bike} onRent={handleRent} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">No bikes found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search query.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
