import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import { useGetPreferencesQuery, useUpdatePreferencesMutation } from '../../../services/api/settingsApi';
import './PreferencesTab.css';

const PreferencesTab: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const merchantId = user?.merchantId || '';

  const { data: prefs, isLoading } = useGetPreferencesQuery(merchantId, { skip: !merchantId });
  const [updatePrefs, { isLoading: isUpdating }] = useUpdatePreferencesMutation();

  const [formData, setFormData] = useState({
    defaultCurrency: 'ETB',
    callbackUrl: '',
    returnUrl: '',
    refundWebhookUrl: '',
    retryPaymentInterval: 60,
    redirectTimeout: 0,
    dashboardTheme: 'CLASSIC',
    transactionFeePayer: 'MERCHANT',
    transferFeePayer: 'MERCHANT',
    emailImportantNotifs: true,
    emailCustomerReceipts: false,
    transactionReceiptToMe: true,
    financeEmail: '',
    transferApprovalMethod: 'OTP',
    approvalUrl: '',
    approvalSecret: ''
  });

  useEffect(() => {
    if (prefs) {
      setFormData({
        defaultCurrency: prefs.defaultCurrency || 'ETB',
        callbackUrl: prefs.callbackUrl || '',
        returnUrl: prefs.returnUrl || '',
        refundWebhookUrl: prefs.refundWebhookUrl || '',
        retryPaymentInterval: prefs.retryPaymentInterval ?? 60,
        redirectTimeout: prefs.redirectTimeout ?? 0,
        dashboardTheme: prefs.dashboardTheme || 'CLASSIC',
        transactionFeePayer: prefs.transactionFeePayer || 'MERCHANT',
        transferFeePayer: prefs.transferFeePayer || 'MERCHANT',
        emailImportantNotifs: prefs.emailImportantNotifs ?? true,
        emailCustomerReceipts: prefs.emailCustomerReceipts ?? false,
        transactionReceiptToMe: prefs.transactionReceiptToMe ?? true,
        financeEmail: prefs.financeEmail || '',
        transferApprovalMethod: prefs.transferApprovalMethod || 'OTP',
        approvalUrl: prefs.approvalUrl || '',
        approvalSecret: prefs.approvalSecret || ''
      });
    }
  }, [prefs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      await updatePrefs({
        merchantId,
        data: {
          ...formData,
          retryPaymentInterval: Number(formData.retryPaymentInterval),
          redirectTimeout: Number(formData.redirectTimeout)
        }
      }).unwrap();
      toast.success('Preferences saved successfully!');
    } catch (err) {
      console.error('Failed to save preferences', err);
      toast.error('Failed to save preferences.');
    }
  };

  if (isLoading) return <div style={{ padding: '2rem' }}>Loading preferences...</div>;

  return (
    <div className="preferences-tab">
      <h2 className="section-title">Preference</h2>
      
      <div className="pref-grid">
        <div className="pref-item">
          <label>Default Currency:</label>
          <select name="defaultCurrency" value={formData.defaultCurrency} onChange={handleChange}>
            <option value="ETB">ETB</option>
            <option value="USD">USD</option>
          </select>
        </div>

        <div className="pref-item">
          <label>Callback URL:</label>
          <input type="text" name="callbackUrl" value={formData.callbackUrl} onChange={handleChange} placeholder="https://yourdomain.com/callback" />
        </div>

        <div className="pref-item">
          <label>Return URL:</label>
          <input type="text" name="returnUrl" value={formData.returnUrl} onChange={handleChange} placeholder="https://yourdomain.com/success" />
        </div>

        <div className="pref-item">
          <label>Refund Webhook:</label>
          <input type="text" name="refundWebhookUrl" value={formData.refundWebhookUrl} onChange={handleChange} placeholder="Enter refund webhook URL" />
        </div>
      </div>

      <div className="divider" />
      
      <h2 className="section-title">Customize Receipts</h2>
      
      <div className="pref-grid">
        <div className="pref-item">
          <label>Who should pay the transaction fees?</label>
          <select name="transactionFeePayer" value={formData.transactionFeePayer} onChange={handleChange}>
            <option value="MERCHANT">Charge me for the transaction fees</option>
            <option value="CUSTOMER">Charge customer for the transaction fees</option>
          </select>
        </div>

        <div className="pref-item">
          <label>Who should pay the transfer fees?</label>
          <select name="transferFeePayer" value={formData.transferFeePayer} onChange={handleChange}>
            <option value="MERCHANT">Charge me for the transfer fees</option>
            <option value="CUSTOMER">Charge customer for the transfer fees</option>
          </select>
        </div>

        <div className="pref-item">
          <label>Allow to retry payment? (Interval in mins)</label>
          <input type="number" name="retryPaymentInterval" value={formData.retryPaymentInterval} onChange={handleChange} />
          <small>By default, it is set to 60 minutes.</small>
        </div>

        <div className="pref-item">
          <label>Set time out before redirecting to the return URL (Seconds)</label>
          <input type="number" name="redirectTimeout" value={formData.redirectTimeout} onChange={handleChange} />
        </div>
      </div>

      <div className="divider" />

      <h2 className="section-title">Customize Dashboard</h2>
      <div className="pref-grid">
        <div className="pref-item">
          <label>Theme Options * Choose only one</label>
          <div className="radio-group">
            <label><input type="radio" name="dashboardTheme" value="CLASSIC" checked={formData.dashboardTheme === 'CLASSIC'} onChange={handleChange} /> Classic</label>
            <label><input type="radio" name="dashboardTheme" value="ADAPTIVE" checked={formData.dashboardTheme === 'ADAPTIVE'} onChange={handleChange} /> Adaptive</label>
            <label><input type="radio" name="dashboardTheme" value="ADVANCED" checked={formData.dashboardTheme === 'ADVANCED'} onChange={handleChange} /> Advanced</label>
          </div>
        </div>
      </div>

      <div className="divider" />

      <h2 className="section-title">Notification Emails</h2>
      <div className="pref-grid">
        <div className="pref-item checkbox">
          <label>
            <input type="checkbox" name="emailImportantNotifs" checked={formData.emailImportantNotifs} onChange={handleChange} />
            Email me for important notifications
          </label>
        </div>

        <div className="pref-item checkbox">
          <label>
            <input type="checkbox" name="emailCustomerReceipts" checked={formData.emailCustomerReceipts} onChange={handleChange} />
            Email payment receipts for customers
          </label>
        </div>

        <div className="pref-item checkbox">
          <label>
            <input type="checkbox" name="transactionReceiptToMe" checked={formData.transactionReceiptToMe} onChange={handleChange} />
            Transaction receipts: Send to me
          </label>
        </div>

        <div className="pref-item">
          <label>Finance email :</label>
          <input type="email" name="financeEmail" value={formData.financeEmail} onChange={handleChange} placeholder="Enter finance Email" />
        </div>
      </div>

      <div className="divider" />

      <h2 className="section-title">Transfer Approval</h2>
      <div className="pref-grid">
        <div className="pref-item">
          <label>Transfer Approval Method:</label>
          <div className="radio-group vertical">
            <label>
              <input type="radio" name="transferApprovalMethod" value="URL" checked={formData.transferApprovalMethod === 'URL'} onChange={handleChange} /> 
              Approve transfers using URL verification
            </label>
            <label>
              <input type="radio" name="transferApprovalMethod" value="OTP" checked={formData.transferApprovalMethod === 'OTP'} onChange={handleChange} /> 
              Approve transfers using email OTP verification
            </label>
          </div>
        </div>

        {formData.transferApprovalMethod === 'URL' && (
          <>
            <div className="pref-item">
              <label>Transfer Approval URL :</label>
              <input type="text" name="approvalUrl" value={formData.approvalUrl} onChange={handleChange} placeholder="Enter Approval URL" />
            </div>
            <div className="pref-item">
              <label>Enter Approval Secret :</label>
              <input type="password" name="approvalSecret" value={formData.approvalSecret} onChange={handleChange} placeholder="Enter Approval Secret" />
            </div>
          </>
        )}
      </div>

      <div className="actions" style={{ marginTop: '3rem' }}>
        <button 
          className="btn-save"
          onClick={handleSave} 
          disabled={isUpdating}
        >
          {isUpdating ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};

export default PreferencesTab;
