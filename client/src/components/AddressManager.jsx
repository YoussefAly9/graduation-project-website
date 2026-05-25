import { useState } from 'react';

/**
 * AddressManager Component
 * Manage multiple delivery addresses with add/edit/delete/select functionality
 */
function AddressManager({ addresses = [], selectedAddressId, onAddressSelect, onAddressesUpdate, onClose }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    label: '',
    fullName: '',
    phone: '',
    street: '',
    building: '',
    floor: '',
    apartment: '',
    area: '',
    city: '',
    notes: ''
  });

  const cities = [
    'Cairo', 'Giza', 'Alexandria', 'Shubra El-Kheima', 'Port Said',
    'Suez', 'Luxor', 'Mansoura', 'El-Mahalla El-Kubra', 'Tanta',
    'Asyut', 'Ismailia', 'Fayyum', 'Zagazig', 'Aswan'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      label: '',
      fullName: '',
      phone: '',
      street: '',
      building: '',
      floor: '',
      apartment: '',
      area: '',
      city: '',
      notes: ''
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAddNew = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleEdit = (address) => {
    setFormData(address);
    setEditingId(address.id);
    setIsAdding(false);
  };

  const handleSave = () => {
    if (!formData.fullName || !formData.phone || !formData.street || !formData.city) {
      alert('Please fill in all required fields');
      return;
    }

    const newAddress = {
      ...formData,
      id: editingId || Date.now().toString()
    };

    let updatedAddresses;
    if (editingId) {
      updatedAddresses = addresses.map(addr => 
        addr.id === editingId ? newAddress : addr
      );
    } else {
      updatedAddresses = [...addresses, newAddress];
    }

    onAddressesUpdate(updatedAddresses);
    
    // Auto-select newly added/edited address
    onAddressSelect(newAddress.id);
    
    resetForm();
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this address?')) {
      const updatedAddresses = addresses.filter(addr => addr.id !== id);
      onAddressesUpdate(updatedAddresses);
      
      if (selectedAddressId === id && updatedAddresses.length > 0) {
        onAddressSelect(updatedAddresses[0].id);
      }
    }
  };

  const isFormVisible = isAdding || editingId;

  return (
    <div className="address-manager-overlay" onClick={onClose}>
      <div className="address-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="address-manager-header">
          <h2>Delivery Addresses</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="address-manager-content">
          {/* Address List */}
          {!isFormVisible && (
            <div className="address-list">
              {addresses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📍</div>
                  <p>No saved addresses</p>
                  <button className="btn-add-first" onClick={handleAddNew}>
                    Add Your First Address
                  </button>
                </div>
              ) : (
                <>
                  {addresses.map(address => (
                    <div 
                      key={address.id}
                      className={`address-card ${selectedAddressId === address.id ? 'selected' : ''}`}
                    >
                      <div className="address-radio">
                        <input
                          type="radio"
                          name="selectedAddress"
                          checked={selectedAddressId === address.id}
                          onChange={() => onAddressSelect(address.id)}
                        />
                      </div>
                      <div className="address-details" onClick={() => onAddressSelect(address.id)}>
                        <div className="address-label">{address.label || 'Home'}</div>
                        <div className="address-name">{address.fullName}</div>
                        <div className="address-text">
                          {address.street}, Building {address.building}
                          {address.floor && `, Floor ${address.floor}`}
                          {address.apartment && `, Apt ${address.apartment}`}
                        </div>
                        <div className="address-text">{address.area}, {address.city}</div>
                        <div className="address-phone">{address.phone}</div>
                        {address.notes && <div className="address-notes">Note: {address.notes}</div>}
                      </div>
                      <div className="address-actions">
                        <button 
                          className="btn-icon"
                          onClick={() => handleEdit(address)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-icon"
                          onClick={() => handleDelete(address.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                  <button className="btn-add-new" onClick={handleAddNew}>
                    + Add New Address
                  </button>
                </>
              )}
            </div>
          )}

          {/* Add/Edit Form */}
          {isFormVisible && (
            <div className="address-form">
              <h3>{editingId ? 'Edit Address' : 'Add New Address'}</h3>
              
              <div className="form-group">
                <label htmlFor="label">Address Label (e.g., Home, Work)</label>
                <input
                  type="text"
                  id="label"
                  name="label"
                  value={formData.label}
                  onChange={handleInputChange}
                  placeholder="Home"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+20 1XX XXX XXXX"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="street">Street Address *</label>
                <input
                  type="text"
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  placeholder="123 Main Street"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="building">Building *</label>
                  <input
                    type="text"
                    id="building"
                    name="building"
                    value={formData.building}
                    onChange={handleInputChange}
                    placeholder="Building 5"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="floor">Floor</label>
                  <input
                    type="text"
                    id="floor"
                    name="floor"
                    value={formData.floor}
                    onChange={handleInputChange}
                    placeholder="3rd"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="apartment">Apartment</label>
                  <input
                    type="text"
                    id="apartment"
                    name="apartment"
                    value={formData.apartment}
                    onChange={handleInputChange}
                    placeholder="12"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="area">Area</label>
                  <input
                    type="text"
                    id="area"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    placeholder="Maadi"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="city">City *</label>
                  <select
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a city...</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Delivery Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Landmarks, gate codes, or special instructions..."
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button className="btn-cancel" onClick={resetForm}>Cancel</button>
                <button className="btn-save" onClick={handleSave}>
                  {editingId ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </div>
          )}
        </div>

        {!isFormVisible && addresses.length > 0 && (
          <div className="address-manager-footer">
            <button className="btn-done" onClick={onClose}>Done</button>
          </div>
        )}
      </div>

      <style>{`
        .address-manager-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10001;
          padding: 20px;
        }

        .address-manager-modal {
          background: white;
          border-radius: 12px;
          max-width: 700px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .address-manager-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .address-manager-header h2 {
          margin: 0;
          font-size: 24px;
          color: #111;
        }

        .address-manager-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }

        .empty-state p {
          color: #6b7280;
          margin-bottom: 24px;
        }

        .btn-add-first {
          background: #10b981;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add-first:hover {
          background: #059669;
          transform: translateY(-1px);
        }

        .address-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .address-card {
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          padding: 16px;
          display: flex;
          gap: 12px;
          transition: all 0.2s;
        }

        .address-card:hover {
          border-color: #10b981;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
        }

        .address-card.selected {
          border-color: #10b981;
          background: #f0fdf4;
        }

        .address-radio {
          padding-top: 2px;
        }

        .address-radio input[type="radio"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .address-details {
          flex: 1;
          cursor: pointer;
        }

        .address-label {
          font-weight: 700;
          font-size: 16px;
          color: #111;
          margin-bottom: 4px;
        }

        .address-name {
          font-weight: 600;
          color: #374151;
          margin-bottom: 4px;
        }

        .address-text {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 2px;
        }

        .address-phone {
          font-size: 14px;
          color: #10b981;
          font-weight: 500;
          margin-top: 4px;
        }

        .address-notes {
          font-size: 13px;
          color: #9ca3af;
          margin-top: 6px;
          font-style: italic;
        }

        .address-actions {
          display: flex;
          gap: 4px;
        }

        .btn-icon {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .btn-icon:hover {
          background: #f3f4f6;
        }

        .btn-add-new {
          width: 100%;
          padding: 14px;
          border: 2px dashed #d1d5db;
          background: white;
          border-radius: 10px;
          color: #10b981;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add-new:hover {
          border-color: #10b981;
          background: #f0fdf4;
        }

        .address-form h3 {
          margin: 0 0 24px 0;
          font-size: 20px;
          color: #111;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-weight: 600;
          font-size: 14px;
          color: #374151;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 10px 14px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-family: inherit;
          font-size: 14px;
          transition: all 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .form-group textarea {
          resize: vertical;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
          justify-content: flex-end;
        }

        .btn-cancel,
        .btn-save {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel {
          background: white;
          border: 2px solid #e5e7eb;
          color: #6b7280;
        }

        .btn-cancel:hover {
          background: #f3f4f6;
        }

        .btn-save {
          background: #10b981;
          border: 2px solid #10b981;
          color: white;
        }

        .btn-save:hover {
          background: #059669;
          transform: translateY(-1px);
        }

        .address-manager-footer {
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
        }

        .btn-done {
          width: 100%;
          padding: 12px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-done:hover {
          background: #059669;
        }

        @media (max-width: 640px) {
          .address-manager-overlay {
            padding: 0;
          }

          .address-manager-modal {
            max-width: 100%;
            max-height: 100vh;
            border-radius: 0;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .address-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default AddressManager;

