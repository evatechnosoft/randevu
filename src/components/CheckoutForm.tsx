import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CheckoutFormProps {
  onSuccess: (paymentIntentId: string) => void;
  amount: number;
}

export function CheckoutForm({ onSuccess, amount }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
      redirect: 'if_required',
    });

    if (error) {
      toast.error(error.message || 'Ödeme sırasında bir hata oluştu.');
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement className="glass p-4 rounded-xl" />
      <Button 
        disabled={isProcessing || !stripe || !elements} 
        className="w-full btn-gradient py-6 text-lg"
      >
        {isProcessing ? 'Ödeme İşleniyor...' : `${amount} TL Öde ve Tamamla`}
      </Button>
    </form>
  );
}
