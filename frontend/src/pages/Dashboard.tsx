import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  FileText,
  Upload,
  Plus,
  History,
  User,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  Bike,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { usersAPI, rentalsAPI, documentsAPI, getCurrentUser, authAPI } from '@/lib/api';

const statusStyles = {
  approved: { color: 'bg-accent/10 text-accent', icon: CheckCircle },
  pending: { color: 'bg-primary/10 text-primary', icon: Clock },
  rejected: { color: 'bg-destructive/10 text-destructive', icon: XCircle },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [topUpAmount, setTopUpAmount] = useState('');
  const [user, setUser] = useState<any>(null);
  const [rentals, setRentals] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    emergencyContact: '',
    familyContact: '',
    permanentAddress: '',
    currentAddress: '',
    hotelStay: '',
  });
  const [documentFiles, setDocumentFiles] = useState({
    aadharFront: null as File | null,
    aadharBack: null as File | null,
    pan: null as File | null,
    drivingLicense: null as File | null,
  });
  const getLatestDoc = (type: 'aadhar_front' | 'aadhar_back' | 'pan' | 'driving_license') => {
    const docsOfType = documents.filter((d) => d.type === type);
    if (docsOfType.length === 0) return null;
    return docsOfType.sort(
      (a: any, b: any) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )[0];
  };
  const getDocStatus = (type: 'aadhar_front' | 'aadhar_back' | 'pan' | 'driving_license') =>
    getLatestDoc(type)?.status || 'none';

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        navigate('/auth');
        return;
      }
      // Load user data
      try {
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
        setFormData({
          name: userData.name || '',
          mobile: userData.mobile || '',
          email: userData.email || '',
          emergencyContact: userData.emergencyContact || '',
          familyContact: userData.familyContact || '',
          permanentAddress: userData.permanentAddress || '',
          currentAddress: userData.currentAddress || '',
          hotelStay: userData.hotelStay || '',
        });
      } catch (err: any) {
        if (err.message?.toLowerCase().includes('token')) {
          authAPI.logout();
          navigate('/auth');
          return;
        }
      }
      // Load rentals
      try {
        const rentalsData = await rentalsAPI.getAll();
        setRentals(rentalsData);
      } catch {}
      // Load documents
      try {
        const docsData = await documentsAPI.getAll();
        setDocuments(docsData);
      } catch {}
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to top up.",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    try {
      const updatedUser = await usersAPI.topUpWallet(user.id, parseFloat(topUpAmount));
      setUser(updatedUser);
      setTopUpAmount('');
      toast({
        title: "Success",
        description: `$${topUpAmount} added to your wallet.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to top up wallet",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (type: 'aadharFront' | 'aadharBack' | 'pan' | 'drivingLicense', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentFiles(prev => ({ ...prev, [type]: file }));
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      await usersAPI.update(user.id, {
        name: formData.name,
        mobile: formData.mobile,
        emergencyContact: formData.emergencyContact,
        familyContact: formData.familyContact,
        permanentAddress: formData.permanentAddress,
        currentAddress: formData.currentAddress,
        hotelStay: formData.hotelStay,
      });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      loadUserData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleDocumentUpload = async (type: 'aadhar_front' | 'aadhar_back' | 'pan' | 'driving_license', file: File) => {
    if (!file || !user) return;

    try {
      let fileUrl: string | undefined;
      try {
        const presign = await documentsAPI.getUploadUrl(file.name, type, file.type);
        await fetch(presign.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        fileUrl = presign.fileUrl;
      } catch (err) {
        const direct = await documentsAPI.uploadFile(file, file.name, type);
        fileUrl = direct.fileUrl;
      }
      const doc = await documentsAPI.upload(file.name, type, fileUrl);
      setDocuments([...documents, doc]);
      toast({
        title: "Success",
        description: "Document uploaded successfully. Pending admin approval.",
      });
      // Clear the file input
      setDocumentFiles(prev => ({ ...prev, [type === 'aadhar_front' ? 'aadharFront' : type === 'aadhar_back' ? 'aadharBack' : type === 'pan' ? 'pan' : 'drivingLicense']: null }));
      loadUserData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    }
  };

  const handleAction = async (action: 'cancel' | 'start' | 'complete', id: string) => {
    try {
      if (action === 'cancel') await rentalsAPI.cancel(id);
      if (action === 'start') await rentalsAPI.startRide(id);
      if (action === 'complete') await rentalsAPI.completeRide(id);
      toast({ title: "Success", description: `Rental ${action}ed successfully` });
      loadUserData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleReview = async (id: string) => {
    const ratingStr = window.prompt("Rate (1-5):", "5");
    const comment = window.prompt("Comment:", "Great ride!");
    if (ratingStr && comment) {
      const rating = parseInt(ratingStr);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        toast({ title: "Error", description: "Invalid rating", variant: "destructive" });
        return;
      }
      try {
        await rentalsAPI.submitReview(id, { rating, comment });
        toast({ title: "Success", description: "Review submitted" });
      } catch (error: any) {
         toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'history', label: 'Rental History', icon: History },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              {isLoading ? 'Loading...' : `Welcome, ${user?.name || 'User'}`}
            </h1>
            <p className="text-muted-foreground">
              Manage your account, wallet, and documents.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl shadow-card p-4 sticky top-24">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
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
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Overview */}
              {activeTab === 'overview' && (
                <>
                  {/* Stats Cards */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-card rounded-2xl shadow-card p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center">
                          <Wallet className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Wallet Balance</p>
                          <p className="text-2xl font-display font-bold">${user?.walletBalance?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card rounded-2xl shadow-card p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                          <Bike className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Rentals</p>
                          <p className="text-2xl font-display font-bold">{rentals.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card rounded-2xl shadow-card p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                          <FileText className="h-6 w-6 text-secondary-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Documents</p>
                          <p className="text-2xl font-display font-bold">{documents.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* My Documents */}
                  <div className="bg-card rounded-2xl shadow-card p-6">
                    <h3 className="font-display font-semibold text-lg mb-4">My Documents</h3>
                    {documents.length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        {documents.map((doc) => {
                          const StatusIcon = statusStyles[doc.status as keyof typeof statusStyles].icon;
                          const isImage =
                            (doc.url && /\.(png|jpg|jpeg)$/i.test(doc.url)) ||
                            (doc.name && /\.(png|jpg|jpeg)$/i.test(doc.name));
                          return (
                            <div key={doc.id || doc._id} className="rounded-xl overflow-hidden bg-muted/50 border">
                              <div className="relative">
                                {isImage ? (
                                  <img
                                    src={doc.url}
                                    alt={doc.name}
                                    className="w-full h-48 object-contain bg-muted"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="flex items-center justify-center w-full h-48 bg-muted">
                                    <a
                                      href={doc.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm underline text-muted-foreground"
                                    >
                                      Open Document
                                    </a>
                                  </div>
                                )}
                                <div className="absolute top-2 right-2">
                                  <Badge className={statusStyles[doc.status as keyof typeof statusStyles].color}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                  </Badge>
                                </div>
                              </div>
                              <div className="p-4 flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{doc.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {doc.type.replace('_', ' ')} • Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs underline text-muted-foreground"
                                >
                                  View
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No documents uploaded yet</p>
                    )}
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-card rounded-2xl shadow-card p-6">
                    <h3 className="font-display font-semibold text-lg mb-4">Recent Rentals</h3>
                    <div className="space-y-4">
                      {rentals.slice(0, 3).length > 0 ? (
                        rentals.slice(0, 3).map((rental) => {
                          const StatusIcon = statusStyles[rental.status as keyof typeof statusStyles]?.icon || Clock;
                          return (
                            <div key={rental.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                                  <Bike className="h-5 w-5 text-secondary-foreground" />
                                </div>
                                <div>
                                  <p className="font-medium">Rental #{rental.id.slice(0, 8)}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(rental.startTime).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Badge className={statusStyles[rental.status as keyof typeof statusStyles]?.color || 'bg-muted'}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                              </Badge>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No rentals yet</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Wallet */}
              {activeTab === 'wallet' && (
                <div className="space-y-6">
                  <div className="bg-card rounded-2xl shadow-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-muted-foreground mb-2">Current Balance</p>
                        <p className="text-4xl font-display font-bold">${user?.walletBalance?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div className="w-14 h-14 rounded-xl gradient-hero flex items-center justify-center">
                        <CreditCard className="h-7 w-7 text-primary-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Top Up */}
                  <div className="bg-card rounded-2xl shadow-card p-6">
                    <h3 className="font-display font-semibold text-lg mb-4">Top Up Wallet</h3>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label htmlFor="amount">Amount ($)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="Enter amount"
                          value={topUpAmount}
                          onChange={(e) => setTopUpAmount(e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={handleTopUp}>
                          <Plus className="h-4 w-4 mr-2" />
                          Top Up
                        </Button>
                      </div>
                    </div>

                    {/* Quick Amounts */}
                    <div className="flex gap-2 mt-4">
                      {[10, 25, 50, 100].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          onClick={() => setTopUpAmount(amount.toString())}
                        >
                          ${amount}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Documents */}
              {activeTab === 'documents' && (
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div className="bg-card rounded-2xl shadow-card p-6">
                    <h3 className="font-display font-semibold text-lg mb-4">Personal Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile">Mobile Number</Label>
                      <Input
                        id="mobile"
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                        placeholder="Enter your mobile number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact">Emergency Contact</Label>
                      <Input
                        id="emergencyContact"
                        type="tel"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                        placeholder="Enter emergency contact number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="familyContact">Family Contact</Label>
                      <Input
                        id="familyContact"
                        type="tel"
                        value={formData.familyContact}
                        onChange={(e) => setFormData(prev => ({ ...prev, familyContact: e.target.value }))}
                        placeholder="Enter family contact number"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="permanentAddress">Permanent Address</Label>
                      <Input
                        id="permanentAddress"
                        value={formData.permanentAddress}
                        onChange={(e) => setFormData(prev => ({ ...prev, permanentAddress: e.target.value }))}
                        placeholder="Enter your permanent address"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="currentAddress">Current Address</Label>
                      <Input
                        id="currentAddress"
                        value={formData.currentAddress}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentAddress: e.target.value }))}
                        placeholder="Enter your current address"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="hotelStay">Hotel Stay</Label>
                      <Input
                        id="hotelStay"
                        value={formData.hotelStay}
                        onChange={(e) => setFormData(prev => ({ ...prev, hotelStay: e.target.value }))}
                        placeholder="Enter hotel details (if any)"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Button onClick={handleUpdateProfile}>
                        Update Profile
                      </Button>
                    </div>
                  </div>
                </div>

                  {/* Document Upload Section */}
                  <div className="bg-card rounded-2xl shadow-card p-6">
                    <h3 className="font-display font-semibold text-lg mb-4">Upload Documents</h3>
                    
                    {/* Aadhar Card - Front and Back Side by Side */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Aadhar Card - Front</Label>
                          {(() => {
                            const status = getDocStatus('aadhar_front') as 'approved' | 'pending' | 'rejected' | 'none';
                            if (status === 'none') return null;
                            const StatusIcon = statusStyles[status as keyof typeof statusStyles]?.icon || Clock;
                            return (
                              <Badge className={statusStyles[status as keyof typeof statusStyles]?.color || 'bg-muted'}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status === 'approved' ? 'Accepted' : status.charAt(0).toUpperCase() + status.slice(1)}
                              </Badge>
                            );
                          })()}
                        </div>
                        <div className="border-2 border-dashed border-border rounded-xl p-4">
                          {(() => {
                            const status = getDocStatus('aadhar_front') as 'approved' | 'pending' | 'rejected' | 'none';
                            const canUpload = status === 'none' || status === 'rejected';
                            if (!canUpload) {
                              return (
                                <div className="text-center text-sm text-muted-foreground">
                                  {status === 'approved' ? 'Document accepted' : 'Document pending review'}
                                </div>
                              );
                            }
                            return (
                              <>
                                <input
                                  type="file"
                                  id="aadhar-front"
                                  className="hidden"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => handleFileChange('aadharFront', e)}
                                />
                                <label
                                  htmlFor="aadhar-front"
                                  className="cursor-pointer flex flex-col items-center"
                                >
                                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                                  <p className="text-sm text-center">
                                    {documentFiles.aadharFront ? documentFiles.aadharFront.name : 'Click to upload'}
                                  </p>
                                </label>
                                {documentFiles.aadharFront && (
                                  <Button
                                    size="sm"
                                    className="w-full mt-2"
                                    onClick={() => handleDocumentUpload('aadhar_front', documentFiles.aadharFront!)}
                                  >
                                    Upload
                                  </Button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Aadhar Card - Back</Label>
                          {(() => {
                            const status = getDocStatus('aadhar_back') as 'approved' | 'pending' | 'rejected' | 'none';
                            if (status === 'none') return null;
                            const StatusIcon = statusStyles[status as keyof typeof statusStyles]?.icon || Clock;
                            return (
                              <Badge className={statusStyles[status as keyof typeof statusStyles]?.color || 'bg-muted'}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status === 'approved' ? 'Accepted' : status.charAt(0).toUpperCase() + status.slice(1)}
                              </Badge>
                            );
                          })()}
                        </div>
                        <div className="border-2 border-dashed border-border rounded-xl p-4">
                          {(() => {
                            const status = getDocStatus('aadhar_back') as 'approved' | 'pending' | 'rejected' | 'none';
                            const canUpload = status === 'none' || status === 'rejected';
                            if (!canUpload) {
                              return (
                                <div className="text-center text-sm text-muted-foreground">
                                  {status === 'approved' ? 'Document accepted' : 'Document pending review'}
                                </div>
                              );
                            }
                            return (
                              <>
                                <input
                                  type="file"
                                  id="aadhar-back"
                                  className="hidden"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => handleFileChange('aadharBack', e)}
                                />
                                <label
                                  htmlFor="aadhar-back"
                                  className="cursor-pointer flex flex-col items-center"
                                >
                                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                                  <p className="text-sm text-center">
                                    {documentFiles.aadharBack ? documentFiles.aadharBack.name : 'Click to upload'}
                                  </p>
                                </label>
                                {documentFiles.aadharBack && (
                                  <Button
                                    size="sm"
                                    className="w-full mt-2"
                                    onClick={() => handleDocumentUpload('aadhar_back', documentFiles.aadharBack!)}
                                  >
                                    Upload
                                  </Button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* PAN Card and Driving License */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>PAN Card</Label>
                          {(() => {
                            const status = getDocStatus('pan') as 'approved' | 'pending' | 'rejected' | 'none';
                            if (status === 'none') return null;
                            const StatusIcon = statusStyles[status as keyof typeof statusStyles]?.icon || Clock;
                            return (
                              <Badge className={statusStyles[status as keyof typeof statusStyles]?.color || 'bg-muted'}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status === 'approved' ? 'Accepted' : status.charAt(0).toUpperCase() + status.slice(1)}
                              </Badge>
                            );
                          })()}
                        </div>
                        <div className="border-2 border-dashed border-border rounded-xl p-4">
                          {(() => {
                            const status = getDocStatus('pan') as 'approved' | 'pending' | 'rejected' | 'none';
                            const canUpload = status === 'none' || status === 'rejected';
                            if (!canUpload) {
                              return (
                                <div className="text-center text-sm text-muted-foreground">
                                  {status === 'approved' ? 'Document accepted' : 'Document pending review'}
                                </div>
                              );
                            }
                            return (
                              <>
                                <input
                                  type="file"
                                  id="pan"
                                  className="hidden"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => handleFileChange('pan', e)}
                                />
                                <label
                                  htmlFor="pan"
                                  className="cursor-pointer flex flex-col items-center"
                                >
                                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                                  <p className="text-sm text-center">
                                    {documentFiles.pan ? documentFiles.pan.name : 'Click to upload'}
                                  </p>
                                </label>
                                {documentFiles.pan && (
                                  <Button
                                    size="sm"
                                    className="w-full mt-2"
                                    onClick={() => handleDocumentUpload('pan', documentFiles.pan!)}
                                  >
                                    Upload
                                  </Button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Driving License</Label>
                          {(() => {
                            const status = getDocStatus('driving_license') as 'approved' | 'pending' | 'rejected' | 'none';
                            if (status === 'none') return null;
                            const StatusIcon = statusStyles[status as keyof typeof statusStyles]?.icon || Clock;
                            return (
                              <Badge className={statusStyles[status as keyof typeof statusStyles]?.color || 'bg-muted'}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status === 'approved' ? 'Accepted' : status.charAt(0).toUpperCase() + status.slice(1)}
                              </Badge>
                            );
                          })()}
                        </div>
                        <div className="border-2 border-dashed border-border rounded-xl p-4">
                          {(() => {
                            const status = getDocStatus('driving_license') as 'approved' | 'pending' | 'rejected' | 'none';
                            const canUpload = status === 'none' || status === 'rejected';
                            if (!canUpload) {
                              return (
                                <div className="text-center text-sm text-muted-foreground">
                                  {status === 'approved' ? 'Document accepted' : 'Document pending review'}
                                </div>
                              );
                            }
                            return (
                              <>
                                <input
                                  type="file"
                                  id="driving-license"
                                  className="hidden"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => handleFileChange('drivingLicense', e)}
                                />
                                <label
                                  htmlFor="driving-license"
                                  className="cursor-pointer flex flex-col items-center"
                                >
                                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                                  <p className="text-sm text-center">
                                    {documentFiles.drivingLicense ? documentFiles.drivingLicense.name : 'Click to upload'}
                                  </p>
                                </label>
                                {documentFiles.drivingLicense && (
                                  <Button
                                    size="sm"
                                    className="w-full mt-2"
                                    onClick={() => handleDocumentUpload('driving_license', documentFiles.drivingLicense!)}
                                  >
                                    Upload
                                  </Button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      Supported: PDF, JPG, PNG (Max 10MB per file)
                    </p>
                  </div>
                </div>
              )}

              {/* Rental History */}
              {activeTab === 'history' && (
                <div className="bg-card rounded-2xl shadow-card p-6">
                  <h3 className="font-display font-semibold text-lg mb-4">Rental History</h3>
                  <div className="space-y-4">
                    {rentals.length > 0 ? (
                      rentals.map((rental) => {
                        const StatusIcon = statusStyles[rental.status as keyof typeof statusStyles]?.icon || Clock;
                        const bikeName = rental.bikeId?.name || 'Unknown Bike';
                        const bookingId = rental.bookingId || rental.id.slice(0, 8);
                        
                        return (
                          <div key={rental.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-muted/50 gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                                <Bike className="h-5 w-5 text-secondary-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">{bikeName}</p>
                                <p className="text-xs text-muted-foreground font-mono">ID: {bookingId}</p>
                                <div className="text-sm text-muted-foreground mt-1">
                                  <p>Pickup: {new Date(rental.pickupTime || rental.startTime).toLocaleString()}</p>
                                  {rental.dropoffTime && <p>Dropoff: {new Date(rental.dropoffTime).toLocaleString()}</p>}
                                </div>
                                {rental.totalAmount && (
                                  <p className="text-sm font-medium mt-1">Total: ₹{rental.totalAmount}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Badge className={statusStyles[rental.status as keyof typeof statusStyles]?.color || 'bg-muted'}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                              </Badge>
                              
                              {rental.status === 'confirmed' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => toast({ title: "Coming Soon", description: "Cancellation feature coming soon." })}
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No rental history</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
