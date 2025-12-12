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
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { bikesAPI, usersAPI, documentsAPI, authAPI, getCurrentUser } from '@/lib/api';
import { Bike as BikeType } from '@/types';

const statusStyles = {
  verified: { color: 'bg-accent/10 text-accent', icon: CheckCircle },
  pending: { color: 'bg-primary/10 text-primary', icon: Clock },
  unverified: { color: 'bg-destructive/10 text-destructive', icon: XCircle },
  approved: { color: 'bg-accent/10 text-accent', icon: CheckCircle },
  rejected: { color: 'bg-destructive/10 text-destructive', icon: XCircle },
};

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [bikes, setBikes] = useState<BikeType[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

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

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [bikesData, usersData, docsData] = await Promise.all([
        bikesAPI.getAll(),
        usersAPI.getAll(),
        documentsAPI.getAll().catch(() => []),
      ]);
      setBikes(bikesData);
      setUsers(usersData);
      setDocuments(docsData);
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
      toast({
        title: "Error",
        description: error.message || "Failed to update document",
        variant: "destructive",
      });
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bikes', label: 'Bikes', icon: Bike },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const stats = [
    { label: 'Total Bikes', value: bikes.length, icon: Bike, color: 'gradient-hero' },
    { label: 'Active Users', value: users.length, icon: Users, color: 'bg-accent' },
    { label: 'Pending Docs', value: documents.filter(d => d.status === 'pending').length, icon: FileText, color: 'bg-secondary' },
    { label: 'Total Revenue', value: '$0', icon: DollarSign, color: 'gradient-hero' },
  ];

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Badge variant="secondary" className="ml-2 text-xs">Admin</Badge>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
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

        {/* User Info & Logout */}
        <div className="space-y-2 pt-4 border-t border-border">
          <div className="px-4 py-2 text-sm">
            <p className="font-medium">{currentUser?.name}</p>
            <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-display font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Overview of your bike rental business.</p>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              {stats.map((stat) => (
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

            {/* Recent Documents */}
            <div className="bg-card rounded-2xl shadow-card p-6">
              <h3 className="font-display font-semibold text-lg mb-4">Pending Documents</h3>
              <div className="space-y-4">
                {documents.filter(d => d.status === 'pending').length > 0 ? (
                  documents.filter(d => d.status === 'pending').map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                          <FileText className="h-5 w-5 text-secondary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">{doc.type} • {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleDocumentAction(doc.id, 'reject')}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={() => handleDocumentAction(doc.id, 'approve')}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No pending documents</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bikes */}
        {activeTab === 'bikes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-display font-bold mb-2">Manage Bikes</h1>
                <p className="text-muted-foreground">Add, edit, or remove bikes from your fleet.</p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Bike
              </Button>
            </div>

            <div className="bg-card rounded-2xl shadow-card overflow-hidden">
              <table className="w-full">
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
                      <td className="px-6 py-4">${bike.pricePerHour}</td>
                      <td className="px-6 py-4">{bike.kmLimit} km</td>
                      <td className="px-6 py-4">
                        <Badge variant={bike.available ? 'default' : 'secondary'} className={bike.available ? 'bg-accent text-accent-foreground' : ''}>
                          {bike.available ? 'Available' : 'In Use'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-display font-bold mb-2">Users</h1>
              <p className="text-muted-foreground">Manage registered users and their verification status.</p>
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
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-4 font-medium">User</th>
                    <th className="text-left px-6 py-4 font-medium">Role</th>
                    <th className="text-left px-6 py-4 font-medium">Wallet</th>
                    <th className="text-left px-6 py-4 font-medium">Documents</th>
                    <th className="text-left px-6 py-4 font-medium">Joined</th>
                    <th className="text-left px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => {
                    const docCount = user.documents?.length || 0;
                    const hasApprovedDocs = user.documents?.some((d: any) => d.status === 'approved');
                    const status = hasApprovedDocs ? 'verified' : docCount > 0 ? 'pending' : 'unverified';
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
                        <td className="px-6 py-4">${user.walletBalance?.toFixed(2) || '0.00'}</td>
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
                          <Button variant="ghost" size="sm">
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
        )}

        {/* Documents */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-display font-bold mb-2">User Documents</h1>
              <p className="text-muted-foreground">Review and approve user-submitted documents.</p>
            </div>

            <div className="bg-card rounded-2xl shadow-card p-6">
              <div className="space-y-4">
                {documents.length > 0 ? (
                  documents.map((doc) => {
                    const StatusIcon = statusStyles[doc.status as keyof typeof statusStyles].icon;
                    return (
                      <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                            <FileText className="h-6 w-6 text-secondary-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-muted-foreground">{doc.type}</p>
                            <p className="text-xs text-muted-foreground">Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={statusStyles[doc.status as keyof typeof statusStyles].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                          </Badge>
                          {doc.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleDocumentAction(doc.id, 'reject')}>
                                Reject
                              </Button>
                              <Button size="sm" onClick={() => handleDocumentAction(doc.id, 'approve')}>
                                Approve
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground text-center py-8">No documents found</p>
                )}
              </div>
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
    </div>
  );
}
