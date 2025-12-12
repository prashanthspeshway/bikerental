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

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      // Load user data
      const userData = await authAPI.getCurrentUser();
      setUser(userData);

      // Load rentals
      try {
        const rentalsData = await rentalsAPI.getAll();
        setRentals(rentalsData);
      } catch (error) {
        console.error('Failed to load rentals:', error);
      }

      // Load documents
      try {
        const docsData = await documentsAPI.getAll();
        setDocuments(docsData);
      } catch (error) {
        console.error('Failed to load documents:', error);
      }
    } catch (error: any) {
      if (error.message.includes('token')) {
        authAPI.logout();
        navigate('/auth');
      }
      toast({
        title: "Error",
        description: "Failed to load user data",
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // In a real app, you'd upload the file to a storage service first
    // For now, we'll just create a document entry
    try {
      const doc = await documentsAPI.upload(
        file.name,
        file.type.includes('pdf') ? 'license' : 'id',
        URL.createObjectURL(file)
      );
      setDocuments([...documents, doc]);
      toast({
        title: "Success",
        description: "Document uploaded successfully. Pending admin approval.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
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

                  {/* Recent Activity */}
                  <div className="bg-card rounded-2xl shadow-card p-6">
                    <h3 className="font-display font-semibold text-lg mb-4">Recent Rentals</h3>
                    <div className="space-y-4">
                      {rentals.slice(0, 3).length > 0 ? (
                        rentals.slice(0, 3).map((rental) => {
                          const startDate = new Date(rental.startTime);
                          const endDate = rental.endTime ? new Date(rental.endTime) : new Date();
                          const hours = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
                          return (
                            <div key={rental.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Bike className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{rental.bike?.name || 'Unknown Bike'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {startDate.toLocaleDateString()} • {hours} hour{hours !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">${rental.totalCost?.toFixed(2) || '0.00'}</p>
                                <Badge variant="secondary" className="bg-accent/10 text-accent">
                                  {rental.status}
                                </Badge>
                              </div>
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
                  {/* Balance Card */}
                  <div className="bg-card rounded-2xl shadow-card p-8 gradient-dark text-secondary-foreground">
                    <div className="flex items-start justify-between">
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
                  {/* Upload Section */}
                  <div className="bg-card rounded-2xl shadow-card p-6">
                    <h3 className="font-display font-semibold text-lg mb-4">Upload Document</h3>
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                      <input
                        type="file"
                        id="document-upload"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                      />
                      <label
                        htmlFor="document-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="font-medium mb-1">Drop your document here or click to browse</p>
                        <p className="text-sm text-muted-foreground">
                          Supported: PDF, JPG, PNG (Max 10MB)
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Document List */}
                  <div className="bg-card rounded-2xl shadow-card p-6">
                    <h3 className="font-display font-semibold text-lg mb-4">Your Documents</h3>
                    <div className="space-y-4">
                      {documents.length > 0 ? (
                        documents.map((doc) => {
                          const StatusIcon = statusStyles[doc.status as keyof typeof statusStyles].icon;
                          return (
                            <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                                  <FileText className="h-5 w-5 text-secondary-foreground" />
                                </div>
                                <div>
                                  <p className="font-medium">{doc.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Badge className={statusStyles[doc.status as keyof typeof statusStyles].color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                              </Badge>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No documents uploaded</p>
                      )}
                    </div>
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
                        const startDate = new Date(rental.startTime);
                        const endDate = rental.endTime ? new Date(rental.endTime) : new Date();
                        const hours = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
                        return (
                          <div key={rental.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Bike className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{rental.bike?.name || 'Unknown Bike'}</p>
                                <p className="text-sm text-muted-foreground">
                                  {startDate.toLocaleDateString()} • {hours} hour{hours !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-lg">${rental.totalCost?.toFixed(2) || '0.00'}</p>
                              <Badge variant="secondary" className="bg-accent/10 text-accent">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {rental.status}
                              </Badge>
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
