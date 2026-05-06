const BookingForm = ({
  event,
  events,
  selectedEventId,
  filters,
  formData,
  formErrors,
  totalAmount,
  isSubmitting,
  takenSeats,
  selectedSeats,
  onFilterChange,
  onChange,
  onSelectEvent,
  onToggleSeat,
  onSubmit,
  onWaitlist,
  onReset,
}) => {
  const seatRows = ['A', 'B', 'C', 'D', 'E']
  const seatCols = [1, 2, 3, 4, 5, 6, 7, 8]
  const selectedEvent = events.find((item) => String(item.id) === String(selectedEventId))

  const renderSeat = (row, col) => {
    const code = `${row}${col}`
    const isTaken = takenSeats.includes(code)
    const isSelected = selectedSeats.includes(code)
    return (
      <button
        key={code}
        type="button"
        className={`seat-chip ${isTaken ? 'seat-chip-taken' : isSelected ? 'seat-chip-selected' : ''}`}
        disabled={isTaken || isSubmitting}
        onClick={() => onToggleSeat(code)}
      >
        {code}
      </button>
    )
  }

  return (
    <article className="card">
      <h2>Book Tickets</h2>
      <div className="booking-form">
        <label>
          Search
          <input
            type="text"
            value={filters.search}
            placeholder="Event, venue or department"
            onChange={(eventObject) => onFilterChange('search', eventObject.target.value)}
          />
        </label>
        <label>
          Category
          <select
            value={filters.category}
            onChange={(eventObject) => onFilterChange('category', eventObject.target.value)}
          >
            <option value="">All Categories</option>
            {[...new Set(events.map((item) => item.eventCategory || 'General'))].map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          Min Price
          <input
            type="number"
            min="0"
            value={filters.minPrice}
            onChange={(eventObject) => onFilterChange('minPrice', eventObject.target.value)}
          />
        </label>
        <label>
          Max Price
          <input
            type="number"
            min="0"
            value={filters.maxPrice}
            onChange={(eventObject) => onFilterChange('maxPrice', eventObject.target.value)}
          />
        </label>
      </div>

      <form onSubmit={onSubmit} className="booking-form" noValidate>
        <label>
          Select Event
          <select value={selectedEventId} onChange={(event) => onSelectEvent(event.target.value)}>
            {events.map((item) => (
              <option key={item.id} value={item.id}>
                {item.eventName} ({item.availableTickets} left) - {item.eventCategory || 'General'}
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
        {selectedEvent?.availableTickets > 0 && (
          <div>
            <p className="table-note">Select seats ({selectedSeats.length}/{Number(formData.tickets || 0) || 0})</p>
            <div className="seat-grid">
              {seatRows.map((row) => (
                <div key={row} className="seat-row">
                  {seatCols.map((col) => renderSeat(row, col))}
                </div>
              ))}
            </div>
            {event?.totalSeats > 40 && (
              <small className="table-note">
                Showing quick-pick seats. Backend validates exact seat availability.
              </small>
            )}
            {formErrors.selectedSeats && <small className="error">{formErrors.selectedSeats}</small>}
          </div>
        )}

        <div className="actions">
          {selectedEvent?.availableTickets === 0 ? (
            <button type="button" disabled={isSubmitting} onClick={onWaitlist}>
              {isSubmitting ? 'Joining...' : 'Join Waitlist'}
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Booking...' : 'Confirm Booking'}
            </button>
          )}
          <button type="button" className="ghost" onClick={onReset}>
            Reset
          </button>
        </div>
      </form>
    </article>
  )
}

export default BookingForm
