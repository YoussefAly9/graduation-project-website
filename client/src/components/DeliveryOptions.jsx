import { useState, useMemo } from 'react';

/**
 * DeliveryOptions Component
 * Allows users to select delivery speed, time slot, date, and add instructions
 */
function DeliveryOptions({ value, onChange, onClose }) {
  const [deliverySpeed, setDeliverySpeed] = useState(value?.speed || 'standard');
  const [selectedDate, setSelectedDate] = useState(value?.date || '');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(value?.timeSlot || '');
  const [instructions, setInstructions] = useState(value?.instructions || '');

  // Generate available dates (today + next 7 days)
  const availableDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 8; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }
    return dates;
  }, []);

  // Time slots
  const timeSlots = [
    { value: '9-12', label: '9:00 AM - 12:00 PM', express: false },
    { value: '12-15', label: '12:00 PM - 3:00 PM', express: true },
    { value: '15-18', label: '3:00 PM - 6:00 PM', express: true },
    { value: '18-21', label: '6:00 PM - 9:00 PM', express: false },
  ];

  const deliverySpeeds = [
    {
      id: 'standard',
      name: 'Standard Delivery',
      price: 0,
      duration: '2-4 hours',
      description: 'Free delivery within 2-4 hours',
      icon: '🚚'
    },
    {
      id: 'express',
      name: 'Express Delivery',
      price: 30,
      duration: '30-60 mins',
      description: 'Fast delivery in 30-60 minutes',
      icon: '⚡'
    },
    {
      id: 'scheduled',
      name: 'Scheduled Delivery',
      price: 0,
      duration: 'Pick a time',
      description: 'Choose your preferred date and time',
      icon: '📅'
    }
  ];

  const handleSave = () => {
    const deliveryOptions = {
      speed: deliverySpeed,
      date: deliverySpeed === 'scheduled' ? selectedDate : null,
      timeSlot: deliverySpeed === 'scheduled' ? selectedTimeSlot : null,
      instructions: instructions.trim(),
      fee: deliverySpeeds.find(s => s.id === deliverySpeed)?.price || 0
    };
    onChange(deliveryOptions);
    onClose();
  };

  const isValid = deliverySpeed !== 'scheduled' || (selectedDate && selectedTimeSlot);

  return (
    <div className="delivery-options-overlay" onClick={onClose}>
      <div className="delivery-options-modal" onClick={(e) => e.stopPropagation()}>
        <div className="delivery-options-header">
          <h2>Delivery Options</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="delivery-options-content">
          {/* Delivery Speed Selection */}
          <section className="delivery-section">
            <h3>Choose Delivery Speed</h3>
            <div className="delivery-speeds">
              {deliverySpeeds.map(speed => (
                <button
                  key={speed.id}
                  className={`delivery-speed-card ${deliverySpeed === speed.id ? 'selected' : ''}`}
                  onClick={() => setDeliverySpeed(speed.id)}
                >
                  <div className="speed-icon">{speed.icon}</div>
                  <div className="speed-info">
                    <div className="speed-name">{speed.name}</div>
                    <div className="speed-duration">{speed.duration}</div>
                    <div className="speed-description">{speed.description}</div>
                  </div>
                  <div className="speed-price">
                    {speed.price === 0 ? 'Free' : `+EGP ${speed.price}`}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Scheduled Delivery Options */}
          {deliverySpeed === 'scheduled' && (
            <section className="delivery-section scheduled-section">
              <h3>Select Date & Time</h3>
              
              <div className="date-selection">
                <label htmlFor="delivery-date">Delivery Date</label>
                <select
                  id="delivery-date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="delivery-select"
                >
                  <option value="">Choose a date...</option>
                  {availableDates.map(date => (
                    <option key={date.value} value={date.value}>
                      {date.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="timeslot-selection">
                <label>Time Slot</label>
                <div className="timeslots">
                  {timeSlots.map(slot => (
                    <button
                      key={slot.value}
                      className={`timeslot-button ${selectedTimeSlot === slot.value ? 'selected' : ''}`}
                      onClick={() => setSelectedTimeSlot(slot.value)}
                    >
                      <span>{slot.label}</span>
                      {slot.express && <span className="express-badge">Express Available</span>}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Delivery Instructions */}
          <section className="delivery-section">
            <h3>Delivery Instructions (Optional)</h3>
            <textarea
              className="delivery-instructions"
              placeholder="Add any special instructions for the driver...&#10;Examples:&#10;• Ring the doorbell&#10;• Leave at the door&#10;• Call when you arrive"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              maxLength={200}
            />
            <div className="char-count">{instructions.length}/200</div>
          </section>
        </div>

        <div className="delivery-options-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button 
            className="btn-save" 
            onClick={handleSave}
            disabled={!isValid}
          >
            Save Delivery Options
          </button>
        </div>
      </div>

      <style>{`
        .delivery-options-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }

        .delivery-options-modal {
          background: white;
          border-radius: 12px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .delivery-options-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .delivery-options-header h2 {
          margin: 0;
          font-size: 24px;
          color: #111;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 32px;
          color: #6b7280;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .close-button:hover {
          background: #f3f4f6;
          color: #111;
        }

        .delivery-options-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .delivery-section {
          margin-bottom: 32px;
        }

        .delivery-section:last-child {
          margin-bottom: 0;
        }

        .delivery-section h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          color: #111;
        }

        .delivery-speeds {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .delivery-speed-card {
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.2s;
          background: white;
          text-align: left;
        }

        .delivery-speed-card:hover {
          border-color: #10b981;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
        }

        .delivery-speed-card.selected {
          border-color: #10b981;
          background: #f0fdf4;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
        }

        .speed-icon {
          font-size: 32px;
          line-height: 1;
        }

        .speed-info {
          flex: 1;
        }

        .speed-name {
          font-weight: 600;
          font-size: 16px;
          color: #111;
          margin-bottom: 4px;
        }

        .speed-duration {
          font-size: 14px;
          color: #10b981;
          margin-bottom: 4px;
          font-weight: 500;
        }

        .speed-description {
          font-size: 13px;
          color: #6b7280;
        }

        .speed-price {
          font-size: 16px;
          font-weight: 600;
          color: #10b981;
        }

        .scheduled-section {
          background: #f9fafb;
          padding: 20px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
        }

        .date-selection {
          margin-bottom: 20px;
        }

        .date-selection label,
        .timeslot-selection label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #111;
          font-size: 14px;
        }

        .delivery-select {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .delivery-select:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .timeslots {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .timeslot-button {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          color: #111;
        }

        .timeslot-button:hover {
          border-color: #10b981;
          background: #f0fdf4;
        }

        .timeslot-button.selected {
          border-color: #10b981;
          background: #10b981;
          color: white;
        }

        .express-badge {
          background: #fbbf24;
          color: #78350f;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .timeslot-button.selected .express-badge {
          background: white;
          color: #10b981;
        }

        .delivery-instructions {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
          transition: all 0.2s;
        }

        .delivery-instructions:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .char-count {
          text-align: right;
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }

        .delivery-options-footer {
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn-cancel,
        .btn-save {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
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
          border-color: #d1d5db;
        }

        .btn-save {
          background: #10b981;
          border: 2px solid #10b981;
          color: white;
        }

        .btn-save:hover:not(:disabled) {
          background: #059669;
          border-color: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .btn-save:disabled {
          background: #d1d5db;
          border-color: #d1d5db;
          cursor: not-allowed;
          opacity: 0.6;
        }

        @media (max-width: 640px) {
          .delivery-options-overlay {
            padding: 0;
          }

          .delivery-options-modal {
            max-width: 100%;
            max-height: 100vh;
            border-radius: 0;
          }

          .delivery-speed-card {
            flex-direction: column;
            text-align: center;
            align-items: center;
          }

          .speed-info {
            text-align: center;
          }

          .delivery-options-footer {
            flex-direction: column;
          }

          .btn-cancel,
          .btn-save {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default DeliveryOptions;

