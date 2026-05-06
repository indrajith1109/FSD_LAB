const maxValue = (items, key) => Math.max(...items.map((item) => Number(item[key] || 0)), 1)

const BarList = ({ title, items, labelKey, valueKey, format = (value) => value, subtextKey }) => {
  if (!items.length) {
    return (
      <article className="card">
        <h3>{title}</h3>
        <p className="status-card">No analytics data yet.</p>
      </article>
    )
  }

  const max = maxValue(items, valueKey)

  return (
    <article className="card">
      <h3>{title}</h3>
      <div className="bar-list">
        {items.map((item) => {
          const value = Number(item[valueKey] || 0)
          const width = `${Math.max((value / max) * 100, 4)}%`
          return (
            <div key={`${item[labelKey]}-${value}`} className="bar-row">
              <p>
                <span style={{display: 'flex', flexDirection: 'column'}}>
                  <span>{item[labelKey]}</span>
                  {subtextKey && item[subtextKey] !== undefined && (
                    <small style={{color: '#8b5cf6', fontSize: '0.8rem'}}>★ {item.averageRating} ({item.reviewCount} reviews)</small>
                  )}
                </span>
                <strong>{format(value)}</strong>
              </p>
              <div className="bar-track">
                <div className="bar-fill" style={{ width }} />
              </div>
            </div>
          )
        })}
      </div>
    </article>
  )
}

const AdminAnalytics = ({ data }) => {
  if (!data) return null

  return (
    <section className="analytics-grid">
      <article className="card">
        <h2>Analytics Overview</h2>
        <div className="details-list">
          <p>
            <span>Total Bookings</span>
            <strong>{data.overview.totalBookings}</strong>
          </p>
          <p>
            <span>Paid Revenue</span>
            <strong>INR {Number(data.overview.paidRevenue).toFixed(2)}</strong>
          </p>
          <p>
            <span>Refunds Issued</span>
            <strong>INR {Number(data.overview.refundsIssued).toFixed(2)}</strong>
          </p>
          <p>
            <span>Cancelled Bookings</span>
            <strong>{data.overview.cancelledBookings}</strong>
          </p>
        </div>
      </article>

      <BarList
        title="Revenue & Rating by Event"
        items={data.byEvent}
        labelKey="eventName"
        valueKey="revenue"
        subtextKey="averageRating"
        format={(value) => `INR ${Number(value).toFixed(2)}`}
      />

      <BarList
        title="Bookings by Department"
        items={data.byDepartment}
        labelKey="department"
        valueKey="bookings"
      />

      <BarList
        title="Revenue by Booking Date"
        items={data.byDate}
        labelKey="date"
        valueKey="revenue"
        format={(value) => `INR ${Number(value).toFixed(2)}`}
      />
    </section>
  )
}

export default AdminAnalytics

