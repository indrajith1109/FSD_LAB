const EventDetails = ({ event }) => {
  return (
    <article className="card">
      <h2>Event Details</h2>
      <div className="details-list">
        <p>
          <span>Event Name</span>
          <strong>{event.eventName}</strong>
        </p>
        <p>
          <span>Department</span>
          <strong>{event.departmentName}</strong>
        </p>
        <p>
          <span>Date & Time</span>
          <strong>{new Date(event.eventDateTime).toLocaleString()}</strong>
        </p>
        <p>
          <span>Venue</span>
          <strong>{event.venue}</strong>
        </p>
        <p>
          <span>Ticket Price</span>
          <strong>INR {Number(event.ticketPrice).toFixed(2)}</strong>
        </p>
      </div>

      <div className="availability-tag">
        Tickets Left: <strong>{event.availableTickets}</strong>
      </div>
    </article>
  )
}

export default EventDetails
