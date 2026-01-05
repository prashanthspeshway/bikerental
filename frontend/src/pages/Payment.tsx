import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getCurrentUser, paymentsAPI, documentsAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Bike } from '@/types';
import { Plus } from 'lucide-react';

interface BookingDetails {
  bike: Bike;
  pickupTime: string;
  dropoffTime: string;
  durationHours: number;
  totalAmount: number;
}

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [extraImages, setExtraImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const bookingDetails = location.state?.bookingDetails as BookingDetails;

  useEffect(() => {
    if (!bookingDetails) {
      navigate('/garage');
      return;
    }
    const user = getCurrentUser();
    if (!user) {
      toast({ title: 'Login Required', description: 'Please login to continue payment.', variant: 'destructive' });
      navigate('/auth');
      return;
    }

    // Check if all documents are verified
    const checkDocuments = async () => {
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
        navigate('/garage');
      }
    };

    checkDocuments();
  }, [bookingDetails, navigate]);

  if (!bookingDetails) return null;

  const { bike, pickupTime, dropoffTime, durationHours, totalAmount } = bookingDetails;

  const onPickFiles = () => {
    fileInputRef.current?.click();
  };

  const onFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      setUploading(true);
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const res = await documentsAPI.uploadFile(file, file.name, 'rental_bike_image');
        if (res?.fileUrl) {
          uploadedUrls.push(res.fileUrl);
        } else if (res?.url) {
          uploadedUrls.push(res.url);
        }
      }
      if (uploadedUrls.length > 0) {
        setExtraImages((prev) => [...prev, ...uploadedUrls]);
        toast({ title: 'Images uploaded', description: `${uploadedUrls.length} image(s) added` });
      }
    } catch (err: any) {
      toast({ title: 'Upload error', description: err.message || 'Failed to upload images', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      const { keyId } = await paymentsAPI.getKey();
      const order = await paymentsAPI.createOrder(totalAmount);
      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'RideFlow',
        description: `Rental for ${bike.name}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            const selectedLocationId = localStorage.getItem('selectedLocation') || undefined;
            const result = await paymentsAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingDetails: {
                bikeId: bike.id,
                pickupTime,
                dropoffTime,
                totalAmount,
                selectedLocationId,
                additionalImages: extraImages
              }
            });
            
            if (result.success) {
              navigate('/payment-success', { state: { rental: result.rental, bike } });
            }
          } catch (error) {
            toast({
              title: 'Payment Verification Failed',
              description: 'Please contact support if money was deducted.',
              variant: 'destructive',
            });
          }
        },
        prefill: {
          name: 'RideFlow User',
          email: 'user@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#F97316'
        }
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initiate payment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6">Payment Summary</h1>
          <Card>
            <CardHeader>
              <CardTitle>{bike.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Bike Images</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPickFiles}
                    disabled={uploading}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {uploading ? 'Uploading...' : 'Add Images'}
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={onFilesSelected}
                />
                <div className="flex gap-3 flex-wrap">
                  {bike.image && (
                    <img
                      src={bike.image}
                      alt={bike.name}
                      className="w-20 h-20 object-cover rounded-md border"
                    />
                  )}
                  {extraImages.map((url, idx) => (
                    <img
                      key={`${url}-${idx}`}
                      src={url}
                      alt={`Extra ${idx + 1}`}
                      className="w-20 h-20 object-cover rounded-md border"
                    />
                  ))}
                  <button
                    type="button"
                    onClick={onPickFiles}
                    className="w-20 h-20 rounded-md border border-dashed flex items-center justify-center text-muted-foreground hover:bg-muted/50"
                    aria-label="Add image"
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload any extra bike images before payment.
                </p>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pickup</span>
                <span className="font-medium">{new Date(pickupTime).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dropoff</span>
                <span className="font-medium">{new Date(dropoffTime).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{Math.round(durationHours)} hours</span>
              </div>
              <hr />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? 'Processing...' : `Pay ₹${totalAmount.toFixed(2)}`}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
