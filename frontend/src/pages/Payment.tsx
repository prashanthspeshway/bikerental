import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { paymentsAPI } from '@/lib/api';
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
    }
  }, [bookingDetails, navigate]);

  if (!bookingDetails) return null;

  const { bike, pickupTime, dropoffTime, durationHours, totalAmount } = bookingDetails;

  const handlePayment = async () => {
    try {
      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKeyId) {
        toast({
          title: 'Payment Setup Required',
          description: 'Missing Razorpay key. Please configure VITE_RAZORPAY_KEY_ID.',
          variant: 'destructive',
        });
        return;
      }
      setLoading(true);
      const order = await paymentsAPI.createOrder(totalAmount);
      const options = {
        key: razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'RideFlow',
        description: `Rental for ${bike.name}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            const result = await paymentsAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingDetails: {
                bikeId: bike.id,
                pickupTime,
                dropoffTime,
                totalAmount
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
