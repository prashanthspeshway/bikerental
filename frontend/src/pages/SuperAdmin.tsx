import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  LayoutDashboard,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Shield,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { bikesAPI, usersAPI, documentsAPI, rentalsAPI, authAPI, getCurrentUser, locationsAPI } from '@/lib/api';
import { Bike as BikeType } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusStyles = {
  verified: { color: 'bg-accent/10 text-accent', icon: CheckCircle },
  pending: { color: 'bg-primary/10 text-primary', icon: Clock },
  unverified: { color: 'bg-destructive/10 text-destructive', icon: XCircle },
  approved: { color: 'bg-accent/10 text-accent', icon: CheckCircle },
  rejected: { color: 'bg-destructive/10 text-destructive', icon: XCircle },
};

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [bikes, setBikes] = useState<BikeType[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [rentals, setRentals] = useState<any[]>([]);
  const [brandSearch, setBrandSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedDocumentUser, setSelectedDocumentUser] = useState<any>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({ name: '', email: '', password: '', locationId: '' });
  const [bikeDialogOpen, setBikeDialogOpen] = useState(false);
  const [editingBike, setEditingBike] = useState<any | null>(null);
  const [bikeForm, setBikeForm] = useState<any>({ name: '', brand: '', type: 'fuel', pricePerHour: '', kmLimit: '', locationId: '', image: '' });
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any | null>(null);
  const [locationForm, setLocationForm] = useState<any>({ name: '', city: '', state: '', country: '' });

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    if (user.role !== 'superadmin') {
      toast({
        title: "Access Denied",
        description: "Super Admin access required",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }
    setCurrentUser(user);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [bikesData, usersData, docsData, locationsData, rentalsData] = await Promise.all([
        bikesAPI.getAll(),
        usersAPI.getAll(),
        documentsAPI.getAll(),
        locationsAPI.getAll(),
        rentalsAPI.getAll(),
      ]);
      setBikes(bikesData);
      setUsers(usersData);
      setDocuments(docsData);
      setLocations(locationsData);
      setRentals(rentalsData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load admin data",
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

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'models', label: 'Vehicles', icon: Bike },
    { key: 'pricing', label: 'Pricing', icon: DollarSign },
    { key: 'allocation', label: 'Allocation', icon: MapPin },
    { key: 'admins', label: 'Admins', icon: Shield },
    { key: 'bookings', label: 'Bookings', icon: Calendar },
    { key: 'refunds', label: 'Refunds', icon: DollarSign },
    { key: 'bikes', label: 'All Vehicles', icon: Bike },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'reports', label: 'Reports', icon: FileText },
    { key: 'settings', label: 'Settings', icon: Settings },
    { key: 'audit', label: 'Audit', icon: FileText },
    { key: 'locations', label: 'Locations', icon: MapPin },
  ];

  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDocumentAction = async (docId: string, action: 'approve' | 'reject') => {
    await documentsAPI.updateStatus(docId, action === 'approve' ? 'approved' : 'rejected');
    toast({ title: 'Updated', description: `Document ${action}d` });
  };

  const handleVerifyUser = async (userId: string) => {
    await usersAPI.update(userId, { isVerified: true });
    toast({ title: 'User Verified', description: 'User has been marked as verified' });
    loadData();
  };
  
  const rentalsActive = rentals.filter((r) => r.status === 'active');
  const uniqueModelNames = Array.from(new Set(bikes.map((b) => b.name)));
  const revenueByPeriod = (days: number) => {
    const now = Date.now();
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return rentals
      .filter((r) => r.totalCost && new Date(r.endTime || r.startTime).getTime() >= cutoff)
      .reduce((sum, r) => sum + (r.totalCost || 0), 0);
  };
  const revenueDaily = revenueByPeriod(1);
  const revenueWeekly = revenueByPeriod(7);
  const revenueMonthly = revenueByPeriod(30);
  const alerts = {
    pendingRefunds: 0,
    damageReports: 0,
    adminEscalations: 0,
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border p-4 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="p-2 rounded-xl gradient-hero">
            <Bike className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-display font-bold">RideFlow</span>
            <Badge variant="secondary" className="ml-2 text-xs">Super Admin</Badge>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${
                activeTab === tab.key ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="mt-4">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-display font-bold mb-2">Super Admin Dashboard</h1>
              <p className="text-muted-foreground">Global view across all cities and garages.</p>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { label: 'Cities', value: locations.length, icon: MapPin, color: 'bg-accent' },
                { label: 'Bike Models', value: uniqueModelNames.length, icon: Bike, color: 'bg-secondary' },
                { label: 'Fleet Inventory', value: bikes.length, icon: Bike, color: 'gradient-hero' },
                { label: 'Active Bookings', value: rentalsActive.length, icon: Calendar, color: 'bg-primary' },
                { label: 'Registered Users', value: users.length, icon: Users, color: 'bg-secondary' },
              ].map((stat) => (
                <div key={stat.label} className="bg-card rounded-2xl shadow-card p-6">
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
                <p className="text-sm text-muted-foreground">Revenue (Daily)</p>
                <p className="text-2xl font-display font-bold">${revenueDaily.toFixed(2)}</p>
              </div>
              <div className="bg-card rounded-2xl shadow-card p-6">
                <p className="text-sm text-muted-foreground">Revenue (Weekly)</p>
                <p className="text-2xl font-display font-bold">${revenueWeekly.toFixed(2)}</p>
              </div>
              <div className="bg-card rounded-2xl shadow-card p-6">
                <p className="text-sm text-muted-foreground">Revenue (Monthly)</p>
                <p className="text-2xl font-display font-bold">${revenueMonthly.toFixed(2)}</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-card rounded-2xl shadow-card p-6">
                <p className="text-sm text-muted-foreground">Pending Refunds</p>
                <p className="text-2xl font-display font-bold">{alerts.pendingRefunds}</p>
              </div>
              <div className="bg-card rounded-2xl shadow-card p-6">
                <p className="text-sm text-muted-foreground">Damage Reports</p>
                <p className="text-2xl font-display font-bold">{alerts.damageReports}</p>
              </div>
              <div className="bg-card rounded-2xl shadow-card p-6">
                <p className="text-sm text-muted-foreground">Admin Escalations</p>
                <p className="text-2xl font-display font-bold">{alerts.adminEscalations}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'models' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-display font-bold mb-2">Vehicles</h1>
                <p className="text-muted-foreground">Browse vehicles grouped by brand.</p>
              </div>
              <Button
                onClick={() => {
                  setEditingBike(null);
                  setBikeForm({ name: '', brand: '', type: 'fuel', pricePerHour: '', kmLimit: '', locationId: '', image: '' });
                  setBikeDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </div>
            <div className="bg-card rounded-2xl shadow-card p-6">
              <div className="p-2 mb-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search brands..." value={brandSearch} onChange={(e) => setBrandSearch(e.target.value)} />
                </div>
              </div>
              {Array.from(new Set(bikes.map((b) => ((b.brand || '').trim() || 'Unbranded'))))
                .filter((brand) => brand.toLowerCase().includes(brandSearch.toLowerCase()))
                .map((brand) => {
                  const brandBikes = bikes.filter((b) => (((b.brand || '').trim() || 'Unbranded')) === brand);
                  return (
                    <div key={brand} className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="font-display font-semibold text-lg">{brand}</h2>
                        <Badge variant="secondary">{brandBikes.length} vehicles</Badge>
                      </div>
                      {(['fuel','electric','scooter'] as const).map((t) => {
                        const typeBikes = brandBikes.filter((b) => b.type === t);
                        if (!typeBikes.length) return null;
                        const typeLabel = t.charAt(0).toUpperCase() + t.slice(1);
                        return (
                          <div key={`${brand}-${t}`} className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-display font-medium">{typeLabel}</h3>
                              <Badge variant="secondary">{typeBikes.length} {typeLabel.toLowerCase()}</Badge>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {typeBikes.map((bike) => (
                                <div key={bike.id} className="border rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="font-medium">{bike.name}</p>
                                    <Badge variant="secondary">{bike.type}</Badge>
                                  </div>
                                  {bike.brand && <p className="text-xs text-muted-foreground mb-1">Brand: {(bike.brand || '').trim() || 'Unbranded'}</p>}
                                  {bike.image && (
                                    <img src={bike.image} alt={bike.name} className="w-full h-32 object-cover rounded-md mb-2" />
                                  )}
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">${bike.pricePerHour}/hr</p>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setEditingBike(bike);
                                          setBikeForm({
                                            name: bike.name,
                                            brand: bike.brand || '',
                                            type: bike.type,
                                            pricePerHour: String(bike.pricePerHour),
                                            kmLimit: String(bike.kmLimit),
                                            locationId: bike.locationId,
                                            image: bike.image || '',
                                          });
                                          setBikeDialogOpen(true);
                                        }}
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
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
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Delete
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-display font-bold mb-2">Pricing & Tariffs</h1>
              <p className="text-muted-foreground">Define pricing rules city-wise or model-wise.</p>
            </div>
            <div className="bg-card rounded-2xl shadow-card p-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Input placeholder="Hourly Price" />
                <Input placeholder="Minimum Booking Hours" />
                <Input placeholder="Weekend Pricing %" />
                <Select>
                  <SelectTrigger><SelectValue placeholder="Plan Duration" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="15">15 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="KM Limit" />
                <Input placeholder="Excess KM Charge" />
                <Input placeholder="Deposit Amount" />
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => toast({ title: 'Save requires backend' })}>Save</Button>
                <Button variant="outline" onClick={() => toast({ title: 'Apply requires backend' })}>Apply</Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'allocation' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-display font-bold mb-2">Fleet Allocation</h1>
              <p className="text-muted-foreground">Allocate inventory across cities and garages.</p>
            </div>
            <div className="bg-card rounded-2xl shadow-card p-6">
              <div className="grid md:grid-cols-2 gap-4">
                {locations.map((loc) => {
                  const count = bikes.filter((b) => b.locationId === loc.id).length;
                  return (
                    <div key={loc.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{loc.name}</p>
                          <p className="text-xs text-muted-foreground">{loc.city}, {loc.state}</p>
                        </div>
                        <Badge variant="secondary">{count} bikes</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => toast({ title: 'Increase requires backend' })}>Increase</Button>
                        <Button size="sm" variant="outline" onClick={() => toast({ title: 'Decrease requires backend' })}>Decrease</Button>
                        <Button size="sm" variant="secondary" onClick={() => toast({ title: 'Transfer requires backend' })}>Transfer</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-display font-bold mb-2">Admins</h1>
                <p className="text-muted-foreground">Create and manage admin accounts.</p>
              </div>
              <Button onClick={() => setCreateAdminOpen(true)}>Create Admin</Button>
            </div>
            <div className="bg-card rounded-2xl shadow-card p-6">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-4 font-medium">Name</th>
                    <th className="text-left px-6 py-4 font-medium">Email</th>
                    <th className="text-left px-6 py-4 font-medium">City</th>
                    <th className="text-left px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.filter((u) => u.role === 'admin').map((u) => (
                    <tr key={u.id}>
                      <td className="px-6 py-4">{u.name}</td>
                      <td className="px-6 py-4">{u.email}</td>
                      <td className="px-6 py-4">—</td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary">Active</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Dialog open={createAdminOpen} onOpenChange={setCreateAdminOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Admin</DialogTitle>
                  <DialogDescription>Provision a new admin account.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Full Name" value={newAdminForm.name} onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })} />
                  <Input placeholder="Email" value={newAdminForm.email} onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })} />
                  <Input type="password" placeholder="Password" value={newAdminForm.password} onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })} />
                  <Select value={newAdminForm.locationId} onValueChange={(v) => setNewAdminForm({ ...newAdminForm, locationId: v })}>
                    <SelectTrigger><SelectValue placeholder="Assign City/Garage" /></SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        try {
                          const base = import.meta.env.VITE_API_URL || '/api';
                          const token = localStorage.getItem('authToken') || '';
                          const res = await fetch(`${base}/users/create-admin`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                            body: JSON.stringify({ email: newAdminForm.email, password: newAdminForm.password, name: newAdminForm.name }),
                          });
                          if (!res.ok) {
                            const err = await res.json().catch(() => ({ message: 'Registration failed' }));
                            throw new Error(err.message || `HTTP error! status: ${res.status}`);
                          }
                          toast({ title: 'Admin Created', description: 'New admin has been created' });
                          setCreateAdminOpen(false);
                          loadData();
                        } catch (e: any) {
                          toast({ title: 'Error', description: e.message || 'Failed to create admin', variant: 'destructive' });
                        }
                      }}
                    >
                      Create
                    </Button>
                    <Button variant="outline" onClick={() => setCreateAdminOpen(false)}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-display font-bold mb-2">All Bookings</h1>
              <p className="text-muted-foreground">Oversight across all cities.</p>
            </div>
            <div className="bg-card rounded-2xl shadow-card overflow-hidden">
              <table className="w-full">
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
                  {rentals.map((r) => {
                    const bike = bikes.find((b) => b.id === r.bikeId);
                    const user = users.find((u) => u.id === r.userId);
                    return (
                      <tr key={r.id}>
                        <td className="px-6 py-4">#{r.id.slice(0,8)}</td>
                        <td className="px-6 py-4">{bike?.name || r.bikeId}</td>
                        <td className="px-6 py-4">{user?.name || r.userId}</td>
                        <td className="px-6 py-4">{new Date(r.startTime).toLocaleString()}</td>
                        <td className="px-6 py-4">{r.endTime ? new Date(r.endTime).toLocaleString() : '-'}</td>
                        <td className="px-6 py-4">
                          <Badge className={statusStyles[r.status as keyof typeof statusStyles]?.color || 'bg-muted'}>
                            {r.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {r.status === 'active' && (
                              <Button size="sm" onClick={async () => { try { await rentalsAPI.end(r.id); toast({ title: 'Ride Closed' }); loadData(); } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); } }}>Force Close</Button>
                            )}
                            {r.status !== 'completed' && r.status !== 'cancelled' && (
                              <Button size="sm" variant="outline" onClick={async () => { try { await rentalsAPI.cancel(r.id); toast({ title: 'Booking Cancelled' }); loadData(); } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); } }}>Cancel</Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reuse Admin tabs for bikes/users/documents/locations */}
        {activeTab === 'bikes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-display font-bold mb-2">All Vehicles</h1>
                <p className="text-muted-foreground">Add, edit, or remove vehicles from your fleet.</p>
              </div>
              <Button
                onClick={() => {
                  setEditingBike(null);
                  setBikeForm({ name: '', brand: '', type: 'fuel', pricePerHour: '', kmLimit: '', locationId: '', image: '' });
                  setBikeDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            </div>
            <div className="bg-card rounded-2xl shadow-card overflow-hidden">
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search vehicles..." />
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {bikes.map((bike) => (
                  <div key={bike.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{bike.name}</p>
                      <Badge variant="secondary">{bike.type}</Badge>
                    </div>
                    {bike.brand && <p className="text-xs text-muted-foreground mb-1">Brand: {bike.brand}</p>}
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">${bike.pricePerHour}/hr</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingBike(bike);
                            setBikeForm({
                              name: bike.name,
                              brand: bike.brand || '',
                              type: bike.type,
                              pricePerHour: String(bike.pricePerHour),
                              kmLimit: String(bike.kmLimit),
                              locationId: bike.locationId,
                              image: bike.image || '',
                            });
                            setBikeDialogOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            try {
                              await bikesAPI.delete(bike.id);
                              toast({ title: 'Bike deleted' });
                              loadData();
                            } catch (e: any) {
                              toast({ title: 'Error', description: e.message || 'Failed to delete bike', variant: 'destructive' });
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-card rounded-2xl shadow-card overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-4 font-medium">User</th>
                    <th className="text-left px-6 py-4 font-medium">Role</th>
                    <th className="text-left px-6 py-4 font-medium">Wallet</th>
                    <th className="text-left px-6 py-4 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={user.role === 'admin' ? 'default' : user.role === 'superadmin' ? 'destructive' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">${user.walletBalance?.toFixed(2) || '0.00'}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-card rounded-2xl shadow-card p-6">
            <h2 className="font-display font-semibold text-lg mb-4">All Documents</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {documents.map((doc: any) => {
                const StatusIcon = statusStyles[doc.status as keyof typeof statusStyles].icon;
                return (
                  <div key={doc.id} className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">{doc.type.replace('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground">{doc.name}</p>
                      </div>
                      <Badge className={statusStyles[doc.status as keyof typeof statusStyles].color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {doc.status}
                      </Badge>
                    </div>
                    <div className="mb-3 border rounded-lg overflow-hidden bg-muted/30">
                      {doc.url && (
                        <img
                          src={doc.url}
                          alt={doc.name}
                          className="w-full h-40 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                    {doc.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleDocumentAction(doc.id, 'reject')}>
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                        <Button size="sm" onClick={() => handleDocumentAction(doc.id, 'approve')}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-display font-bold mb-2">Reports & Analytics</h1>
              <p className="text-muted-foreground">City-wise revenue and utilization.</p>
            </div>
            <div className="bg-card rounded-2xl shadow-card p-6">
              <div className="grid md:grid-cols-2 gap-4">
                {locations.map((loc) => {
                  const cityBikes = bikes.filter((b) => b.locationId === loc.id);
                  const cityRentals = rentals.filter((r) => cityBikes.some((b) => b.id === r.bikeId));
                  const revenue = cityRentals.reduce((sum, r) => sum + (r.totalCost || 0), 0);
                  const utilization = cityBikes.length ? Math.round((cityRentals.filter((r) => r.status === 'active').length / cityBikes.length) * 100) : 0;
                  return (
                    <div key={loc.id} className="border rounded-lg p-4">
                      <p className="font-medium mb-2">{loc.name}</p>
                      <p className="text-sm text-muted-foreground">Revenue: ${revenue.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Utilization: {utilization}%</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'refunds' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-display font-bold mb-2">Refunds & Financials</h1>
              <p className="text-muted-foreground">Approve refunds and adjust balances.</p>
            </div>
            <div className="bg-card rounded-2xl shadow-card p-6">
              <div className="text-muted-foreground">No refund requests connected. Backend support required.</div>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => toast({ title: 'Approve requires backend' })}>Approve</Button>
                <Button variant="outline" onClick={() => toast({ title: 'Reject requires backend' })}>Reject</Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-display font-bold mb-2">Audit & Compliance</h1>
              <p className="text-muted-foreground">System logs and admin actions.</p>
            </div>
            <div className="bg-card rounded-2xl shadow-card p-6">
              <div className="text-muted-foreground">Audit log stream not connected. Backend support required.</div>
            </div>
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="bg-card rounded-2xl shadow-card p-6">
            <h2 className="font-display font-semibold text-lg mb-4">Locations</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {locations.map((loc) => (
                <div key={loc.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{loc.name}</p>
                      <p className="text-xs text-muted-foreground">{loc.city}, {loc.state}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingLocation(loc);
                          setLocationForm({ name: loc.name, city: loc.city, state: loc.state, country: loc.country || 'India' });
                          setLocationDialogOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          try {
                            await locationsAPI.delete(loc.id);
                            toast({ title: 'Location deleted' });
                            loadData();
                          } catch (e: any) {
                            toast({ title: 'Error', description: e.message || 'Failed to delete location', variant: 'destructive' });
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Location</DialogTitle>
                  <DialogDescription>Update location details</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Name" value={locationForm.name} onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })} />
                  <Input placeholder="City" value={locationForm.city} onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })} />
                  <Input placeholder="State" value={locationForm.state} onChange={(e) => setLocationForm({ ...locationForm, state: e.target.value })} />
                  <Input placeholder="Country" value={locationForm.country} onChange={(e) => setLocationForm({ ...locationForm, country: e.target.value })} />
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        try {
                          if (editingLocation) {
                            await locationsAPI.update(editingLocation.id, locationForm);
                            toast({ title: 'Location updated' });
                          }
                          setLocationDialogOpen(false);
                          setEditingLocation(null);
                          loadData();
                        } catch (e: any) {
                          toast({ title: 'Error', description: e.message || 'Failed to save location', variant: 'destructive' });
                        }
                      }}
                    >
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => setLocationDialogOpen(false)}>Cancel</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </main>
      <Dialog open={bikeDialogOpen} onOpenChange={setBikeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBike ? 'Edit Bike' : 'Add Bike'}</DialogTitle>
            <DialogDescription>Enter bike details</DialogDescription>
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
            <Select value={bikeForm.locationId} onValueChange={(v) => setBikeForm({ ...bikeForm, locationId: v })}>
              <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                        toast({ title: 'Image uploaded', description: 'Bike image has been uploaded' });
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
                            locationId: bikeForm.locationId,
                            image: bikeForm.image,
                          };
                    if (editingBike) {
                      await bikesAPI.update(editingBike.id, payload);
                      toast({ title: 'Bike updated' });
                    } else {
                      await bikesAPI.create(payload);
                      toast({ title: 'Bike created' });
                    }
                    setBikeDialogOpen(false);
                    setEditingBike(null);
                    loadData();
                  } catch (e: any) {
                    toast({ title: 'Error', description: e.message || 'Failed to save bike', variant: 'destructive' });
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
    </div>
  );
}
