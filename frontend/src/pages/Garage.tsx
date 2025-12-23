import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BikeCard } from '@/components/BikeCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bike } from '@/types';
import { Search, Zap, Gauge, Bike as BikeIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { bikesAPI, rentalsAPI, getCurrentUser, documentsAPI } from '@/lib/api';

const bikeTypes = [
  { value: 'all', label: 'All Models', icon: null },
  { value: 'fuel', label: 'Fuel', icon: Gauge },
  { value: 'electric', label: 'Electric', icon: Zap },
  { value: 'scooter', label: 'Scooter', icon: BikeIcon },
];

export default function Garage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [dropoffDate, setDropoffDate] = useState('');
  const [dropoffTime, setDropoffTime] = useState('');
  const [timeFilterApplied, setTimeFilterApplied] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isBookingConfirmationOpen, setIsBookingConfirmationOpen] = useState(false);
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
  const [sortBy, setSortBy] = useState<'relevance' | 'priceLow' | 'priceHigh'>('relevance');

  useEffect(() => {
    loadBikes();
  }, []);

  const loadBikes = async () => {
    try {
      setIsLoading(true);
      const savedLocation = localStorage.getItem('selectedLocation') || undefined;
      const data = await bikesAPI.getAll(savedLocation);
      setBikes(data);
      const rent = searchParams.get('rent');
      const bikeIdParam = searchParams.get('bikeId');
      if (rent === '1') {
        setIsSearchDialogOpen(true);
        if (bikeIdParam) {
          const found = data.find((b: any) => b.id === bikeIdParam);
          if (found) setSelectedBike(found);
        }
      }
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
    return matchesSearch && matchesType;
  });
  const bikesToShow =
    sortBy === 'relevance'
      ? filteredBikes
      : [...filteredBikes].sort((a, b) =>
          sortBy === 'priceLow' ? a.pricePerHour - b.pricePerHour : b.pricePerHour - a.pricePerHour
        );

  const getDateTime = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return null;
    return new Date(`${dateStr}T${timeStr}`);
  };

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const toHHMM = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const nowHHMM = toHHMM(now);
  const pickupTimeMin = pickupDate === todayStr ? nowHHMM : '00:00';
  // Dropoff must be at least now or pickup + 30m if same day
  const pickupDT = getDateTime(pickupDate, pickupTime);
  const baseDropMinDate = dropoffDate === todayStr ? nowHHMM : '00:00';
  const dropoffTimeMin =
    dropoffDate && pickupDT && dropoffDate === pickupDate
      ? toHHMM(new Date(pickupDT.getTime() + 30 * 60000))
      : baseDropMinDate;

  const dropoffDT = getDateTime(dropoffDate, dropoffTime);
  const durationMinutes =
    pickupDT && dropoffDT ? Math.max(0, Math.round((dropoffDT.getTime() - pickupDT.getTime()) / 60000)) : 0;

  const minutesToHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const format12h = (t: string) => {
    const [hStr, mStr] = t.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
  };
  const generateTimes = (minHHMM: string) => {
    const [hStr, mStr] = minHHMM.split(':');
    let startMin = (parseInt(hStr || '0', 10) * 60) + parseInt(mStr || '0', 10);
    startMin = Math.min(24 * 60 - 30, Math.max(0, Math.ceil(startMin / 30) * 30));
    const opts: string[] = [];
    for (let m = startMin; m <= 23 * 60 + 30; m += 30) {
      opts.push(minutesToHHMM(m));
    }
    return opts;
  };
  const pickupOptions = generateTimes(pickupTimeMin);
  const dropoffOptions = generateTimes(dropoffTimeMin);

  const applyTimeFilter = () => {
    if (!pickupDate || !pickupTime || !dropoffDate || !dropoffTime) {
      return;
    }
    const sameDay = pickupDate === dropoffDate;
    if (pickupDT && dropoffDT && dropoffDT.getTime() <= pickupDT.getTime()) {
      const adjusted = new Date(pickupDT.getTime() + 30 * 60000);
      setDropoffDate(adjusted.toISOString().slice(0, 10));
      setDropoffTime(adjusted.toTimeString().slice(0, 5));
      setTimeFilterApplied(true);
      return;
    }
    if (sameDay && durationMinutes < 30 && pickupDT) {
      const adjusted = new Date(pickupDT.getTime() + 30 * 60000);
      setDropoffTime(adjusted.toTimeString().slice(0, 5));
      setTimeFilterApplied(true);
      return;
    }
    setTimeFilterApplied(true);
  };

  const searchAvailable = async () => {
    if (!pickupDate || !pickupTime || !dropoffDate || !dropoffTime) {
      toast({ title: 'Select Date & Time', description: 'Please choose pickup and dropoff.', variant: 'destructive' });
      return;
    }
    const startISO = new Date(`${pickupDate}T${pickupTime}`).toISOString();
    const endISO = new Date(`${dropoffDate}T${dropoffTime}`).toISOString();
    try {
      setIsLoading(true);
      const savedLocation = localStorage.getItem('selectedLocation') || undefined;
      const available = await bikesAPI.getAvailable(startISO, endISO, savedLocation);
      setBikes(available);
      setTimeFilterApplied(true);
      setIsSearchDialogOpen(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to fetch availability', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRent = async (bike: Bike) => {
    const user = getCurrentUser();
    if (!user) {
      toast({ title: 'Login Required', description: 'Please login to book a ride.', variant: 'destructive' });
      navigate('/auth');
      return;
    }

    // Check if all documents are verified
    try {
      const userDocs = await documentsAPI.getAll();
      const hasDocuments = userDocs && userDocs.length > 0;
      const allApproved = hasDocuments && userDocs.every((doc: any) => doc.status === 'approved');
      
      if (!hasDocuments) {
        toast({ 
          title: 'Documents Required', 
          description: 'Please upload and verify all required documents before booking a ride.', 
          variant: 'destructive' 
        });
        navigate('/dashboard?tab=documents');
        return;
      }

      if (!allApproved) {
        const pendingCount = userDocs.filter((doc: any) => doc.status !== 'approved').length;
        toast({ 
          title: 'Documents Pending Verification', 
          description: `You have ${pendingCount} document(s) pending verification. Please wait for admin approval before booking.`, 
          variant: 'destructive' 
        });
        navigate('/dashboard?tab=documents');
        return;
      }
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: 'Failed to verify documents. Please try again.', 
        variant: 'destructive' 
      });
      return;
    }

    setSelectedBike(bike);
    if (pickupDate && pickupTime && dropoffDate && dropoffTime) {
      setIsBookingConfirmationOpen(true);
    } else {
      setIsSearchDialogOpen(true);
    }
  };

  const handleBookingConfirm = async () => {
    if (!selectedBike || !pickupDate || !pickupTime || !dropoffDate || !dropoffTime) return;

    const user = getCurrentUser();
    if (!user) {
      setIsBookingConfirmationOpen(false);
      toast({ title: 'Login Required', description: 'Please login to confirm your booking.', variant: 'destructive' });
      navigate('/auth');
      return;
    }
    
    // Calculate duration and amount
    const start = new Date(`${pickupDate}T${pickupTime}`);
    const end = new Date(`${dropoffDate}T${dropoffTime}`);
    const hours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
    const totalAmount = Math.round(selectedBike.pricePerHour * hours);

    setIsBookingConfirmationOpen(false);
    navigate('/payment', {
      state: {
        bookingDetails: {
          bike: selectedBike,
          pickupTime: start.toISOString(),
          dropoffTime: end.toISOString(),
          durationHours: hours,
          totalAmount
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ride Finder
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Browse our collection of premium bikes. Each bike comes with full insurance,
              a helmet, and 24/7 roadside assistance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <aside className="hidden md:block md:col-span-4 lg:col-span-3">
              <div className="sticky top-28 space-y-4">
                <div className="bg-card rounded-2xl p-4 shadow-card space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Search bikes..."
                      className="pl-10 w-full"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Pickup</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        min={todayStr}
                        value={pickupDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPickupDate(val < todayStr ? todayStr : val);
                          if (dropoffDate === val && pickupTime) {
                            const p = getDateTime(val, pickupTime);
                            if (p) {
                              const minDrop = new Date(p.getTime() + 30 * 60000);
                              const currentDrop = getDateTime(dropoffDate, dropoffTime);
                              if (!currentDrop || currentDrop.getTime() < minDrop.getTime()) {
                                setDropoffDate(val);
                                setDropoffTime(toHHMM(minDrop));
                              }
                            }
                          }
                        }}
                        onClick={(e) => e.currentTarget.showPicker?.()}
                        className="w-full cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                      <Select
                        value={pickupTime || undefined}
                        onValueChange={(val) => {
                          let t = val;
                          const proposed = getDateTime(pickupDate, t);
                          if (pickupDate === todayStr && proposed && proposed.getTime() < now.getTime()) {
                            t = nowHHMM;
                          }
                          setPickupTime(t);
                          const p = getDateTime(pickupDate, t);
                          if (p && dropoffDate === pickupDate) {
                            const minDrop = new Date(p.getTime() + 30 * 60000);
                            const currentDrop = getDateTime(dropoffDate, dropoffTime);
                            if (!currentDrop || currentDrop.getTime() < minDrop.getTime()) {
                              setDropoffDate(pickupDate);
                              setDropoffTime(toHHMM(minDrop));
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Time" />
                        </SelectTrigger>
                        <SelectContent>
                          {pickupOptions.map((t) => (
                            <SelectItem key={t} value={t}>{format12h(t)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Dropoff</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        min={todayStr}
                        value={dropoffDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDropoffDate(val < todayStr ? todayStr : val);
                        }}
                        onClick={(e) => e.currentTarget.showPicker?.()}
                        className="w-full cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                      <Select
                        value={dropoffTime || undefined}
                        onValueChange={(val) => {
                          let t = val;
                          const proposed = getDateTime(dropoffDate, t);
                          if (dropoffDate === todayStr && proposed && proposed.getTime() < now.getTime()) {
                            t = nowHHMM;
                          }
                          if (pickupDT && dropoffDate === pickupDate) {
                            const minDrop = new Date(pickupDT.getTime() + 30 * 60000);
                            if (proposed && proposed.getTime() < minDrop.getTime()) {
                              t = toHHMM(minDrop);
                            }
                          }
                          setDropoffTime(t);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Time" />
                        </SelectTrigger>
                        <SelectContent>
                          {dropoffOptions.map((t) => (
                            <SelectItem key={t} value={t}>{format12h(t)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" className="flex-1" onClick={applyTimeFilter}>Apply filter</Button>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {durationMinutes ? `${durationMinutes} Minutes` : '0 Minutes'}
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            <section className="md:col-span-8 lg:col-span-9">
              <div className="bg-card rounded-2xl p-3 md:p-4 shadow-card mb-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground shrink-0">Sort by</span>
                    <Select value={sortBy} onValueChange={(val) => setSortBy(val as typeof sortBy)}>
                      <SelectTrigger className="w-full md:w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="priceLow">Price - Low to High</SelectItem>
                        <SelectItem value="priceHigh">Price - High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground shrink-0">Model</span>
                    <div className="relative -mx-2 w-full md:w-auto">
                      <div className="overflow-x-auto whitespace-nowrap px-2">
                        <ToggleGroup
                          type="single"
                          value={selectedType}
                          onValueChange={(val) => setSelectedType(val || 'all')}
                          className="inline-flex gap-2"
                        >
                          {bikeTypes.map((t) => (
                            <ToggleGroupItem
                              key={t.value}
                              value={t.value}
                              variant="default"
                              size="sm"
                              className="min-w-max rounded-full h-9 px-4 bg-muted text-foreground border border-input data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
                            >
                              {t.label}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Count */}
              <div className="mb-6">
                <p className="text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{bikesToShow.length}</span> bikes
                </p>
              </div>

              {/* Bike Grid */}
              {isLoading ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">Loading bikes...</p>
                </div>
              ) : bikesToShow.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bikesToShow.map((bike, index) => (
                    <div
                      key={bike.id}
                      className="animate-slide-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <BikeCard 
                        bike={bike} 
                        onRent={handleRent}
                        pickupDateTime={pickupDate && pickupTime ? new Date(`${pickupDate}T${pickupTime}`) : undefined}
                        dropoffDateTime={dropoffDate && dropoffTime ? new Date(`${dropoffDate}T${dropoffTime}`) : undefined}
                        durationHours={(() => {
                          if (pickupDate && pickupTime && dropoffDate && dropoffTime) {
                            const start = new Date(`${pickupDate}T${pickupTime}`);
                            const end = new Date(`${dropoffDate}T${dropoffTime}`);
                            return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
                          }
                          return 0;
                        })()}
                      />
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
            </section>
          </div>

          {/* Mobile bottom bar */}
          <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
            <div className="bg-card rounded-2xl shadow-card flex items-center justify-between px-4 py-3">
              <Button variant="ghost" size="sm" onClick={() => setIsSearchDialogOpen(true)}>FILTER</Button>
              <div className="text-xs text-muted-foreground">{durationMinutes ? `${durationMinutes} Minutes` : '0 Minutes'}</div>
            </div>
          </div>

          {/* Rent Search Modal */}
          <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Search your next ride</DialogTitle>
                <DialogDescription>
                  Select pickup and dropoff to see available bikes
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Pickup</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="date" 
                      min={todayStr} 
                      value={pickupDate} 
                      onChange={(e) => setPickupDate(e.target.value)}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                    <Select
                      value={pickupTime || undefined}
                      onValueChange={(val) => setPickupTime(val)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Time" />
                      </SelectTrigger>
                      <SelectContent>
                        {pickupOptions.map((t) => (
                          <SelectItem key={t} value={t}>{format12h(t)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Dropoff</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="date" 
                      min={todayStr} 
                      value={dropoffDate} 
                      onChange={(e) => setDropoffDate(e.target.value)}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                    <Select
                      value={dropoffTime || undefined}
                      onValueChange={(val) => setDropoffTime(val)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Time" />
                      </SelectTrigger>
                      <SelectContent>
                        {dropoffOptions.map((t) => (
                          <SelectItem key={t} value={t}>{format12h(t)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full" onClick={searchAvailable}>Search</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Booking Confirmation Modal */}
          <Dialog open={isBookingConfirmationOpen} onOpenChange={setIsBookingConfirmationOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Confirm Booking</DialogTitle>
                <DialogDescription>
                  Please review your booking details below.
                </DialogDescription>
              </DialogHeader>
              {selectedBike && (
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    <div className="flex items-center gap-4">
                      {selectedBike.image ? (
                         <img src={selectedBike.image} alt={selectedBike.name} className="w-16 h-16 object-cover rounded-md" />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                          <BikeIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold">{selectedBike.name}</h4>
                        <p className="text-sm text-muted-foreground capitalize">{selectedBike.type} Bike</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-border/50">
                      <div>
                        <span className="text-muted-foreground block">Pickup</span>
                        <span className="font-medium">{new Date(pickupDate).toLocaleDateString()} {format12h(pickupTime)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Dropoff</span>
                        <span className="font-medium">{new Date(dropoffDate).toLocaleDateString()} {format12h(dropoffTime)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Rate</span>
                        <span className="font-medium">${selectedBike.pricePerHour}/hr</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Duration</span>
                        <span className="font-medium">{durationMinutes} mins</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" className="w-full" onClick={() => setIsBookingConfirmationOpen(false)}>Cancel</Button>
                    <Button className="w-full" onClick={handleBookingConfirm}>Confirm Booking</Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

        </div>
      </main>

      <Footer />
    </div>
  );
}
