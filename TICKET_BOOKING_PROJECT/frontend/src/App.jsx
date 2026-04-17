import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import {
  cancelBooking,
  createBooking,
  createEvent,
  downloadReceipt,
  getAdminAnalytics,
  getBookings,
  getEventDetails,
  getEvents,
  getPublicEvents,
  loginAdmin,
  loginUser,
  registerUser,
  updateEvent,
} from './api'
import EventDetails from './components/EventDetails'
import BookingForm from './components/BookingForm'
import BookingSummary from './components/BookingSummary'
import PaymentPage from './components/PaymentPage'
import LoadingSkeleton from './components/LoadingSkeleton'
import Toast from './components/Toast'
import AdminAnalytics from './components/AdminAnalytics'

function AuthNavbar() {
  return (
    <nav className="auth-navbar">
      <div className="auth-brand">EventHub</div>
      <div className="auth-nav-links">
        <Link to="/login/user">User Login</Link>
        <Link to="/login/admin">Admin Login</Link>
        <Link to="/register">Register</Link>
      </div>
    </nav>
  )
}

function LoginPage({ role, loginData, onLoginChange, onSubmit, loginError, bootLoading }) {
  return (
    <main className="auth-page">
      <AuthNavbar />
      <section className="login-shell">
        <article className="login-card">
          <h1>{role === 'admin' ? 'Admin Access' : 'User Access'}</h1>
          <p>
            {role === 'admin'
              ? 'Sign in as admin to manage events and view all bookings.'
              : 'Sign in as user to book tickets and download receipts.'}
          </p>
          <form onSubmit={onSubmit} className="login-form">
            <label>
              Email
              <input
                type="email"
                value={loginData.email}
                onChange={onLoginChange('email')}
                placeholder={role === 'admin' ? 'admin@college.edu' : 'student@college.edu'}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginData.password}
                onChange={onLoginChange('password')}
                placeholder="Enter password"
              />
            </label>
            {loginError && <small className="error">{loginError}</small>}
            <button type="submit" disabled={bootLoading}>
              {bootLoading ? 'Signing in...' : role === 'admin' ? 'Login as Admin' : 'Login as User'}
            </button>
          </form>
        </article>
      </section>
    </main>
  )
}

function RegisterPage({ registerData, onRegisterChange, onSubmit, loginError, bootLoading }) {
  return (
    <main className="auth-page">
      <AuthNavbar />
      <section className="login-shell">
        <article className="login-card">
          <h1>Create Account</h1>
          <p>Register a new user account to access ticket booking.</p>
          <form onSubmit={onSubmit} className="login-form">
            <label>
              Full Name
              <input type="text" value={registerData.fullName} onChange={onRegisterChange('fullName')} placeholder="Your name" />
            </label>
            <label>
              Email
              <input type="email" value={registerData.email} onChange={onRegisterChange('email')} placeholder="you@example.com" />
            </label>
            <label>
              Department
              <input type="text" value={registerData.department} onChange={onRegisterChange('department')} placeholder="CSE / ECE / MECH" />
            </label>
            <label>
              Password
              <input type="password" value={registerData.password} onChange={onRegisterChange('password')} placeholder="Minimum 6 characters" />
            </label>
            {loginError && <small className="error">{loginError}</small>}
            <button type="submit" disabled={bootLoading}>{bootLoading ? 'Creating account...' : 'Create Account'}</button>
          </form>
        </article>
      </section>
    </main>
  )
}

function App() {
  const navigate = useNavigate()
  const toastTimerRef = useRef(null)
  const [auth, setAuth] = useState({ token: '', user: null })
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [registerData, setRegisterData] = useState({ fullName: '', email: '', department: '', password: '' })
  const [activeTab, setActiveTab] = useState('booking')
  const [event, setEvent] = useState(null)
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [bookings, setBookings] = useState([])
  const [formData, setFormData] = useState({ name: '', email: '', department: '', tickets: '' })
  const [formErrors, setFormErrors] = useState({})
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bootLoading, setBootLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const [toast, setToast] = useState(null)
  const [isHistoryBusy, setIsHistoryBusy] = useState(false)
  const [analytics, setAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [bookingDraft, setBookingDraft] = useState(() => {
    const raw = localStorage.getItem('ticket_booking_draft')
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  })
  const [eventForm, setEventForm] = useState({ id: '', eventName: '', departmentName: '', eventDateTime: '', venue: '', ticketPrice: '', availableTickets: '' })

  const totalAmount = useMemo(() => (!event || !Number(formData.tickets) ? 0 : Number(formData.tickets) * Number(event.ticketPrice)), [event, formData.tickets])
  const stats = useMemo(() => [
    { label: 'Available Tickets', value: event?.availableTickets ?? '--' },
    { label: 'Total Bookings', value: bookings.length },
    { label: 'Revenue', value: `INR ${bookings.reduce((sum, item) => sum + (item.status === 'paid' ? Number(item.total_amount || 0) : 0), 0).toFixed(2)}` },
  ], [bookings, event])

  useEffect(() => {
    const token = localStorage.getItem('ticket_token')
    const user = localStorage.getItem('ticket_user')
    if (token && user) setAuth({ token, user: JSON.parse(user) })
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!auth.token) return
    const raw = localStorage.getItem('ticket_booking_draft')
    if (!raw) return
    try {
      setBookingDraft(JSON.parse(raw))
    } catch {
      // If stored draft is corrupted, ignore it.
    }
  }, [auth.token])

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)
        setEvent(await getEventDetails())
      } catch (error) {
        setApiError(error.message || 'Failed to load event details.')
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
  }, [auth.token])

  useEffect(() => {
    if (!auth.token) return
    const loadData = async () => {
      try {
        setIsHistoryBusy(true)
        const bookingData = await getBookings(auth.token)
        setBookings(bookingData)
        const publicEvents = await getPublicEvents(auth.token)
        setEvents(publicEvents)
        setSelectedEventId((previous) => previous || String(publicEvents[0]?.id || ''))
        if (auth.user.role !== 'admin') {
          setAnalytics(null)
        }
        if (auth.user.role === 'admin') {
          const eventData = await getEvents(auth.token)
          setEvents(eventData.map((item) => ({
            id: item.id,
            eventName: item.event_name,
            departmentName: item.department_name,
            eventDateTime: item.event_date_time,
            venue: item.venue,
            ticketPrice: Number(item.ticket_price),
            availableTickets: item.available_tickets,
          })))
          setAnalyticsLoading(true)
          const analyticsData = await getAdminAnalytics(auth.token)
          setAnalytics(analyticsData)
        }
      } catch (error) {
        setApiError(error.message)
      } finally {
        setIsHistoryBusy(false)
        setAnalyticsLoading(false)
      }
    }
    loadData()
  }, [auth.token, auth.user?.role])

  useEffect(() => {
    if (!events.length || !selectedEventId) return
    const selected = events.find((item) => String(item.id) === String(selectedEventId))
    if (selected) setEvent(selected)
  }, [events, selectedEventId])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
    }
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3200)
  }

  const isAdmin = auth.user?.role === 'admin'
  const isUser = auth.user?.role === 'user'

  const validate = () => {
    const errors = {}
    const trimmedName = formData.name.trim()
    const trimmedEmail = formData.email.trim()
    const trimmedDepartment = formData.department.trim()
    const tickets = Number(formData.tickets)
    if (!trimmedName) errors.name = 'Name is required.'
    if (!trimmedEmail) errors.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) errors.email = 'Enter a valid email format.'
    if (!trimmedDepartment) errors.department = 'Department is required.'
    if (!formData.tickets) errors.tickets = 'Number of tickets is required.'
    else if (!Number.isInteger(tickets) || tickets <= 0) errors.tickets = 'Number of tickets must be a positive integer.'
    else if (event && tickets > event.availableTickets) errors.tickets = `Only ${event.availableTickets} tickets are currently available.`
    return errors
  }

  const handleChange = (target) => {
    const { name, value } = target
    setFormData((previous) => ({ ...previous, [name]: value }))
    setFormErrors((previous) => ({ ...previous, [name]: '' }))
    setApiError('')
  }

  const handleReset = () => {
    setFormData({ name: '', email: '', department: '', tickets: '' })
    setFormErrors({})
    setApiError('')
  }

  const loginByRole = async (role, eventObject) => {
    eventObject.preventDefault()
    setLoginError('')
    try {
      setBootLoading(true)
      const response = role === 'admin' ? await loginAdmin(loginData) : await loginUser(loginData)
      setAuth(response)
      setActiveTab(response.user.role === 'admin' ? 'analytics' : 'booking')
      localStorage.setItem('ticket_token', response.token)
      localStorage.setItem('ticket_user', JSON.stringify(response.user))
      setFormData((previous) => ({ ...previous, name: response.user.fullName, email: response.user.email, department: response.user.department }))
      showToast(`Welcome ${response.user.fullName}!`, 'success')
    } catch (error) {
      setLoginError(error.message)
    } finally {
      setBootLoading(false)
    }
  }

  const handleRegister = async (eventObject) => {
    eventObject.preventDefault()
    setLoginError('')
    try {
      setBootLoading(true)
      const response = await registerUser(registerData)
      setAuth(response)
      setActiveTab('booking')
      localStorage.setItem('ticket_token', response.token)
      localStorage.setItem('ticket_user', JSON.stringify(response.user))
      setFormData((previous) => ({ ...previous, name: response.user.fullName, email: response.user.email, department: response.user.department }))
      showToast('Account created successfully.', 'success')
    } catch (error) {
      setLoginError(error.message)
    } finally {
      setBootLoading(false)
    }
  }

  const handleLogout = () => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
    }
    setAuth({ token: '', user: null })
    localStorage.removeItem('ticket_token')
    localStorage.removeItem('ticket_user')
    localStorage.removeItem('ticket_booking_draft')
    setLoginData({ email: '', password: '' })
    setLoginError('')
    setRegisterData({ fullName: '', email: '', department: '', password: '' })
    setFormData({ name: '', email: '', department: '', tickets: '' })
    setFormErrors({})
    setApiError('')
    setBookings([])
    setEvents([])
    setSummary(null)
    setBookingDraft(null)
    setAnalytics(null)
    setToast(null)
    setActiveTab('booking')
  }

  const handleEventSave = async (eventObject) => {
    eventObject.preventDefault()
    const payload = {
      eventName: eventForm.eventName,
      departmentName: eventForm.departmentName,
      eventDateTime: eventForm.eventDateTime,
      venue: eventForm.venue,
      ticketPrice: Number(eventForm.ticketPrice),
      availableTickets: Number(eventForm.availableTickets),
    }
    try {
      if (eventForm.id) await updateEvent(auth.token, eventForm.id, payload)
      else await createEvent(auth.token, payload)
      setEvent(await getEventDetails())
      setEvents(await getEvents(auth.token))
      setEventForm({ id: '', eventName: '', departmentName: '', eventDateTime: '', venue: '', ticketPrice: '', availableTickets: '' })
    } catch (error) {
      setApiError(error.message)
    }
  }

  const handleSubmit = async (eventObject) => {
    eventObject.preventDefault()
    const errors = validate()
    setFormErrors(errors)
    if (Object.keys(errors).length > 0 || !event) return
    setIsSubmitting(true)
    setApiError('')
    try {
      const eventId = Number(selectedEventId)
      const payloadDraft = {
        eventId,
        eventName: event.eventName,
        ticketPrice: Number(event.ticketPrice),
        ticketCount: Number(formData.tickets),
        name: formData.name.trim(),
        email: formData.email.trim(),
        department: formData.department.trim(),
        totalAmount: Number(totalAmount),
      }

      setBookingDraft(payloadDraft)
      localStorage.setItem('ticket_booking_draft', JSON.stringify(payloadDraft))
      navigate('/payment')
    } catch (error) {
      setApiError(error.message || 'Unable to continue to payment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompletePayment = async () => {
    if (!bookingDraft) {
      throw new Error('Booking draft missing. Please go back and confirm booking again.')
    }
    if (!event) {
      throw new Error('Event details unavailable. Please try again.')
    }

    setApiError('')
    setIsSubmitting(true)
    try {
      const payload = {
        eventId: bookingDraft.eventId,
        name: bookingDraft.name,
        email: bookingDraft.email,
        department: bookingDraft.department,
        ticketCount: bookingDraft.ticketCount,
      }

      const response = await createBooking({ token: auth.token, body: payload })

      setEvent((previous) => ({ ...previous, availableTickets: response.availableTickets }))
      setBookings(await getBookings(auth.token))
      setSummary({
        bookingId: response.bookingId,
        bookingCode: response.bookingCode,
        name: payload.name,
        eventName: response.eventName,
        ticketCount: payload.ticketCount,
        totalAmount: response.totalAmount,
      })
      showToast('Payment successful. Booking confirmed.', 'success')

      handleReset()
      localStorage.removeItem('ticket_booking_draft')
      setBookingDraft(null)
      navigate('/')
    } catch (error) {
      setApiError(error.message || 'Payment succeeded but booking confirmation failed.')
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelBooking = async (booking) => {
    const reason = window.prompt('Cancellation reason (optional):', 'Change of plans')
    if (reason === null) return
    try {
      setIsHistoryBusy(true)
      await cancelBooking(booking.id, auth.token, reason)
      const updatedBookings = await getBookings(auth.token)
      setBookings(updatedBookings)
      const publicEvents = await getPublicEvents(auth.token)
      setEvents(publicEvents)
      const selected = publicEvents.find((item) => String(item.id) === String(selectedEventId))
      if (selected) {
        setEvent(selected)
      }
      if (isAdmin) {
        const analyticsData = await getAdminAnalytics(auth.token)
        setAnalytics(analyticsData)
      }
      showToast('Booking cancelled. Refund has been marked.', 'success')
    } catch (error) {
      setApiError(error.message || 'Unable to cancel booking.')
      showToast(error.message || 'Unable to cancel booking.', 'error')
    } finally {
      setIsHistoryBusy(false)
    }
  }

  const onLoginChange = (field) => (eventObject) => setLoginData((previous) => ({ ...previous, [field]: eventObject.target.value }))
  const onRegisterChange = (field) => (eventObject) => setRegisterData((previous) => ({ ...previous, [field]: eventObject.target.value }))

  const dashboard = (
    <main className="app-shell">
      <nav className="navbar">
        <div className="nav-brand">EventHub</div>
        <div className="nav-actions">
          {isUser && <button className="ghost" onClick={() => setActiveTab('booking')}>Booking</button>}
          <button className="ghost" onClick={() => setActiveTab('history')}>Booking History</button>
          {isAdmin && <button className="ghost" onClick={() => setActiveTab('analytics')}>Analytics</button>}
          {isAdmin && <button className="ghost" onClick={() => setActiveTab('admin')}>Admin</button>}
          <button className="ghost" onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      <header className="hero-panel">
        <p className="eyebrow">Welcome, {auth.user?.fullName}</p>
        <h1>Smart Ticket Booking Dashboard</h1>
        <div className="stat-grid">
          {stats.map((item) => (
            <article key={item.label} className="stat-card"><p>{item.label}</p><h3>{item.value}</h3></article>
          ))}
        </div>
      </header>
      {loading && <p className="status-card">Loading event details...</p>}
      {apiError && !loading && <p className="error-banner">{apiError}</p>}
      {isUser && loading && activeTab === 'booking' && (
        <section className="content-grid">
          <LoadingSkeleton rows={6} />
          <LoadingSkeleton rows={8} />
        </section>
      )}
      {!loading && isUser && event && activeTab === 'booking' && (
        <section className="content-grid">
          <EventDetails event={event} />
          <BookingForm events={events} selectedEventId={selectedEventId} formData={formData} formErrors={formErrors} totalAmount={totalAmount} isSubmitting={isSubmitting} onChange={handleChange} onSelectEvent={(value) => setSelectedEventId(value)} onSubmit={handleSubmit} onReset={handleReset} />
        </section>
      )}
      {summary && <BookingSummary summary={summary} onDownload={() => downloadReceipt(summary.bookingId, auth.token, summary.bookingCode).catch((error) => setApiError(error.message))} />}
      {activeTab === 'history' && (
        <section className="card">
          <h2>Booking History</h2>
          <p className="table-note">Cancellation allowed till 24 hours before event start for users.</p>
          {isHistoryBusy && <p className="status-card">Refreshing booking status...</p>}
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Code</th><th>User</th><th>Event</th><th>Status</th><th>Tickets</th><th>Total</th><th>Booked At</th><th>Receipt</th><th>Action</th></tr></thead>
              <tbody>
                {bookings.map((item) => (
                  <tr key={item.id}>
                    <td>{item.booking_code}</td><td>{item.user_name}</td><td>{item.event_name}</td>
                    <td><span className={`status-pill status-${item.status}`}>{item.status}</span></td>
                    <td>{item.ticket_count}</td><td>INR {Number(item.total_amount).toFixed(2)}</td><td>{new Date(item.booked_at).toLocaleString()}</td>
                    <td>
                      <button className="ghost" disabled={item.status !== 'paid'} onClick={() => downloadReceipt(item.id, auth.token, item.booking_code).catch((error) => setApiError(error.message))}>
                        PDF
                      </button>
                    </td>
                    <td>
                      <button
                        className="ghost"
                        disabled={item.status !== 'paid' || isHistoryBusy}
                        onClick={() => handleCancelBooking(item)}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {activeTab === 'analytics' && isAdmin && (
        analyticsLoading ? <LoadingSkeleton rows={8} /> : <AdminAnalytics data={analytics} />
      )}
      {activeTab === 'admin' && auth.user?.role === 'admin' && (
        <section className="content-grid">
          <article className="card">
            <h2>Create / Edit Event</h2>
            <form className="booking-form" onSubmit={handleEventSave}>
              <label>
                Select Existing Event
                <select value={eventForm.id} onChange={(eventObject) => {
                  const selected = events.find((item) => String(item.id) === eventObject.target.value)
                  if (!selected) return
                  setEventForm({ id: String(selected.id), eventName: selected.event_name, departmentName: selected.department_name, eventDateTime: new Date(selected.event_date_time).toISOString().slice(0, 16), venue: selected.venue, ticketPrice: selected.ticket_price, availableTickets: selected.available_tickets })
                }}>
                  <option value="">Choose event to edit (optional)</option>
                  {events.map((item) => <option key={item.id} value={item.id}>{item.event_name}</option>)}
                </select>
              </label>
              {[['eventName', 'Event Name', 'text'], ['departmentName', 'Department', 'text'], ['eventDateTime', 'Date & Time', 'datetime-local'], ['venue', 'Venue', 'text'], ['ticketPrice', 'Ticket Price', 'number'], ['availableTickets', 'Available Tickets', 'number']].map(([field, label, type]) => (
                <label key={field}>
                  {label}
                  <input type={type} value={eventForm[field]} onChange={(eventObject) => setEventForm((previous) => ({ ...previous, [field]: eventObject.target.value }))} required />
                </label>
              ))}
              <button type="submit">{eventForm.id ? 'Update Event' : 'Create Event'}</button>
            </form>
          </article>
          <article className="card">
            <h2>Events Overview</h2>
            <ul className="event-list">
              {events.map((item) => (
                <li key={item.id}><strong>{item.event_name}</strong><span>{item.department_name}</span><span>{new Date(item.event_date_time).toLocaleString()}</span><span>{item.venue}</span><span>INR {Number(item.ticket_price).toFixed(2)} | Left: {item.available_tickets}</span></li>
              ))}
            </ul>
          </article>
        </section>
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </main>
  )

  return (
    <Routes>
      <Route path="/" element={auth.user ? dashboard : <Navigate to="/login/user" replace />} />
      <Route
        path="/payment"
        element={
          auth.user && auth.user.role === 'user' ? (
            bookingDraft ? (
              <PaymentPage draft={bookingDraft} onBack={() => navigate('/')} onComplete={handleCompletePayment} />
            ) : (
              <Navigate to="/" replace />
            )
          ) : (
            <Navigate to={auth.user ? '/' : '/login/user'} replace />
          )
        }
      />
      <Route path="/login/user" element={auth.user ? <Navigate to="/" replace /> : <LoginPage role="user" loginData={loginData} onLoginChange={onLoginChange} onSubmit={(eventObject) => loginByRole('user', eventObject)} loginError={loginError} bootLoading={bootLoading} />} />
      <Route path="/login/admin" element={auth.user ? <Navigate to="/" replace /> : <LoginPage role="admin" loginData={loginData} onLoginChange={onLoginChange} onSubmit={(eventObject) => loginByRole('admin', eventObject)} loginError={loginError} bootLoading={bootLoading} />} />
      <Route path="/register" element={auth.user ? <Navigate to="/" replace /> : <RegisterPage registerData={registerData} onRegisterChange={onRegisterChange} onSubmit={handleRegister} loginError={loginError} bootLoading={bootLoading} />} />
      <Route path="*" element={<Navigate to={auth.user ? '/' : '/login/user'} replace />} />
    </Routes>
  )
}

export default App

