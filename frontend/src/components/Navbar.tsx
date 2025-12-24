import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bike, User, Menu, X, LogOut, Wallet, MapPin, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCurrentUser, authAPI, locationsAPI, rentalsAPI } from '@/lib/api';
import { Location } from '@/types';

// Helper function to format location name for display (removes "Main Garage" suffix)
const formatLocationDisplay = (loc: any): string => {
  if (!loc) return '';
  let displayName = loc.name || '';
  const city = loc.city || '';
  
  // Remove "Main Garage" or " - Main Garage" from the name
  displayName = displayName.replace(/\s*-\s*Main\s+Garage/gi, '').replace(/Main\s+Garage/gi, '').trim();
  
  // Remove duplicate city names (e.g., "Bangalore - Bangalore" -> "Bangalore")
  if (city) {
    const cityLower = city.toLowerCase();
    // Remove city name from the beginning if it's repeated
    displayName = displayName.replace(new RegExp(`^${city}\\s*-\\s*`, 'i'), '');
    // If what remains is just the city again, remove it
    if (displayName.toLowerCase() === cityLower) {
      displayName = '';
    }
  }
  
  // If location name is empty or matches city, just show city
  if (!displayName || displayName.toLowerCase() === city.toLowerCase()) {
    return city || displayName || '';
  }
  
  // If city exists and cleaned name doesn't start with city, show city - name
  if (city && !displayName.toLowerCase().startsWith(city.toLowerCase())) {
    return `${city} - ${displayName}`;
  }
  
  return displayName;
};

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [activeRide, setActiveRide] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    // Load locations
    loadLocations();
    
    // Load active ride if user is logged in
    if (currentUser && !['admin', 'superadmin'].includes(currentUser.role)) {
      loadActiveRide(currentUser);
      
      // Refresh active ride status every 30 seconds
      const interval = setInterval(() => {
        loadActiveRide(currentUser);
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [location]);

  const loadActiveRide = async (currentUser: any) => {
    try {
      const rentals = await rentalsAPI.getAll();
      // Only show active ride button when ride is started (ongoing/active), not when just confirmed
      const active = rentals.find((r: any) => {
        const rentalUserId = r.userId || r.user?.id;
        return (
          String(rentalUserId || '') === String(currentUser?.id || '') &&
          (r.status === 'ongoing' || r.status === 'active')
        );
      });
      setActiveRide(active || null);
    } catch (error) {
      console.error('Failed to load active ride:', error);
      setActiveRide(null);
    }
  };

  const loadLocations = async () => {
    try {
      const data = await locationsAPI.getAll();
      setLocations(data);
      
      const savedLocation = localStorage.getItem('selectedLocation') || '';
      let nextLocationId = '';
      const ids = new Set(data.map((l) => l.id));
      if (savedLocation && ids.has(savedLocation)) {
        nextLocationId = savedLocation;
      } else if (savedLocation) {
        const byName = data.find((l) => l.name === savedLocation);
        if (byName?.id) {
          nextLocationId = byName.id;
          localStorage.setItem('selectedLocation', byName.id);
        }
      }

      if (!nextLocationId && data.length > 0) {
        nextLocationId = data[0].id;
        localStorage.setItem('selectedLocation', nextLocationId);
      }

      if (nextLocationId) setSelectedLocation(nextLocationId);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
  };

  const handleLocationChange = (locationId: string) => {
    setSelectedLocation(locationId);
    localStorage.setItem('selectedLocation', locationId);
    // Reload page to show bikes for new location
    window.location.reload();
  };

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const isSuperAdmin = user?.role === 'superadmin';
  const navLinks = isSuperAdmin
    ? [
        { path: '/', label: 'Home' },
        { path: '/garage', label: 'Garage' },
        { path: '/dashboard', label: 'Dashboard' },
      ]
    : [
        { path: '/', label: 'Home' },
        { path: '/tariff', label: 'Garage' },
        { path: '/garage', label: 'Ride Finder' },
      ];

  const selectedLocationData = locations.find(loc => loc.id === selectedLocation);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-xl gradient-hero group-hover:shadow-glow transition-all duration-300">
              <Bike className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">RideFlow</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-medium transition-colors duration-200 ${
                  isActive(link.path)
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Location Selector & Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Active Ride Button */}
            {user && activeRide && !['admin', 'superadmin'].includes(user.role) && (
              <Link to="/active-ride">
                <Button variant="default" size="sm" className="bg-primary relative">
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                  </span>
                  <Activity className="h-4 w-4 mr-2" />
                  Ongoing Ride
                </Button>
              </Link>
            )}
            
            {/* Location Selector */}
            {locations.length > 0 && (
              <Select value={selectedLocation} onValueChange={handleLocationChange}>
                <SelectTrigger className="w-[150px]">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select location">
                    {selectedLocationData ? formatLocationDisplay(selectedLocationData) : 'Select location'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {formatLocationDisplay(loc)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm">
                      Admin
                    </Button>
                  </Link>
                )}
                {user.role === 'superadmin' && (
                  <Link to="/superadmin">
                    <Button variant="ghost" size="sm">
                      Super Admin
                    </Button>
                  </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span className="hidden sm:inline">{user.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center cursor-pointer">
                        <User className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center">
                      <Wallet className="h-4 w-4 mr-2" />
                      Wallet: ${user.walletBalance?.toFixed(2) || '0.00'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button variant="default" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              {/* Active Ride Button for Mobile */}
              {user && activeRide && !['admin', 'superadmin'].includes(user.role) && (
                <Link to="/active-ride" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="default" size="sm" className="w-full bg-primary relative">
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                    </span>
                    <Activity className="h-4 w-4 mr-2" />
                    Ongoing Ride
                  </Button>
                </Link>
              )}
              
              {/* Location Selector for Mobile */}
              {locations.length > 0 && (
                <Select value={selectedLocation} onValueChange={handleLocationChange}>
                  <SelectTrigger className="w-full">
                    <MapPin className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select location">
                      {selectedLocationData?.name || 'Select location'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`font-medium py-2 transition-colors ${
                    isActive(link.path)
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-3 pt-4 border-t border-border">
                {user ? (
                  <>
                    {user.role === 'superadmin' && (
                      <Link to="/dashboard" className="flex-1">
                        <Button variant="outline" className="w-full">
                          <User className="h-4 w-4 mr-2" />
                          Dashboard
                        </Button>
                      </Link>
                    )}
                    <Button variant="outline" className="flex-1" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth" className="flex-1">
                      <Button variant="outline" className="w-full">
                        Login
                      </Button>
                    </Link>
                    <Link to="/auth?mode=signup" className="flex-1">
                      <Button className="w-full">Sign Up</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
