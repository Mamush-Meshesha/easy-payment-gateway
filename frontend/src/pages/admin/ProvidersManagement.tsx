import toast from 'react-hot-toast';
import React, { useState } from 'react';
import { Server, Zap, Edit3, X, Save } from 'lucide-react';
import '../merchant/DashboardShared.css';

import { useGetGlobalProvidersQuery, useCreateGlobalProviderMutation } from '../../services/api/settingsApi';

const ProvidersManagement: React.FC = () => {
  const { data: providers, isLoading } = useGetGlobalProvidersQuery();
  const [createProviderMutation] = useCreateGlobalProviderMutation();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);

  const [newProviderCode, setNewProviderCode] = useState('');
  const [newProviderName, setNewProviderName] = useState('');

  const handleEditClick = (provider: any) => {
    setEditingProvider(provider);
    setIsEditModalOpen(true);
  };

  const handleAddProvider = async () => {
    try {
      await createProviderMutation({ code: newProviderCode, name: newProviderName }).unwrap();
      setIsAddModalOpen(false);
      setNewProviderCode('');
      setNewProviderName('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create provider.');
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="dashboard-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="dashboard-page-title">External Providers</h1>
        <button className="dashboard-primary-btn" onClick={() => setIsAddModalOpen(true)}>
          + Add Provider
        </button>
      </div>

      <div className="dashboard-card">
        <div className="dashboard-table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Provider Name</th>
                <th>Type</th>
                <th>Health Status</th>
                <th>Success Rate (24h)</th>
                <th>Avg Latency</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {providers?.map((provider: any) => (
                <tr key={provider.id}>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                        <Server size={18} color="var(--primary)" />
                      </div>
                      {provider.name}
                    </div>
                  </td>
                  <td>API Integration</td>
                  <td>
                    <span className={`dashboard-status-badge dashboard-status-badge--${
                      provider.status === 'ACTIVE' ? 'success' : 'failed'
                    }`}>
                      {provider.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#10b981' }}>
                    100%
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>-</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="dashboard-table-action" title="Edit Configuration" onClick={() => handleEditClick(provider)}>
                        <Edit3 size={16} />
                      </button>
                      <button className="dashboard-table-action" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }} title="Disable Routing">
                        <Zap size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Provider Modal */}
      {isEditModalOpen && editingProvider && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-modal">
            <div className="dashboard-modal-header">
              <h2 className="dashboard-modal-title">Edit Provider: {editingProvider.name}</h2>
              <button className="dashboard-modal-close" onClick={() => setIsEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="dashboard-modal-body">
              <div className="dashboard-form-group">
                <label>API Base URL</label>
                <input 
                  type="text" 
                  className="dashboard-form-input" 
                  defaultValue={`https://api.${editingProvider.name.toLowerCase().replace(/[^a-z]/g, '')}.com/v1`}
                />
              </div>
            </div>
            <div className="dashboard-modal-footer">
              <button className="dashboard-btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
              <button className="dashboard-primary-btn" onClick={() => setIsEditModalOpen(false)}>
                <Save size={18} /> Save Config
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Provider Modal */}
      {isAddModalOpen && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-modal">
            <div className="dashboard-modal-header">
              <h2 className="dashboard-modal-title">Add New Provider</h2>
              <button className="dashboard-modal-close" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="dashboard-modal-body">
              <div className="dashboard-form-group">
                <label>Provider Code (e.g. MPESA)</label>
                <input 
                  type="text" 
                  className="dashboard-form-input" 
                  value={newProviderCode}
                  onChange={(e) => setNewProviderCode(e.target.value)}
                />
              </div>
              <div className="dashboard-form-group">
                <label>Display Name (e.g. M-Pesa Safaricom)</label>
                <input 
                  type="text" 
                  className="dashboard-form-input" 
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                />
              </div>
            </div>
            <div className="dashboard-modal-footer">
              <button className="dashboard-btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
              <button className="dashboard-primary-btn" onClick={handleAddProvider}>
                <Save size={18} /> Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProvidersManagement;
