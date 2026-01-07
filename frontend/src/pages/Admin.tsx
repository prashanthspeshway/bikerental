import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Bike,
  Users,
  FileText,
  Settings,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  LogOut,
  Menu,
  LayoutDashboard,
  IndianRupee,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Shield,
  Mail,
  Phone,
  Calendar,
  Wrench,
  Download,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { bikesAPI, usersAPI, documentsAPI, rentalsAPI, authAPI, getCurrentUser, locationsAPI } from '@/lib/api';
import { Bike as BikeType } from '@/types';
import { useTheme } from 'next-themes';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetClose, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const statusStyles = {
  verified: { color: 'bg-accent/10 text-accent', icon: CheckCircle },
  pending: { color: 'bg-primary/10 text-primary', icon: Clock },
  unverified: { color: 'bg-destructive/10 text-destructive', icon: XCircle },
  approved: { color: 'bg-accent/10 text-accent', icon: CheckCircle },
  rejected: { color: 'bg-destructive/10 text-destructive', icon: XCircle },
};

const adminTabIds = ['dashboard', 'bikes', 'allVehicles', 'bookings', 'users', 'documents', 'settings'] as const;

// Helper function to format location name for display (removes "Main Garage" suffix)
const formatLocationDisplay = (loc: any): string => {
  if (!loc) return '';
  // Show only the city name as per requirement
  return loc.city || loc.name || '';
};

export default function Admin() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTabParam = new URLSearchParams(window.location.search).get('tab') || '';
  const [activeTab, setActiveTab] = useState(
    adminTabIds.includes(initialTabParam as any) ? initialTabParam : 'dashboard'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [bikes, setBikes] = useState<BikeType[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [rentals, setRentals] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedDocumentUser, setSelectedDocumentUser] = useState<any>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'pending'>('all');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [bikeDialogOpen, setBikeDialogOpen] = useState(false);
  const [editingBike, setEditingBike] = useState<any | null>(null);
  const [bikeForm, setBikeForm] = useState<any>({ name: '', brand: '', type: 'fuel', pricePerHour: '', kmLimit: '', locationId: '', image: '' });
  const [brandSearch, setBrandSearch] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');
  const [allVehiclesSearchQuery, setAllVehiclesSearchQuery] = useState('');
  const [viewImagesDialog, setViewImagesDialog] = useState(false);
  const [selectedRentalImages, setSelectedRentalImages] = useState<string[]>([]);
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  const setTab = (tabId: string) => {
    setActiveTab(tabId);
    const next = new URLSearchParams(searchParams);
    next.set('tab', tabId);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && adminTabIds.includes(tabParam as any) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    if (user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Admin access required",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }
    setCurrentUser(user);
    loadData();
  }, []);

  // Auto-refresh bookings data every 10 seconds when bookings tab is active
  useEffect(() => {
    if (activeTab === 'bookings' && currentUser && selectedLocationId) {
      const interval = setInterval(() => {
        // Only refresh rentals and bikes data filtered by location
        const refreshBookingsData = async () => {
          try {
            const bikesData = await bikesAPI.getAll(selectedLocationId);
            setBikes(bikesData);
            const rentalsData = await rentalsAPI.getAll();
            setRentals(rentalsData);
          } catch (error) {
            // Silently fail on auto-refresh to avoid spam
            // Errors are handled silently in production
          }
        };
        refreshBookingsData();
      }, 10000); // Refresh every 10 seconds

      return () => clearInterval(interval);
    }
  }, [activeTab, currentUser, selectedLocationId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const current = getCurrentUser();
      const assignedLocationId =
        typeof current?.locationId === 'object'
          ? current.locationId?.id || current.locationId?._id || current.locationId?.toString?.()
          : current?.locationId;

      const rawSavedLocation = localStorage.getItem('selectedLocation') || '';
      let normalizedLocationId = assignedLocationId || rawSavedLocation;

      try {
        const locationsData = await locationsAPI.getAll();
        setLocations(locationsData);
        const ids = new Set(locationsData.map((l: any) => l.id));
        if (assignedLocationId && ids.has(assignedLocationId)) {
          normalizedLocationId = assignedLocationId;
          localStorage.setItem('selectedLocation', assignedLocationId);
        }
        if (normalizedLocationId && !ids.has(normalizedLocationId)) {
          const byName = locationsData.find((l: any) => l.name === normalizedLocationId);
          if (byName?.id) {
            normalizedLocationId = byName.id;
            localStorage.setItem('selectedLocation', byName.id);
          }
        }
        if (!normalizedLocationId && locationsData.length > 0) {
          normalizedLocationId = locationsData[0].id;
          localStorage.setItem('selectedLocation', normalizedLocationId);
        }
      } catch {
        setLocations([]);
      }

      setSelectedLocationId(normalizedLocationId);
      // Fetch bikes filtered by admin's location
      try {
        const bikesData = await bikesAPI.getAll(normalizedLocationId || undefined);
        setBikes(bikesData);
      } catch (err) {
        setBikes([]);
      }
      // Fetch rentals (admin/user scoped) - will filter by location later
      try {
        const rentalsData = await rentalsAPI.getAll();
        setRentals(rentalsData);
      } catch {
        setRentals([]);
      }
      // Fetch users (admin) - will filter by location later
      try {
        const usersData = await usersAPI.getAll();
        setUsers(usersData);
      } catch (err: any) {
        setUsers([]);
      }
      // Fetch documents (auth) - will filter by location later
      try {
        const docsData = await documentsAPI.getAll();
        setDocuments(docsData);
      } catch {
        setDocuments([]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate('/');
  };

  const handleDocumentAction = async (docId: string, action: 'approve' | 'reject') => {
    try {
      const status = action === 'approve' ? 'approved' : 'rejected';
      await documentsAPI.updateStatus(docId, status);
      toast({
        title: `Document ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: 'Document status updated successfully.',
      });
      loadData();
    } catch (error: any) {
      if (error.status === 401 || error.status === 403) {
        navigate('/auth');
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update document",
        variant: "destructive",
      });
    }
  };
  
  const handleViewUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive",
      });
      return;
    }
    setSelectedUser(user);
    setIsUserDialogOpen(true);
  };

  const handleViewUserDocuments = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive",
      });
      return;
    }
    setSelectedDocumentUser(user);
    setIsDocumentDialogOpen(true);
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      await usersAPI.update(userId, { isVerified: true });
      toast({
        title: "User Verified",
        description: "User status updated to verified.",
      });
      setIsUserDialogOpen(false);
      setIsDocumentDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify user",
        variant: "destructive",
      });
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bikes', label: 'Bikes', icon: Bike },
    { id: 'allVehicles', label: 'All Vehicles', icon: Bike },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const bikesById: Record<string, BikeType> = Object.fromEntries(bikes.map(b => [b.id, b]));
  const inUseRentals = rentals.filter((r) => (r.status === 'ongoing' || r.status === 'active') && bikesById[r.bikeId]);
  const inUseBikeIds = new Set(inUseRentals.map(r => r.bikeId));
  const availableCount = bikes.filter(b => b.available).length;
  const inUseCount = inUseRentals.length;
  const maintenanceCount = bikes.filter(b => !b.available && !inUseBikeIds.has(b.id)).length;
  const stats = [
    { label: 'Total Bikes', value: bikes.length, icon: Bike, color: 'gradient-hero', onClick: () => setTab('bikes') },
    { label: 'Available', value: availableCount, icon: Bike, color: 'bg-accent', onClick: () => setTab('bikes') },
    { label: 'In Use', value: inUseCount, icon: Bike, color: 'bg-primary', onClick: () => setTab('bookings') },
    { label: 'Maintenance', value: maintenanceCount, icon: Wrench, color: 'bg-secondary' },
  ];

  const rentalsForLocation = rentals.filter((r) => {
    const bike = bikesById[r.bikeId] || r.bike;
    if (!bike) return false;
    if (!selectedLocationId) return false;
    const bikeLocationId =
      typeof bike.locationId === 'object'
        ? bike.locationId?.id || bike.locationId?._id || bike.locationId?.toString?.()
        : bike.locationId;
    return bikeLocationId ? bikeLocationId === selectedLocationId : false;
  });

  const selectedCity = String(locations.find((l) => l.id === selectedLocationId)?.city || '').trim().toLowerCase();
  // Filter users strictly by their current location (ID match or city match)
  const usersForLocation = users.filter((user) => {
    const userLocId = String(user.currentLocationId || '').trim();
    if (selectedLocationId) {
      if (userLocId && userLocId === selectedLocationId) return true;
    }
    if (!selectedCity) return false;
    const addr = String(user.currentAddress || '').trim().toLowerCase();
    return addr === selectedCity || addr.startsWith(`${selectedCity} -`);
  });
  const filteredUsers = usersForLocation
    .filter(user => {
      if (userStatusFilter === 'active') return user.isVerified;
      if (userStatusFilter === 'pending') return !user.isVerified;
      return true;
    })
    .filter(user =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  const userById: Record<string, any> = Object.fromEntries(users.map((u) => [u.id, u]));
  const documentsForLocation = selectedLocationId
    ? documents.filter((d) => {
        const docUser = userById[d.userId];
        if (!docUser) return false;
        const docUserLocationId = String(docUser.currentLocationId || '').trim();
        if (docUserLocationId && docUserLocationId === selectedLocationId) return true;
        if (!selectedCity) return false;
        const currentAddress = String(docUser.currentAddress || '').trim().toLowerCase();
        return currentAddress === selectedCity || currentAddress.startsWith(`${selectedCity} -`);
      })
    : documents;
  const today = new Date().toISOString().slice(0, 10);
  const pickupsToday = rentalsForLocation.filter(r => r.startTime?.slice(0, 10) === today).length;
  const dropoffsToday = rentalsForLocation.filter(r => r.endTime && r.endTime.slice(0, 10) === today).length;
  const pendingDocsCount = documentsForLocation.filter(d => d.status === 'pending').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border p-4 flex-col h-full overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="p-2 rounded-xl gradient-hero">
            <Bike className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold">RideFlow</span>
              <Badge variant="secondary" className="text-xs">Admin</Badge>
            </div>
            {selectedLocationId && locations.find(loc => loc.id === selectedLocationId) && (
              <div className="mt-1">
                <Badge variant="outline" className="text-xs flex items-center gap-1 w-fit">
                  <MapPin className="h-3 w-3" />
                  {formatLocationDisplay(locations.find(loc => loc.id === selectedLocationId))}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setTab(tab.id);
                if (tab.id === 'users') setUserStatusFilter('all');
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* User Info & Actions */}
        <div className="space-y-2 pt-4 border-t border-border">
          <div className="px-4 py-2 text-sm">
            <p className="font-medium">{currentUser?.name}</p>
            <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
          </div>
          {mounted && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-5 w-5" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="h-5 w-5" />
                  Dark Mode
                </>
              )}
            </Button>
          )}
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="md:hidden mb-4 flex items-center justify-between gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl gradient-hero">
                    <Bike className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold">RideFlow</span>
                      <Badge variant="secondary" className="text-xs">Admin</Badge>
                    </div>
                    {selectedLocationId && locations.find(loc => loc.id === selectedLocationId) && (
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs flex items-center gap-1 w-fit">
                          <MapPin className="h-3 w-3" />
                          {formatLocationDisplay(locations.find(loc => loc.id === selectedLocationId))}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-2">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <SheetClose asChild key={tab.id}>
                      <button
                        onClick={() => {
                          setTab(tab.id);
                          if (tab.id === 'users') setUserStatusFilter('all');
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <tab.icon className="h-5 w-5" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    </SheetClose>
                  ))}
                </nav>
              </div>

              <div className="mt-auto space-y-2 pt-4 border-t border-border">
                  <div className="px-4 py-2 text-sm">
                    <p className="font-medium">{currentUser?.name}</p>
                    <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
                  </div>
                  {mounted && (
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-muted-foreground"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      >
                        {theme === 'dark' ? (
                          <>
                            <Sun className="h-5 w-5" />
                            Light Mode
                          </>
                        ) : (
                          <>
                            <Moon className="h-5 w-5" />
                            Dark Mode
                          </>
                        )}
                      </Button>
                    </SheetClose>
                  )}
                  <SheetClose asChild>
                    <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleLogout}>
                      <LogOut className="h-5 w-5" />
                      Logout
                    </Button>
                  </SheetClose>
                </div>
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <p className="font-display font-semibold truncate">Admin</p>
            <p className="text-xs text-muted-foreground truncate">
              {tabs.find((t) => t.id === activeTab)?.label}
            </p>
          </div>
        </div>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-display font-bold">Dashboard</h1>
                  {selectedLocationId && locations.find(loc => loc.id === selectedLocationId) && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-lg">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">
                        {formatLocationDisplay(locations.find(loc => loc.id === selectedLocationId))}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-muted-foreground">Operational overview for your assigned city/garage.</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div 
                  key={stat.label} 
                  className={`bg-card rounded-2xl shadow-card p-6 ${stat.onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
                  onClick={stat.onClick}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-display font-bold">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-card rounded-2xl shadow-card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Today’s Pickups</p>
                    <p className="text-2xl font-display font-bold">{pickupsToday}</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-2xl shadow-card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Today’s Drop-offs</p>
                    <p className="text-2xl font-display font-bold">{dropoffsToday}</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-2xl shadow-card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending KYC</p>
                    <p className="text-2xl font-display font-bold">{pendingDocsCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bikes */}
        {activeTab === 'bikes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-display font-bold mb-2">Bike Inventory</h1>
                <p className="text-muted-foreground">View and update bike status for your city.</p>
              </div>
            </div>

            <div className="bg-card rounded-2xl shadow-card overflow-hidden">
              <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-4 font-medium">Bike</th>
                    <th className="text-left px-6 py-4 font-medium">Type</th>
                    <th className="text-left px-6 py-4 font-medium">Price/Hr</th>
                    <th className="text-left px-6 py-4 font-medium">KM Limit</th>
                    <th className="text-left px-6 py-4 font-medium">Status</th>
                    <th className="text-left px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bikes.map((bike) => (
                    <tr key={bike.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4 font-medium">{bike.name}</td>
                      <td className="px-6 py-4 capitalize">{bike.type}</td>
                      <td className="px-6 py-4">₹{bike.pricePerHour}</td>
                      <td className="px-6 py-4">{bike.kmLimit} km</td>
                      <td className="px-6 py-4">
                        <Badge variant={bike.available ? 'default' : 'secondary'} className={bike.available ? 'bg-accent text-accent-foreground' : ''}>
                          {inUseBikeIds.has(bike.id) ? 'In Use' : bike.available ? 'Available' : 'Maintenance'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {inUseBikeIds.has(bike.id) ? (
                            <Badge className="bg-muted text-muted-foreground">Ride Active</Badge>
                          ) : bike.available ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    await bikesAPI.update(bike.id, { available: false });
                                    toast({ title: "Marked Maintenance", description: `${bike.name} disabled for booking.` });
                                    loadData();
                                  } catch (e: any) {
                                    toast({ title: "Error", description: e.message || "Failed to update bike", variant: "destructive" });
                                  }
                                }}
                              >
                                <Wrench className="h-4 w-4 mr-2" />
                                Maintenance
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    await bikesAPI.update(bike.id, { available: false });
                                    toast({ title: "Temporarily Disabled", description: `${bike.name} disabled for booking.` });
                                    loadData();
                                  } catch (e: any) {
                                    toast({ title: "Error", description: e.message || "Failed to update bike", variant: "destructive" });
                                  }
                                }}
                              >
                                Disable
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              onClick={async () => {
                                try {
                                  await bikesAPI.update(bike.id, { available: true });
                                  toast({ title: "Enabled", description: `${bike.name} is now available.` });
                                  loadData();
                                } catch (e: any) {
                                  toast({ title: "Error", description: e.message || "Failed to update bike", variant: "destructive" });
                                }
                              }}
                            >
                              Enable
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}

        {/* All Vehicles */}
        {activeTab === 'allVehicles' && (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-display font-bold mb-2">All Vehicles</h1>
                <p className="text-muted-foreground">
                  Add, edit, or remove vehicles from {selectedLocationId && locations.find(loc => loc.id === selectedLocationId) 
                    ? formatLocationDisplay(locations.find(loc => loc.id === selectedLocationId)) 
                    : 'your location'}.
                </p>
              </div>
              <Button
                className="w-full sm:w-auto"
                onClick={() => {
                  setEditingBike(null);
                  setBikeForm({ 
                    name: '', 
                    brand: '', 
                    type: 'fuel', 
                    pricePerHour: '', 
                    kmLimit: '', 
                    locationId: currentUser?.role === 'superadmin' ? '' : (selectedLocationId || ''), 
                    image: '' 
                  });
                  setBikeDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </div>
            <div className="bg-card rounded-2xl shadow-card overflow-hidden">
              <div className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="w-full flex items-center gap-2 sm:flex-1">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search vehicles..." 
                      value={allVehiclesSearchQuery}
                      onChange={(e) => setAllVehiclesSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={selectedBrandFilter} onValueChange={setSelectedBrandFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by Brand" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {Array.from(new Set(bikes.map((b) => ((b.brand || '').trim() || 'Unbranded'))))
                        .sort()
                        .map((brand) => (
                          <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4">
                {bikes
                  .filter((bike) => {
                    const matchesSearch = allVehiclesSearchQuery === '' || 
                      bike.name.toLowerCase().includes(allVehiclesSearchQuery.toLowerCase()) ||
                      (bike.brand && bike.brand.toLowerCase().includes(allVehiclesSearchQuery.toLowerCase()));
                    const matchesBrand = selectedBrandFilter === 'all' || 
                      ((bike.brand || '').trim() || 'Unbranded') === selectedBrandFilter;
                    return matchesSearch && matchesBrand;
                  })
                  .map((bike) => (
                  <div key={bike.id} className="border rounded-lg p-2 sm:p-3 flex flex-col bg-card h-full min-w-0">
                    {bike.image && (
                      <div className="relative mb-2 h-32 sm:h-40 md:h-48 bg-muted rounded-md overflow-hidden flex items-center justify-center flex-shrink-0">
                        <img 
                          src={bike.image} 
                          alt={bike.name} 
                          className="max-w-full max-h-full object-contain rounded-md"
                          style={{ imageRendering: 'auto' as const }}
                        />
                        <Badge variant="secondary" className="absolute top-2 right-2 text-xs">{bike.type}</Badge>
                      </div>
                    )}
                    {!bike.image && (
                      <div className="relative mb-2 bg-muted rounded-md h-32 sm:h-40 md:h-48 flex items-center justify-center flex-shrink-0">
                        <Badge variant="secondary" className="absolute top-2 right-2 text-xs">{bike.type}</Badge>
                        <Bike className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="flex-1 flex flex-col min-w-0">
                      <p className="font-medium mb-1 truncate">{bike.name}</p>
                      {bike.brand && <p className="text-xs text-muted-foreground mb-2 truncate">Brand: {bike.brand}</p>}
                      <div className="mt-auto flex items-center justify-between pt-2 gap-2">
                        <p className="text-sm font-semibold text-foreground whitespace-nowrap">₹{bike.pricePerHour}/hr</p>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setEditingBike(bike);
                              setBikeForm({
                                name: bike.name,
                                brand: bike.brand || '',
                                type: bike.type,
                                pricePerHour: String(bike.pricePerHour),
                                kmLimit: String(bike.kmLimit),
                                locationId: currentUser?.role === 'superadmin' ? bike.locationId : (selectedLocationId || bike.locationId),
                                image: bike.image || '',
                              });
                              setBikeDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2 text-xs"
                            onClick={async () => {
                              try {
                                await bikesAPI.delete(bike.id);
                                toast({ title: 'Vehicle deleted' });
                                loadData();
                              } catch (e: any) {
                                toast({ title: 'Error', description: e.message || 'Failed to delete vehicle', variant: 'destructive' });
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bookings */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-display font-bold mb-2">Bookings</h1>
              <p className="text-muted-foreground">
                Manage bookings in {selectedLocationId && locations.find(loc => loc.id === selectedLocationId) 
                  ? formatLocationDisplay(locations.find(loc => loc.id === selectedLocationId)) 
                  : 'your location'}.
              </p>
            </div>
            <div className="bg-card rounded-2xl shadow-card overflow-hidden">
              <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-4 font-medium">Booking</th>
                    <th className="text-left px-6 py-4 font-medium">Bike</th>
                    <th className="text-left px-6 py-4 font-medium">User</th>
                    <th className="text-left px-6 py-4 font-medium">Start</th>
                    <th className="text-left px-6 py-4 font-medium">End</th>
                    <th className="text-left px-6 py-4 font-medium">Status</th>
                    <th className="text-left px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rentalsForLocation.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                          <p className="text-lg font-medium text-muted-foreground mb-2">No bookings found</p>
                          <p className="text-sm text-muted-foreground">There are no bookings for your location yet.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    rentalsForLocation.map((r) => {
                      const bike = bikesById[r.bikeId] || r.bike;
                      const user = users.find(u => u.id === r.userId) || r.user;
                      return (
                        <tr key={r.id} className="hover:bg-muted/30">
                          <td className="px-6 py-4 font-medium">#{r.id.slice(0,8)}</td>
                          <td className="px-6 py-4">{bike?.name || r.bikeId}</td>
                          <td className="px-6 py-4">{user?.name || r.userId}</td>
                          <td className="px-6 py-4">{new Date(r.pickupTime || r.startTime).toLocaleString()}</td>
                          <td className="px-6 py-4">{r.dropoffTime || r.endTime ? new Date(r.dropoffTime || r.endTime).toLocaleString() : '-'}</td>
                          <td className="px-6 py-4">
                            <Badge className={statusStyles[r.status as keyof typeof statusStyles]?.color || 'bg-muted'}>
                              {r.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const bike = bikesById[r.bikeId] || r.bike;
                                  const imgs = Array.isArray(r.userImages) && r.userImages.length > 0
                                    ? r.userImages
                                    : (bike?.image ? [bike.image] : []);
                                  setSelectedRentalImages(imgs);
                                  setViewImagesDialog(true);
                                }}
                                title="View User Images"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {r.status === 'confirmed' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        await rentalsAPI.startRide(r.id);
                                        toast({ title: "Ride Started", description: "Booking started successfully." });
                                        loadData();
                                      } catch (e: any) {
                                        toast({ title: "Error", description: e.message || "Failed to start ride", variant: "destructive" });
                                      }
                                    }}
                                  >
                                    Start Ride
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        await rentalsAPI.cancel(r.id);
                                        toast({ title: "Booking Cancelled", description: "Booking cancelled successfully." });
                                        loadData();
                                      } catch (e: any) {
                                        toast({ title: "Error", description: e.message || "Failed to cancel", variant: "destructive" });
                                      }
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              )}
                              {(r.status === 'ongoing' || r.status === 'active') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      await rentalsAPI.completeRide(r.id);
                                      toast({ title: "Ride Ended", description: "Booking closed successfully." });
                                      loadData();
                                    } catch (e: any) {
                                      toast({ title: "Error", description: e.message || "Failed to end ride", variant: "destructive" });
                                    }
                                  }}
                                >
                                  End Ride
                                </Button>
                              )}
                              {(r.status === 'completed' || r.status === 'cancelled') && (
                                <Button variant="ghost" size="sm" disabled className="text-muted-foreground">
                                  No actions available
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={async () => {
                                  if (confirm('Are you sure you want to delete this rental? This action cannot be undone.')) {
                                    try {
                                      await rentalsAPI.delete(r.id);
                                      toast({ title: "Rental Deleted", description: "Rental has been deleted successfully." });
                                      loadData();
                                    } catch (e: any) {
                                      toast({ title: "Error", description: e.message || "Failed to delete rental", variant: "destructive" });
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-display font-bold mb-2">Users</h1>
              <p className="text-muted-foreground">
                Manage registered users in {selectedLocationId && locations.find(loc => loc.id === selectedLocationId) 
                  ? formatLocationDisplay(locations.find(loc => loc.id === selectedLocationId)) 
                  : 'your location'} and their verification status.
              </p>
            </div>

            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="bg-card rounded-2xl shadow-card overflow-hidden">
              <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-4 font-medium">User</th>
                    <th className="text-left px-6 py-4 font-medium">Role</th>
                    <th className="text-left px-6 py-4 font-medium">Documents</th>
                    <th className="text-left px-6 py-4 font-medium">Status</th>
                    <th className="text-left px-6 py-4 font-medium">Joined</th>
                    <th className="text-left px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => {
                    const docCount = user.documents?.length || 0;
                    const status = user.isVerified ? 'verified' : docCount > 0 ? 'pending' : 'unverified';
                    const StatusIcon = statusStyles[status as keyof typeof statusStyles].icon;
                    return (
                      <tr key={user.id} className="hover:bg-muted/30">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">{docCount}</td>
                        <td className="px-6 py-4">
                          <Badge className={statusStyles[status as keyof typeof statusStyles].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <Button variant="ghost" size="sm" onClick={() => handleViewUser(user.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        )}

        {/* Documents */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-display font-bold mb-2">User Documents</h1>
              <p className="text-muted-foreground">
                View user-submitted documents for {selectedLocationId && locations.find(loc => loc.id === selectedLocationId) 
                  ? formatLocationDisplay(locations.find(loc => loc.id === selectedLocationId)) 
                  : 'your location'}. Verify and approve documents.
              </p>
            </div>

            <div className="grid gap-4">
              {(() => {
                // Get unique users who have documents (not just those with rentals)
                const userIdsWithDocs = new Set(documentsForLocation.map(d => d.userId));
                const usersWithDocs = users.filter(u => userIdsWithDocs.has(u.id))
                  .filter(user =>
                    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                
                if (usersWithDocs.length === 0) {
                  return (
                    <p className="text-muted-foreground text-center py-8">No users with documents found</p>
                  );
                }
                
                return usersWithDocs.map((user) => {
                  const userDocs = documentsForLocation.filter(doc => doc.userId === user.id);
                  if (userDocs.length === 0) return null;
                  
                  const pendingCount = userDocs.filter(d => d.status === 'pending').length;
                  const approvedCount = userDocs.filter(d => d.status === 'approved').length;
                  const rejectedCount = userDocs.filter(d => d.status === 'rejected').length;
                  
                  return (
                    <div key={user.id} className="bg-card rounded-2xl shadow-card p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-sm text-muted-foreground">{user.mobile || '-'}</p>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                              <p className="text-sm">
                                <span className="text-muted-foreground">Emergency Contact: </span>
                                <span className="text-foreground">{user.emergencyContact || '-'}</span>
                              </p>
                              <p className="text-sm">
                                <span className="text-muted-foreground">Family Contact: </span>
                                <span className="text-foreground">{user.familyContact || '-'}</span>
                              </p>
                              <p className="text-sm md:col-span-2">
                                <span className="text-muted-foreground">Permanent Address: </span>
                                <span className="text-foreground">{user.permanentAddress || '-'}</span>
                              </p>
                              <p className="text-sm">
                                <span className="text-muted-foreground">Current Location: </span>
                                <span className="text-foreground">{user.currentAddress || '-'}</span>
                              </p>
                              <p className="text-sm">
                                <span className="text-muted-foreground">Hotel Stay: </span>
                                <span className="text-foreground">{user.hotelStay || '-'}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewUserDocuments(user.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Documents
                        </Button>
                      </div>
                      
                      <div className="flex gap-4 mb-4">
                        <Badge variant="outline" className="bg-primary/10">
                          Total: {userDocs.length}
                        </Badge>
                        {pendingCount > 0 && (
                          <Badge className="bg-primary/10 text-primary">
                            Pending: {pendingCount}
                          </Badge>
                        )}
                        {approvedCount > 0 && (
                          <Badge className="bg-accent/10 text-accent">
                            Approved: {approvedCount}
                          </Badge>
                        )}
                        {rejectedCount > 0 && (
                          <Badge className="bg-destructive/10 text-destructive">
                            Rejected: {rejectedCount}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {userDocs.map((doc) => {
                          const StatusIcon = statusStyles[doc.status as keyof typeof statusStyles].icon;
                          return (
                            <div key={doc.id} className="border rounded-lg p-3 bg-muted/30">
                              <div className="flex items-center justify-between mb-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <Badge className={statusStyles[doc.status as keyof typeof statusStyles].color} variant="outline">
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {doc.status}
                                </Badge>
                              </div>
                              <p className="text-xs font-medium mb-1">{doc.type.replace('_', ' ')}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }).filter(Boolean);
              })()}
            </div>
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-display font-bold mb-2">Settings</h1>
              <p className="text-muted-foreground">Configure your admin preferences.</p>
            </div>

            <div className="bg-card rounded-2xl shadow-card p-6">
              <p className="text-muted-foreground text-center py-8">
                Settings panel coming soon.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Vehicle Create/Edit Dialog */}
      <Dialog open={bikeDialogOpen} onOpenChange={setBikeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBike ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
            <DialogDescription>Enter vehicle details</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name" value={bikeForm.name} onChange={(e) => setBikeForm({ ...bikeForm, name: e.target.value })} />
            <Input placeholder="Brand" value={bikeForm.brand || ''} onChange={(e) => setBikeForm({ ...bikeForm, brand: e.target.value })} />
            <Select value={bikeForm.type} onValueChange={(v) => setBikeForm({ ...bikeForm, type: v })}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fuel">Fuel</SelectItem>
                <SelectItem value="electric">Electric</SelectItem>
                <SelectItem value="scooter">Scooter</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Price Per Hour" value={bikeForm.pricePerHour} onChange={(e) => setBikeForm({ ...bikeForm, pricePerHour: e.target.value })} />
            <Input placeholder="KM Limit" value={bikeForm.kmLimit} onChange={(e) => setBikeForm({ ...bikeForm, kmLimit: e.target.value })} />
            {currentUser?.role === 'superadmin' && (
              <Select value={bikeForm.locationId} onValueChange={(v) => setBikeForm({ ...bikeForm, locationId: v })}>
                <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>{formatLocationDisplay(loc)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="space-y-2">
              <Input placeholder="Image URL" value={bikeForm.image} onChange={(e) => setBikeForm({ ...bikeForm, image: e.target.value })} />
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const res = await documentsAPI.uploadFile(file, file.name, 'bike_image');
                      if (res?.fileUrl) {
                        setBikeForm({ ...bikeForm, image: res.fileUrl });
                        toast({ title: 'Image uploaded', description: 'Vehicle image has been uploaded' });
                      } else {
                        toast({ title: 'Upload failed', description: 'No file URL returned', variant: 'destructive' });
                      }
                    } catch (err: any) {
                      toast({ title: 'Upload error', description: err.message || 'Failed to upload image', variant: 'destructive' });
                    }
                  }}
                />
                {bikeForm.image && (
                  <img src={bikeForm.image} alt="Preview" className="w-16 h-16 object-cover rounded-md border" />
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  try {
                    const payload = {
                      name: bikeForm.name,
                      brand: (bikeForm.brand || '').trim(),
                      type: bikeForm.type,
                      pricePerHour: parseFloat(bikeForm.pricePerHour),
                      kmLimit: parseInt(bikeForm.kmLimit),
                      locationId: currentUser?.role === 'superadmin' ? bikeForm.locationId : selectedLocationId,
                      image: bikeForm.image,
                    };
                    if (editingBike) {
                      await bikesAPI.update(editingBike.id, payload);
                      toast({ title: 'Vehicle updated' });
                    } else {
                      await bikesAPI.create(payload);
                      toast({ title: 'Vehicle created' });
                    }
                    setBikeDialogOpen(false);
                    setEditingBike(null);
                    loadData();
                  } catch (e: any) {
                    toast({ title: 'Error', description: e.message || 'Failed to save vehicle', variant: 'destructive' });
                  }
                }}
              >
                {editingBike ? 'Save' : 'Create'}
              </Button>
              <Button variant="outline" onClick={() => setBikeDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View and verify user information and documents
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* User Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm font-medium">{selectedUser.name}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm font-medium">{selectedUser.email}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Mobile</label>
                  <p className="text-sm font-medium">{selectedUser.mobile || 'Not provided'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <Badge variant={selectedUser.role === 'admin' ? 'default' : 'secondary'}>
                    {selectedUser.role}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Wallet Balance</label>
                  <p className="text-sm font-medium">₹{selectedUser.walletBalance?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  {selectedUser.isVerified ? (
                    <Badge className="bg-accent/10 text-accent">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge className="bg-destructive/10 text-destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Unverified
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Joined</label>
                  <p className="text-sm font-medium">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <h3 className="font-semibold">Documents</h3>
                {selectedUser.documents && selectedUser.documents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedUser.documents.map((doc: any) => {
                      const StatusIcon = statusStyles[doc.status as keyof typeof statusStyles].icon;
                      return (
                        <div key={doc.id || doc._id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                              <FileText className="h-5 w-5 text-secondary-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <p className="text-sm text-muted-foreground">{doc.type} • {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className={statusStyles[doc.status as keyof typeof statusStyles].color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                            </Badge>
                            {doc.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleDocumentAction(doc.id || doc._id, 'reject')}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => handleDocumentAction(doc.id || doc._id, 'approve')}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No documents uploaded</p>
                )}
              </div>

              {/* Actions */}
              {!selectedUser.isVerified && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={() => handleVerifyUser(selectedUser.id)}>
                    <Shield className="h-4 w-4 mr-2" />
                    Verify User
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User Documents Dialog */}
      <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" className="gap-1 pl-0 text-muted-foreground hover:text-foreground" onClick={() => setIsDocumentDialogOpen(false)}>
              <ChevronLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>
          <DialogHeader>
            <DialogTitle>User Documents Review</DialogTitle>
            <DialogDescription>
              Review and verify documents for {selectedDocumentUser?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDocumentUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedDocumentUser.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedDocumentUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mobile</p>
                    <p className="font-medium">{selectedDocumentUser.mobile || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {selectedDocumentUser.isVerified ? (
                      <Badge className="bg-accent/10 text-accent">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-destructive/10 text-destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Unverified
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Emergency Contact</p>
                    <p className="font-medium">{selectedDocumentUser.emergencyContact || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Family Contact</p>
                    <p className="font-medium">{selectedDocumentUser.familyContact || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Permanent Address</p>
                    <p className="font-medium">{selectedDocumentUser.permanentAddress || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Location</p>
                    <p className="font-medium">{selectedDocumentUser.currentAddress || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hotel Stay</p>
                    <p className="font-medium">{selectedDocumentUser.hotelStay || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Documents Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {selectedDocumentUser.documents && selectedDocumentUser.documents.length > 0 ? (
                  selectedDocumentUser.documents.map((doc: any) => {
                    const StatusIcon = statusStyles[doc.status as keyof typeof statusStyles].icon;
                    return (
                      <div key={doc.id || doc._id} className="border rounded-lg p-4 bg-card">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold">{doc.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                            <p className="text-xs text-muted-foreground">{doc.name}</p>
                          </div>
                          <Badge className={statusStyles[doc.status as keyof typeof statusStyles].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {doc.status}
                          </Badge>
                        </div>
                        
                        {/* Document Preview */}
                        <div className="mb-3 border rounded-lg overflow-hidden bg-muted/30">
                          {doc.url && (
                            <img 
                              src={doc.url} 
                              alt={doc.name}
                              className="w-full h-48 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/documents/placeholder.pdf';
                              }}
                            />
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                          {doc.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDocumentAction(doc.id || doc._id, 'reject')}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => handleDocumentAction(doc.id || doc._id, 'approve')}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground text-center py-8 col-span-2">No documents uploaded</p>
                )}
              </div>

              {/* Actions */}
              {!selectedDocumentUser.isVerified && selectedDocumentUser.documents?.some((d: any) => d.status === 'approved') && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsDocumentDialogOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    handleVerifyUser(selectedDocumentUser.id);
                    setIsDocumentDialogOpen(false);
                  }}>
                    <Shield className="h-4 w-4 mr-2" />
                    Verify User
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={viewImagesDialog} onOpenChange={setViewImagesDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Rental Images</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 max-h-[70vh] overflow-y-auto">
            {selectedRentalImages && selectedRentalImages.length > 0 ? (
              selectedRentalImages.map((img, idx) => (
                <div key={idx} className="relative aspect-video bg-muted rounded-lg overflow-hidden border group">
                  <img 
                    src={img} 
                    alt={`Rental image ${idx + 1}`} 
                    className="object-cover w-full h-full cursor-pointer"
                    onClick={() => setFullScreenImageIndex(idx)}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFullScreenImageIndex(idx);
                      }}
                      className="bg-white hover:bg-gray-100 text-black font-semibold border border-gray-300 shadow-lg"
                    >
                      <Maximize2 className="h-4 w-4 mr-1 text-black" />
                      <span className="text-black">View</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        const link = document.createElement('a');
                        link.href = img;
                        link.download = `rental-image-${idx + 1}.jpg`;
                        link.target = '_blank';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        toast({ title: 'Download started', description: 'Image download initiated' });
                      }}
                      className="bg-white hover:bg-gray-100 text-black font-semibold border border-gray-300 shadow-lg"
                    >
                      <Download className="h-4 w-4 mr-1 text-black" />
                      <span className="text-black">Download</span>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No images uploaded for this rental.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Screen Image Viewer */}
      {fullScreenImageIndex !== null && selectedRentalImages[fullScreenImageIndex] && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white bg-black/70 hover:bg-black/90 border border-white/20 z-10 shadow-lg"
              onClick={() => setFullScreenImageIndex(null)}
            >
              <X className="h-6 w-6 text-white" />
            </Button>

            {/* Previous Button */}
            {fullScreenImageIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 text-white bg-black/70 hover:bg-black/90 border border-white/20 z-10 shadow-lg"
                onClick={() => setFullScreenImageIndex(fullScreenImageIndex - 1)}
              >
                <ChevronLeft className="h-8 w-8 text-white" />
              </Button>
            )}

            {/* Next Button */}
            {fullScreenImageIndex < selectedRentalImages.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 text-white bg-black/70 hover:bg-black/90 border border-white/20 z-10 shadow-lg"
                onClick={() => setFullScreenImageIndex(fullScreenImageIndex + 1)}
              >
                <ChevronRight className="h-8 w-8 text-white" />
              </Button>
            )}

            {/* Image */}
            <img
              src={selectedRentalImages[fullScreenImageIndex]}
              alt={`Rental image ${fullScreenImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {/* Download Button */}
            <Button
              variant="secondary"
              size="lg"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-black hover:bg-gray-100 shadow-lg border-2 border-white/50 font-semibold"
              onClick={() => {
                const img = selectedRentalImages[fullScreenImageIndex];
                const link = document.createElement('a');
                link.href = img;
                link.download = `rental-image-${fullScreenImageIndex + 1}.jpg`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast({ title: 'Download started', description: 'Image download initiated' });
              }}
            >
              <Download className="h-5 w-5 mr-2 text-black" />
              <span className="text-black font-semibold">Download Image</span>
            </Button>

            {/* Image Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20 shadow-lg font-semibold text-lg">
              {fullScreenImageIndex + 1} / {selectedRentalImages.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
