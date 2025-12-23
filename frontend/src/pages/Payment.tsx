import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getCurrentUser, paymentsAPI, documentsAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Bike } from '@/types';

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
                selectedLocationId
              }
            });
            
            if (result.success) {
              navigate('/payment-success', { state: { rental: result.rental, bike } });
            }
          } catch (error) {
            console.error(error);
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
      console.error(error);
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
                <span>₹{totalAmount}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? 'Processing...' : `Pay ₹${totalAmount}`}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
