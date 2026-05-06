const BookingForm = ({
  events,
  selectedEventId,
  formData,
  formErrors,
  totalAmount,
  isSubmitting,
  onChange,
  onSelectEvent,
  onSubmit,
  onReset,
}) => {
  return (
    <article className="card">
      <h2>Book Tickets</h2>

      <form onSubmit={onSubmit} className="booking-form" noValidate>
        <label>
          Select Event
          <select value={selectedEventId} onChange={(event) => onSelectEvent(event.target.value)}>
            {events.map((item) => (
              <option key={item.id} value={item.id}>
                {item.eventName} ({item.availableTickets} left)
              </option>
            ))}
          </select>
        </label>

        <label>
          Name
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={(event) => onChange(event.target)}
            placeholder="Enter your full name"
          />
          {formErrors.name && <small className="error">{formErrors.name}</small>}
        </label>

        <label>
          Email
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={(event) => onChange(event.target)}
            placeholder="Enter your email"
          />
          {formErrors.email && <small className="error">{formErrors.email}</small>}
        </label>

        <label>
          Department
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={(event) => onChange(event.target)}
            placeholder="Enter your department"
          />
          {formErrors.department && (
            <small className="error">{formErrors.department}</small>
          )}
        </label>

        <label>
          Number of Tickets
          <input
            type="number"
            name="tickets"
            value={formData.tickets}
            onChange={(event) => onChange(event.target)}
            placeholder="Enter ticket count"
            min="1"
            step="1"
          />
          {formErrors.tickets && (
            <small className="error">{formErrors.tickets}</small>
          )}
        </label>

        <p className="total-preview">Total Amount: INR {totalAmount.toFixed(2)}</p>

        <div className="actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Booking...' : 'Confirm Booking'}
          </button>
          <button type="button" className="ghost" onClick={onReset}>
            Reset
          </button>
        </div>
      </form>
    </article>
  )
}

export default BookingForm
