import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getCurrentUser, paymentsAPI, documentsAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Bike } from '@/types';
import { Camera, X } from 'lucide-react';

interface BookingDetails {
  bike: Bike;
  pickupTime: string;
  dropoffTime: string;
  durationHours: number;
  totalAmount: number;
}

const MAX_IMAGES = 5;

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [extraImages, setExtraImages] = useState<(string | null)[]>(Array(MAX_IMAGES).fill(null));
  const [uploading, setUploading] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>(Array(MAX_IMAGES).fill(null));
  
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

  const onPickFile = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  const onFileSelected = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if slot is already filled
    if (extraImages[index]) {
      toast({ title: 'Slot already filled', description: 'Please remove the existing image first', variant: 'destructive' });
      return;
    }

    try {
      setUploading(index);
      const res = await documentsAPI.uploadFile(file, file.name, 'rental_bike_image');
      const imageUrl = res?.fileUrl || res?.url;
      
      if (imageUrl) {
        setExtraImages((prev) => {
          const newImages = [...prev];
          newImages[index] = imageUrl;
          return newImages;
        });
        toast({ title: 'Image uploaded', description: 'Image added successfully' });
      } else {
        toast({ title: 'Upload failed', description: 'No file URL returned', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Upload error', description: err.message || 'Failed to upload image', variant: 'destructive' });
    } finally {
      setUploading(null);
      if (fileInputRefs.current[index]) fileInputRefs.current[index]!.value = '';
    }
  };

  const removeImage = (index: number) => {
    setExtraImages((prev) => {
      const newImages = [...prev];
      newImages[index] = null;
      return newImages;
    });
  };

  const filledSlots = extraImages.filter(img => img !== null).length;
  const canAddMore = filledSlots < MAX_IMAGES;

  const handlePayment = async () => {
    try {
      if (filledSlots < MAX_IMAGES) {
        toast({
          title: 'Images Required',
          description: `Please upload all ${MAX_IMAGES} bike images before payment.`,
          variant: 'destructive',
        });
        return;
      }
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
                additionalImages: extraImages.filter((img): img is string => img !== null)
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
                <div className="mb-2">
                  <span className="font-medium">Bike Images</span>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {Array.from({ length: MAX_IMAGES }).map((_, index) => {
                    const imageUrl = extraImages[index];
                    const isUploading = uploading === index;
                    return (
                      <div key={index} className="relative">
                        <input
                          ref={(el) => { fileInputRefs.current[index] = el; }}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => onFileSelected(index, e)}
                          disabled={isUploading || !!imageUrl}
                        />
                        {imageUrl ? (
                          <div className="relative w-20 h-20 rounded-md border overflow-hidden group">
                            <img
                              src={imageUrl}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                              aria-label="Remove image"
                            >
                              <X className="h-5 w-5 text-white" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onPickFile(index)}
                            disabled={isUploading}
                            className="w-20 h-20 rounded-md border border-dashed flex items-center justify-center text-muted-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-label="Add image"
                          >
                            {isUploading ? (
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            ) : (
                              <Camera className="h-6 w-6" />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload all {MAX_IMAGES} bike images to proceed ({filledSlots}/{MAX_IMAGES} uploaded).
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
                disabled={loading || filledSlots < MAX_IMAGES}
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
