import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CreditCard, Smartphone, CheckCircle2, Lock, ChevronLeft } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import './Checkout.css';

const CheckoutPage: React.FC = () => {
  const { paymentId } = useParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchPaymentInfo = async () => {
      try {
        const response = await fetch(`/api/v1/checkout/payments/${paymentId}`);
        if (!response.ok) throw new Error('Payment not found');
        const data = await response.json();
        
        setPaymentData({
          amount: data.amount,
          currency: data.currency || 'ETB',
          merchantName: data.merchantName || 'Demo Merchant',
          status: data.status,
          allowedPaymentMethods: data.allowedPaymentMethods || ['CARD']
        });

        if (data.paymentMethod) {
          setSelectedMethod(data.paymentMethod.toLowerCase() === 'telebirr' ? 'telebirr' : 'card');
        } else if (data.allowedPaymentMethods && data.allowedPaymentMethods.length > 0) {
          setSelectedMethod(data.allowedPaymentMethods[0].toLowerCase());
        }
      } catch (err) {
        // Fallback for missing or unroutable data (local dev)
        setPaymentData({
          amount: 150000,
          currency: 'ETB',
          merchantName: 'Premium Tech Store',
          status: 'PENDING',
          allowedPaymentMethods: ['CARD', 'TELEBIRR']
        });
      } finally {
        setTimeout(() => setIsLoading(false), 500);
      }
    };

    if (paymentId) fetchPaymentInfo();
  }, [paymentId]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      const response = await fetch(`/api/v1/checkout/payments/${paymentId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod: selectedMethod,
          // cardDetails or phoneNumber would go here in a real app
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process payment');
      }
      
      const result = await response.json();
      if (result.status === 'SUCCEEDED') {
        setIsSuccess(true);
      } else if (result.status === 'REQUIRES_ACTION' && result.checkout_url) {
        // Redirect to the 3DS2 Challenge URL
        window.location.href = result.checkout_url;
      } else {
        toast.error('Payment is still pending or failed: ' + result.status);
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while processing your payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="checkout-loading-screen">
        <div className="checkout-spinner-ring"></div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="checkout-page-container">
        <div className="checkout-success-container">
          <div className="success-checkmark-circle">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>
          <h2 className="success-heading">Payment successful</h2>
          <p className="success-subheading">Thank you for your payment to {paymentData.merchantName}.</p>
          
          <div className="success-details-box">
            <div className="detail-row">
              <span className="detail-label">Amount paid</span>
              <span className="detail-value">{(paymentData.amount / 100).toFixed(2)} {paymentData.currency}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Reference</span>
              <span className="detail-value font-mono">{paymentId?.split('-')[0]}</span>
            </div>
          </div>
          
          <button className="checkout-btn-secondary" onClick={() => window.close()}>
            Return to merchant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page-container">
      <div className="checkout-two-column-layout">
        
        {/* Left Column: Summary */}
        <div className="checkout-summary-column">
          <div className="summary-header">
            <button className="back-link">
              <ChevronLeft size={16} /> Back
            </button>
            <div className="merchant-brand">{paymentData.merchantName}</div>
          </div>
          
          <div className="summary-amount-section">
            <div className="summary-amount-label">Pay {paymentData.merchantName}</div>
            <div className="summary-amount-value">
              <span className="summary-currency">{paymentData.currency}</span>
              {(paymentData.amount / 100).toFixed(2)}
            </div>
          </div>

          <div className="summary-items">
            <div className="summary-item-row">
              <span>Total due</span>
              <span className="font-semibold">{paymentData.currency} {(paymentData.amount / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Payment Form */}
        <div className="checkout-form-column">
          <div className="checkout-form-container">
            <h3 className="form-section-title">Payment method</h3>
            
            <div className="payment-method-tabs">
              {paymentData?.allowedPaymentMethods?.includes('CARD') && (
                <button 
                  type="button"
                  className={`method-tab ${selectedMethod === 'card' ? 'active' : ''}`}
                  onClick={() => setSelectedMethod('card')}
                >
                  <CreditCard size={18} />
                  Card
                </button>
              )}
              {paymentData?.allowedPaymentMethods?.includes('TELEBIRR') && (
                <button 
                  type="button"
                  className={`method-tab ${selectedMethod === 'telebirr' ? 'active' : ''}`}
                  onClick={() => setSelectedMethod('telebirr')}
                >
                  <Smartphone size={18} />
                  Telebirr
                </button>
              )}
            </div>

            <form onSubmit={handlePayment} className="payment-form">
              {selectedMethod === 'card' ? (
                <>
                  <div className="input-group">
                    <label>Card information</label>
                    <div className="card-input-wrapper">
                      <CreditCard size={18} className="input-icon" />
                      <input type="text" placeholder="1234 5678 9101 1121" className="checkout-input card-number-input" required />
                      <input type="text" placeholder="MM / YY" className="checkout-input card-expiry-input" required />
                      <input type="text" placeholder="CVC" className="checkout-input card-cvc-input" required />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Name on card</label>
                    <input type="text" className="checkout-input" required />
                  </div>
                </>
              ) : (
                <div className="input-group">
                  <label>Mobile Number</label>
                  <div className="phone-input-wrapper">
                    <span className="phone-prefix">+251</span>
                    <input type="tel" placeholder="911 234 567" className="checkout-input phone-input" required />
                  </div>
                  <p className="input-hint">You will receive a prompt on your phone to confirm the payment.</p>
                </div>
              )}

              <button 
                type="submit" 
                className={`checkout-submit-btn ${isProcessing ? 'processing' : ''}`}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="spinner-small"></span>
                ) : (
                  `Pay ${(paymentData.amount / 100).toFixed(2)} ${paymentData.currency}`
                )}
              </button>
            </form>

            <div className="secure-checkout-footer">
              <Lock size={12} />
              <span>Payments are secure and encrypted.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CheckoutPage;
