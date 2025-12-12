import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BikeCard } from '@/components/BikeCard';
import { ArrowRight, Shield, Clock, Wallet, CheckCircle } from 'lucide-react';
import heroBike from '@/assets/hero-bike.png';
import { bikesAPI } from '@/lib/api';
import { Bike } from '@/types';

const features = [
  {
    icon: Shield,
    title: 'Fully Insured',
    description: 'All rentals include comprehensive insurance coverage.',
  },
  {
    icon: Clock,
    title: 'Flexible Hours',
    description: 'Rent by the hour, day, or week. Your schedule, your ride.',
  },
  {
    icon: Wallet,
    title: 'Easy Payments',
    description: 'Digital wallet for seamless transactions.',
  },
  {
    icon: CheckCircle,
    title: 'Verified Riders',
    description: 'Quick document verification for safe rentals.',
  },
];

export default function Index() {
  const [bikes, setBikes] = useState<Bike[]>([]);

  useEffect(() => {
    loadBikes();
  }, []);

  const loadBikes = async () => {
    try {
      const selectedLocation = localStorage.getItem('selectedLocation');
      const data = await bikesAPI.getAll(selectedLocation || undefined);
      setBikes(data);
    } catch (error) {
      console.error('Failed to load bikes:', error);
    }
  };

  const featuredBikes = bikes.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-8 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Now open in your city
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight">
                Ride the City
                <span className="block text-gradient">Your Way</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg">
                Premium bike rentals for every adventure. From electric rides to mountain trails,
                find your perfect match and explore like never before.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/garage">
                  <Button variant="hero" size="xl">
                    Browse Bikes
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button variant="dark" size="xl">
                    Create Account
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-4">
                <div>
                  <div className="text-3xl font-display font-bold text-primary">500+</div>
                  <div className="text-sm text-muted-foreground">Happy Riders</div>
                </div>
                <div>
                  <div className="text-3xl font-display font-bold text-primary">50+</div>
                  <div className="text-sm text-muted-foreground">Premium Bikes</div>
                </div>
                <div>
                  <div className="text-3xl font-display font-bold text-primary">24/7</div>
                  <div className="text-sm text-muted-foreground">Support</div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="relative z-10">
                <img
                  src={heroBike}
                  alt="Premium electric bike"
                  className="w-full max-w-lg mx-auto animate-float"
                />
              </div>
              {/* Decorative Elements */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border-2 border-dashed border-primary/20 animate-spin" style={{ animationDuration: '30s' }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Why Choose RideFlow?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We make bike rentals simple, safe, and enjoyable for everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-card p-6 rounded-2xl shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Bikes */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Featured Bikes
              </h2>
              <p className="text-muted-foreground">
                Our most popular rides, ready for your next adventure.
              </p>
            </div>
            <Link to="/garage">
              <Button variant="outline" className="hidden md:flex">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBikes.map((bike, index) => (
              <div
                key={bike.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <BikeCard bike={bike} />
              </div>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link to="/garage">
              <Button variant="outline">
                View All Bikes
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden gradient-dark p-8 md:p-16">
            <div className="relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-secondary-foreground mb-4">
                Ready to Ride?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Create your account today and get $10 credit for your first rental.
              </p>
              <Link to="/auth?mode=signup">
                <Button variant="hero" size="xl">
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full blur-3xl" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
