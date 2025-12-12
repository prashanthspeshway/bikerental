import { useState } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import { bikes } from '@/data/bikes';
import { toast } from '@/hooks/use-toast';

// Mock data
const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    walletBalance: 75.5,
    documentsCount: 2,
    status: 'verified',
    joinedAt: '2024-01-10',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    walletBalance: 120.0,
    documentsCount: 3,
    status: 'pending',
    joinedAt: '2024-01-15',
  },
  {
    id: '3',
    name: 'Bob Wilson',
    email: 'bob@example.com',
    walletBalance: 0,
    documentsCount: 1,
    status: 'unverified',
    joinedAt: '2024-01-20',
  },
];

const mockDocuments = [
  { id: '1', userName: 'John Doe', docName: 'Driving License', type: 'license', status: 'approved', uploadedAt: '2024-01-15' },
  { id: '2', userName: 'Jane Smith', docName: 'ID Card', type: 'id', status: 'pending', uploadedAt: '2024-01-18' },
  { id: '3', userName: 'Bob Wilson', docName: 'Passport', type: 'id', status: 'pending', uploadedAt: '2024-01-20' },
];

const statusStyles = {
  verified: { color: 'bg-accent/10 text-accent', icon: CheckCircle },
  pending: { color: 'bg-primary/10 text-primary', icon: Clock },
  unverified: { color: 'bg-destructive/10 text-destructive', icon: XCircle },
  approved: { color: 'bg-accent/10 text-accent', icon: CheckCircle },
  rejected: { color: 'bg-destructive/10 text-destructive', icon: XCircle },
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const handleDocumentAction = (docId: string, action: 'approve' | 'reject') => {
    toast({
      title: action === 'approve' ? 'Document Approved' : 'Document Rejected',
      description: 'This action requires backend setup. Connect Supabase to enable.',
    });
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
    { label: 'Active Users', value: mockUsers.length, icon: Users, color: 'bg-accent' },
    { label: 'Pending Docs', value: mockDocuments.filter(d => d.status === 'pending').length, icon: FileText, color: 'bg-secondary' },
    { label: 'Revenue', value: '$1,250', icon: DollarSign, color: 'gradient-hero' },
  ];

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

        {/* Logout */}
        <Link to="/">
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
            <LogOut className="h-5 w-5" />
            Back to Site
          </Button>
        </Link>
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
                {mockDocuments.filter(d => d.status === 'pending').map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <FileText className="h-5 w-5 text-secondary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.docName}</p>
                        <p className="text-sm text-muted-foreground">{doc.userName} • {doc.uploadedAt}</p>
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
                ))}
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
                <Bike className="h-4 w-4 mr-2" />
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
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
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
                    <th className="text-left px-6 py-4 font-medium">Wallet</th>
                    <th className="text-left px-6 py-4 font-medium">Documents</th>
                    <th className="text-left px-6 py-4 font-medium">Status</th>
                    <th className="text-left px-6 py-4 font-medium">Joined</th>
                    <th className="text-left px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {mockUsers.map((user) => {
                    const StatusIcon = statusStyles[user.status as keyof typeof statusStyles].icon;
                    return (
                      <tr key={user.id} className="hover:bg-muted/30">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">${user.walletBalance.toFixed(2)}</td>
                        <td className="px-6 py-4">{user.documentsCount}</td>
                        <td className="px-6 py-4">
                          <Badge className={statusStyles[user.status as keyof typeof statusStyles].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{user.joinedAt}</td>
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
                {mockDocuments.map((doc) => {
                  const StatusIcon = statusStyles[doc.status as keyof typeof statusStyles].icon;
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                          <FileText className="h-6 w-6 text-secondary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.docName}</p>
                          <p className="text-sm text-muted-foreground">{doc.userName} • {doc.type}</p>
                          <p className="text-xs text-muted-foreground">Uploaded: {doc.uploadedAt}</p>
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
                })}
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
                Settings panel requires backend setup. Connect Supabase to enable.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
