import React, { useEffect, useState, useRef } from 'react';
import { fetchAuth } from '../../lib/fetchAuth';
import { ShieldCheck, UploadCloud, FileText, CheckCircle2, AlertCircle, Building2, Hash, Landmark, Clock, RefreshCcw, FileBadge, XCircle, ChevronRight, Lock, Globe, Mail, MapPin, TrendingUp, User, Calendar } from 'lucide-react';
import './DashboardShared.css';

interface KycDocument {
  id: string;
  documentType: string;
  s3Uri: string;
  verificationStatus: string;
  rejectionReason?: string;
  createdAt: string;
}

interface KycProfile {
  id: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  businessName?: string;
  registrationNo?: string;
  taxId?: string;
  businessType?: string;
  
  websiteUrl?: string;
  supportEmail?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  expectedVolume?: string;
  representativeName?: string;
  representativeDob?: string;

  documents: KycDocument[];
}

const KycOnboarding: React.FC = () => {
  const [profile, setProfile] = useState<KycProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  
  // Basic Details
  const [businessName, setBusinessName] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [taxId, setTaxId] = useState('');
  const [businessType, setBusinessType] = useState('SOLE_PROPRIETORSHIP');
  const [expectedVolume, setExpectedVolume] = useState('< $10,000');

  // Contact & Address
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');

  // Representative
  const [representativeName, setRepresentativeName] = useState('');
  const [representativeDob, setRepresentativeDob] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docTypeToUpload, setDocTypeToUpload] = useState('ID_CARD');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsFetching(true);
    try {
      const response = await fetchAuth('/api/v1/merchants/kyc');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        
        if (data.businessName) setBusinessName(data.businessName);
        if (data.registrationNo) setRegistrationNo(data.registrationNo);
        if (data.taxId) setTaxId(data.taxId);
        if (data.businessType) setBusinessType(data.businessType);
        if (data.expectedVolume) setExpectedVolume(data.expectedVolume);
        
        if (data.websiteUrl) setWebsiteUrl(data.websiteUrl);
        if (data.supportEmail) setSupportEmail(data.supportEmail);
        if (data.addressLine1) setAddressLine1(data.addressLine1);
        if (data.city) setCity(data.city);
        if (data.state) setState(data.state);
        if (data.postalCode) setPostalCode(data.postalCode);
        if (data.country) setCountry(data.country);

        if (data.representativeName) setRepresentativeName(data.representativeName);
        if (data.representativeDob) setRepresentativeDob(data.representativeDob);
      }
    } catch (err) {
      console.error('Failed to fetch KYC profile', err);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await fetchAuth('/api/v1/merchants/kyc/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: docTypeToUpload,
          fileName: file.name
        })
      });

      if (res.ok) {
        await fetchProfile();
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        businessName, registrationNo, taxId, businessType, expectedVolume,
        websiteUrl, supportEmail, addressLine1, city, state, postalCode, country,
        representativeName, representativeDob
      };

      const res = await fetchAuth('/api/v1/merchants/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchProfile();
      }
    } catch (err) {
      console.error('Submit failed', err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b' }}>
        <RefreshCcw size={40} className="spin" style={{ color: '#3b82f6', marginBottom: '1rem' }} />
        <p style={{ fontSize: '1.1rem', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>Loading Secure Vault...</p>
      </div>
    );
  }

  const isEditable = profile?.status === 'PENDING' || profile?.status === 'REJECTED';

  const getDocIcon = (type: string) => {
    switch(type) {
      case 'ID_CARD': return <FileBadge size={24} style={{ color: '#3b82f6' }} />;
      case 'PASSPORT': return <FileBadge size={24} style={{ color: '#8b5cf6' }} />;
      case 'UTILITY_BILL': return <Landmark size={24} style={{ color: '#10b981' }} />;
      case 'BUSINESS_REGISTRATION': return <Building2 size={24} style={{ color: '#f59e0b' }} />;
      default: return <FileText size={24} style={{ color: '#64748b' }} />;
    }
  };

  return (
    <>
      <style>{`
        .kyc-premium-container {
          padding: 2.5rem 3.5rem;
          background: #f8fafc;
          min-height: 100vh;
          font-family: 'Inter', -apple-system, sans-serif;
          animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .kyc-hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2.5rem;
        }

        .kyc-title-group h1 {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin: 0 0 0.25rem 0;
          background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
          -webkit-background-clip: text;
          color: transparent;
        }

        .kyc-title-group p {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
          font-weight: 500;
        }

        .kyc-banner {
          margin-bottom: 2.5rem;
          padding: 1rem 1.25rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 1rem;
          font-weight: 600;
          font-size: 0.875rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards 0.2s;
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }

        .kyc-banner.under_review {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          border: 1px solid #fde68a;
          color: #b45309;
        }
        
        .kyc-banner.verified {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border: 1px solid #a7f3d0;
          color: #047857;
        }

        .kyc-banner.rejected {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border: 1px solid #fecaca;
          color: #b91c1c;
        }

        .kyc-banner.pending {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
        }

        .kyc-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 2rem;
        }

        .kyc-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          margin-bottom: 1.5rem;
        }

        .kyc-card:hover {
          box-shadow: 0 15px 35px -5px rgba(0,0,0,0.08);
        }

        .kyc-card-header {
          padding: 1.5rem 1.5rem 1.25rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .kyc-card-header h2 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.25rem 0;
          letter-spacing: -0.01em;
        }

        .kyc-card-header p {
          font-size: 0.8125rem;
          color: #64748b;
          margin: 0;
        }

        .kyc-form-body {
          padding: 1.5rem;
        }

        .kyc-section-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #64748b;
          margin: 0 0 1.25rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #f1f5f9;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .kyc-input-group {
          margin-bottom: 1.25rem;
          position: relative;
        }

        .kyc-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 700;
          color: #475569;
          margin-bottom: 0.4rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .kyc-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .kyc-input-icon {
          position: absolute;
          left: 1rem;
          color: #94a3b8;
          pointer-events: none;
          transition: color 0.2s ease;
          width: 16px;
          height: 16px;
        }

        .kyc-input {
          width: 100%;
          padding: 0.65rem 1rem 0.65rem 2.5rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          font-size: 0.875rem;
          font-weight: 500;
          color: #0f172a;
          transition: all 0.2s ease;
          outline: none;
          appearance: none;
        }

        .kyc-input:focus {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .kyc-input:focus + .kyc-input-icon {
          color: #3b82f6;
        }

        .kyc-input:disabled {
          background: #f1f5f9;
          color: #64748b;
          cursor: not-allowed;
          border-color: #e2e8f0;
        }

        .kyc-submit-btn {
          width: 100%;
          padding: 0.875rem;
          border-radius: 8px;
          border: none;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .kyc-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 25px -5px rgba(37, 99, 235, 0.5);
        }

        .kyc-submit-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }

        .kyc-doc-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1.5rem 2rem;
        }

        .kyc-doc-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          transition: all 0.2s ease;
        }

        .kyc-doc-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 8px 16px -4px rgba(0,0,0,0.05);
          transform: translateY(-1px);
        }

        .kyc-doc-info {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .kyc-doc-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kyc-upload-zone {
          margin: 0 2rem 2rem;
          padding: 2.5rem;
          border: 2px dashed #cbd5e1;
          border-radius: 20px;
          background: #f8fafc;
          text-align: center;
          transition: all 0.2s ease;
          position: relative;
        }

        .kyc-upload-zone:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .kyc-file-input {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          z-index: 10;
        }
      `}</style>

      <div className="kyc-premium-container">
        
        <div className="kyc-hero">
          <div className="kyc-title-group">
            <h1>Compliance Vault</h1>
            <p>Securely verify your business identity to unlock global payments.</p>
          </div>
          <button 
            onClick={fetchProfile}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: '#ffffff', color: '#475569', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
          >
            <RefreshCcw size={16} className={isFetching ? 'spin' : ''} />
            Refresh Status
          </button>
        </div>

        {profile?.status === 'UNDER_REVIEW' && (
          <div className="kyc-banner under_review">
            <Clock size={24} />
            <div>
              <div style={{ fontSize: '1.05rem', marginBottom: '0.2rem' }}>Your profile is under review.</div>
              <div style={{ fontWeight: 500, opacity: 0.8, fontSize: '0.9rem' }}>Our compliance team is verifying your documents. This typically takes 1-2 business days.</div>
            </div>
          </div>
        )}

        {profile?.status === 'VERIFIED' && (
          <div className="kyc-banner verified">
            <CheckCircle2 size={24} />
            <div>
              <div style={{ fontSize: '1.05rem', marginBottom: '0.2rem' }}>Verification Successful</div>
              <div style={{ fontWeight: 500, opacity: 0.8, fontSize: '0.9rem' }}>Your business is fully verified. You can now generate LIVE API keys.</div>
            </div>
          </div>
        )}

        {profile?.status === 'REJECTED' && (
          <div className="kyc-banner rejected">
            <XCircle size={24} />
            <div>
              <div style={{ fontSize: '1.05rem', marginBottom: '0.2rem' }}>Verification Rejected</div>
              <div style={{ fontWeight: 500, opacity: 0.8, fontSize: '0.9rem' }}>Please check your documents and submit again.</div>
            </div>
          </div>
        )}

        {profile?.status === 'PENDING' && (
          <div className="kyc-banner pending">
            <ShieldCheck size={24} />
            <div>
              <div style={{ fontSize: '1.05rem', marginBottom: '0.2rem' }}>Action Required: Identity Verification</div>
              <div style={{ fontWeight: 500, opacity: 0.8, fontSize: '0.9rem' }}>Please complete your business profile and upload the required documents to proceed.</div>
            </div>
          </div>
        )}

        <div className="kyc-grid">
          
          {/* Form Area */}
          <div>
            <div className="kyc-card">
              <div className="kyc-card-header">
                <h2>Business Profile</h2>
                <p>Complete official registration information for compliance review.</p>
              </div>
              <form onSubmit={handleSubmitReview} className="kyc-form-body">
                
                <h3 className="kyc-section-title">1. Company Details</h3>
                <div className="kyc-input-group">
                  <label className="kyc-label">Legal Business Name</label>
                  <div className="kyc-input-wrapper">
                    <input required type="text" className="kyc-input" value={businessName} onChange={e => setBusinessName(e.target.value)} disabled={!isEditable} placeholder="e.g. Acme Corp LLC" />
                    <Building2 size={20} className="kyc-input-icon" />
                  </div>
                </div>

                <div className="kyc-input-group">
                  <label className="kyc-label">Business Structure</label>
                  <div className="kyc-input-wrapper">
                    <select className="kyc-input" value={businessType} onChange={e => setBusinessType(e.target.value)} disabled={!isEditable}>
                      <option value="SOLE_PROPRIETORSHIP">Sole Proprietorship</option>
                      <option value="LLC">Limited Liability Company (LLC)</option>
                      <option value="CORPORATION">Corporation</option>
                      <option value="NON_PROFIT">Non-Profit Organization</option>
                    </select>
                    <Landmark size={20} className="kyc-input-icon" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                  <div className="kyc-input-group" style={{ marginBottom: 0 }}>
                    <label className="kyc-label">Registration No.</label>
                    <div className="kyc-input-wrapper">
                      <input type="text" className="kyc-input" value={registrationNo} onChange={e => setRegistrationNo(e.target.value)} disabled={!isEditable} placeholder="12345678" />
                      <Hash size={20} className="kyc-input-icon" />
                    </div>
                  </div>
                  <div className="kyc-input-group" style={{ marginBottom: 0 }}>
                    <label className="kyc-label">Tax ID (TIN)</label>
                    <div className="kyc-input-wrapper">
                      <input type="text" className="kyc-input" value={taxId} onChange={e => setTaxId(e.target.value)} disabled={!isEditable} placeholder="987654321" />
                      <FileText size={20} className="kyc-input-icon" />
                    </div>
                  </div>
                </div>

                <h3 className="kyc-section-title">2. Contact & Operations</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="kyc-input-group" style={{ marginBottom: 0 }}>
                    <label className="kyc-label">Website URL</label>
                    <div className="kyc-input-wrapper">
                      <input type="url" className="kyc-input" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} disabled={!isEditable} placeholder="https://example.com" />
                      <Globe size={20} className="kyc-input-icon" />
                    </div>
                  </div>
                  <div className="kyc-input-group" style={{ marginBottom: 0 }}>
                    <label className="kyc-label">Support Email</label>
                    <div className="kyc-input-wrapper">
                      <input type="email" className="kyc-input" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} disabled={!isEditable} placeholder="support@example.com" />
                      <Mail size={20} className="kyc-input-icon" />
                    </div>
                  </div>
                </div>

                <div className="kyc-input-group">
                  <label className="kyc-label">Expected Processing Volume (Monthly)</label>
                  <div className="kyc-input-wrapper">
                    <select className="kyc-input" value={expectedVolume} onChange={e => setExpectedVolume(e.target.value)} disabled={!isEditable}>
                      <option value="< $10,000">Less than $10,000</option>
                      <option value="$10,000 - $100,000">$10,000 - $100,000</option>
                      <option value="$100,000 - $1,000,000">$100,000 - $1,000,000</option>
                      <option value="> $1,000,000">More than $1,000,000</option>
                    </select>
                    <TrendingUp size={20} className="kyc-input-icon" />
                  </div>
                </div>

                <h3 className="kyc-section-title">3. Business Address</h3>
                <div className="kyc-input-group">
                  <label className="kyc-label">Street Address</label>
                  <div className="kyc-input-wrapper">
                    <input type="text" className="kyc-input" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} disabled={!isEditable} placeholder="123 Financial District Blvd" />
                    <MapPin size={20} className="kyc-input-icon" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                  <div className="kyc-input-group" style={{ marginBottom: 0 }}>
                    <label className="kyc-label">City</label>
                    <div className="kyc-input-wrapper">
                      <input type="text" className="kyc-input" style={{ paddingLeft: '1rem' }} value={city} onChange={e => setCity(e.target.value)} disabled={!isEditable} placeholder="New York" />
                    </div>
                  </div>
                  <div className="kyc-input-group" style={{ marginBottom: 0 }}>
                    <label className="kyc-label">State / Province</label>
                    <div className="kyc-input-wrapper">
                      <input type="text" className="kyc-input" style={{ paddingLeft: '1rem' }} value={state} onChange={e => setState(e.target.value)} disabled={!isEditable} placeholder="NY" />
                    </div>
                  </div>
                  <div className="kyc-input-group" style={{ marginBottom: 0 }}>
                    <label className="kyc-label">Postal Code</label>
                    <div className="kyc-input-wrapper">
                      <input type="text" className="kyc-input" style={{ paddingLeft: '1rem' }} value={postalCode} onChange={e => setPostalCode(e.target.value)} disabled={!isEditable} placeholder="10001" />
                    </div>
                  </div>
                </div>

                <h3 className="kyc-section-title">4. Executive Representative</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="kyc-input-group" style={{ marginBottom: 0 }}>
                    <label className="kyc-label">Full Name</label>
                    <div className="kyc-input-wrapper">
                      <input type="text" className="kyc-input" value={representativeName} onChange={e => setRepresentativeName(e.target.value)} disabled={!isEditable} placeholder="Jane Doe" />
                      <User size={20} className="kyc-input-icon" />
                    </div>
                  </div>
                  <div className="kyc-input-group" style={{ marginBottom: 0 }}>
                    <label className="kyc-label">Date of Birth</label>
                    <div className="kyc-input-wrapper">
                      <input type="date" className="kyc-input" value={representativeDob} onChange={e => setRepresentativeDob(e.target.value)} disabled={!isEditable} />
                      <Calendar size={20} className="kyc-input-icon" />
                    </div>
                  </div>
                </div>

                {isEditable && (
                  <div style={{ marginTop: '3rem' }}>
                    <button 
                      type="submit" 
                      className="kyc-submit-btn"
                      disabled={!profile?.documents?.length}
                    >
                      Submit Full Profile for Review <ChevronRight size={20} />
                    </button>
                    {(!profile?.documents || profile.documents.length === 0) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.85rem', marginTop: '1rem', justifyContent: 'center', fontWeight: 500 }}>
                        <AlertCircle size={16} /> Upload at least one identity document (right panel) to enable submission.
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Documents Card (Sticky Right Panel) */}
          <div style={{ position: 'sticky', top: '2rem' }}>
            <div className="kyc-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="kyc-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2>Document Vault</h2>
                  <p>Securely encrypted storage</p>
                </div>
                <Lock size={20} style={{ color: '#94a3b8' }} />
              </div>

              <div className="kyc-doc-list">
                {(!profile?.documents || profile.documents.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                    <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                    <p style={{ fontSize: '1rem', fontWeight: 500, margin: 0 }}>No documents uploaded</p>
                  </div>
                ) : (
                  profile.documents.map(doc => (
                    <div key={doc.id} className="kyc-doc-card">
                      <div className="kyc-doc-info">
                        <div className="kyc-doc-icon-box">
                          {getDocIcon(doc.documentType)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', marginBottom: '0.2rem' }}>{doc.documentType.replace('_', ' ')}</div>
                          <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 500 }}>Uploaded {new Date(doc.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div>
                        {doc.verificationStatus === 'VERIFIED' && <span style={{ color: '#059669', background: '#d1fae5', padding: '0.4rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CheckCircle2 size={14}/> Verified</span>}
                        {doc.verificationStatus === 'PENDING' && <span style={{ color: '#d97706', background: '#fef3c7', padding: '0.4rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={14}/> Pending</span>}
                        {doc.verificationStatus === 'REJECTED' && <span style={{ color: '#dc2626', background: '#fee2e2', padding: '0.4rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}><XCircle size={14}/> Rejected</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {isEditable && (
                <div style={{ marginTop: 'auto' }}>
                  <div className="kyc-upload-zone">
                    <div style={{ background: '#ffffff', width: '72px', height: '72px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.2)' }}>
                      <UploadCloud size={36} style={{ color: '#3b82f6' }} />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Upload Document</h3>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>Drag & drop or click to browse.<br/>Supports PDF, JPG, PNG.</p>
                    
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', position: 'relative', zIndex: 20, flexWrap: 'wrap' }}>
                      <select 
                        value={docTypeToUpload} 
                        onChange={e => setDocTypeToUpload(e.target.value)} 
                        style={{ padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', fontWeight: 600, color: '#334155' }}
                      >
                        <option value="ID_CARD">National ID</option>
                        <option value="PASSPORT">Passport</option>
                        <option value="UTILITY_BILL">Utility Bill</option>
                        <option value="BUSINESS_REGISTRATION">Business Reg.</option>
                      </select>
                      
                      <button style={{ padding: '0.75rem 1.5rem', background: '#0f172a', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                        {uploading ? 'Uploading...' : 'Browse Files'}
                      </button>
                    </div>
                    
                    <input 
                      type="file" 
                      className="kyc-file-input"
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      disabled={uploading}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default KycOnboarding;
