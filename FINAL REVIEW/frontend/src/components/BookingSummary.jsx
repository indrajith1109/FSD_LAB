const BookingSummary = ({ summary, onDownload }) => {
  return (
    <section className="summary-card payment-success-pop">
      <h3>Booking Confirmed</h3>
      <p>
        <span>User</span>
        <strong>{summary.name}</strong>
      </p>
      <p>
        <span>Event</span>
        <strong>{summary.eventName}</strong>
      </p>
      <p>
        <span>Tickets Booked</span>
        <strong>{summary.ticketCount}</strong>
      </p>
      <p>
        <span>Total Amount</span>
        <strong>INR {Number(summary.totalAmount).toFixed(2)}</strong>
      </p>
      <button className="ghost" onClick={onDownload}>
        Download Receipt (PDF)
      </button>
    </section>
  )
}

export default BookingSummary
