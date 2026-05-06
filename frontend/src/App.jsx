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
  checkInTicket,
  submitReview,
  sendChatbotMessage,
  getEventReviews,
  getAttendees,
  createPromo,
  getEventSeats,
  getMyProfile,
  getPromos,
  getPublicEventsFiltered,
  getRefunds,
  payForBooking,
  joinWaitlist,
  updateMyProfile,
  updateRefundStatus,
  validatePromo,
} from './api'
import { Html5QrcodeScanner } from 'html5-qrcode'
import EventDetails from './components/EventDetails'
import BookingForm from './components/BookingForm'
import BookingSummary from './components/BookingSummary'
import PaymentPage from './components/PaymentPage'
import LoadingSkeleton from './components/LoadingSkeleton'
import Toast from './components/Toast'
import AdminAnalytics from './components/AdminAnalytics'
import ChatBotWidget from './components/ChatBotWidget'

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

function AuthBubbles() {
  const bubbles = [
    { id: 1, x: 8, size: 150, delay: 0, duration: 18, drift: -18 },
    { id: 2, x: 20, size: 80, delay: 2, duration: 14, drift: 14 },
    { id: 3, x: 33, size: 120, delay: 1, duration: 16, drift: -10 },
    { id: 4, x: 47, size: 60, delay: 4, duration: 13, drift: 12 },
    { id: 5, x: 58, size: 170, delay: 0, duration: 21, drift: -15 },
    { id: 6, x: 69, size: 95, delay: 3, duration: 15, drift: 16 },
    { id: 7, x: 79, size: 140, delay: 2, duration: 19, drift: -14 },
    { id: 8, x: 88, size: 70, delay: 5, duration: 12, drift: 11 },
    { id: 9, x: 26, size: 50, delay: 6, duration: 10, drift: 8 },
    { id: 10, x: 74, size: 55, delay: 7, duration: 11, drift: -9 },
  ]

  return (
    <div className="auth-bubbles" aria-hidden="true">
      {bubbles.map((bubble) => (
        <span
          key={bubble.id}
          className="auth-bubble"
          style={{
            '--x': `${bubble.x}%`,
            '--size': `${bubble.size}px`,
            '--delay': `${bubble.delay}s`,
            '--duration': `${bubble.duration}s`,
            '--drift': `${bubble.drift}px`,
          }}
        />
      ))}
    </div>
  )
}

const handleAuthMouseMove = (event) => {
  const rect = event.currentTarget.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width
  const y = (event.clientY - rect.top) / rect.height
  event.currentTarget.style.setProperty('--mouse-x', String((x - 0.5).toFixed(3)))
  event.currentTarget.style.setProperty('--mouse-y', String((y - 0.5).toFixed(3)))
}

const handleAuthMouseLeave = (event) => {
  event.currentTarget.style.setProperty('--mouse-x', '0')
  event.currentTarget.style.setProperty('--mouse-y', '0')
}

function LoginPage({ role, loginData, onLoginChange, onSubmit, loginError, bootLoading }) {
  return (
    <main
      className="auth-page auth-page-animated"
      onMouseMove={handleAuthMouseMove}
      onMouseLeave={handleAuthMouseLeave}
    >
      <AuthBubbles />
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
    <main
      className="auth-page auth-page-animated"
      onMouseMove={handleAuthMouseMove}
      onMouseLeave={handleAuthMouseLeave}
    >
      <AuthBubbles />
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
  const [eventForm, setEventForm] = useState({ id: '', eventName: '', eventCategory: 'General', departmentName: '', eventDateTime: '', venue: '', ticketPrice: '', availableTickets: '', totalSeats: '200' })

  const [reviewModalEvent, setReviewModalEvent] = useState(null)
  const [reviewForm, setReviewForm] = useState({ rating: 5, feedbackText: '' })
  const [checkinCode, setCheckinCode] = useState('')
  const [eventReviews, setEventReviews] = useState([])
  const [showingReviewsFor, setShowingReviewsFor] = useState(null)
  
  const [checkinEventId, setCheckinEventId] = useState('')
  const [attendees, setAttendees] = useState([])
  const [promos, setPromos] = useState([])
  const [promoForm, setPromoForm] = useState({ code: '', discountPercentage: '', maxUses: '' })
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    dateFrom: '',
    dateTo: '',
  })
  const [takenSeats, setTakenSeats] = useState([])
  const [selectedSeats, setSelectedSeats] = useState([])
  const [profile, setProfile] = useState(null)
  const [profileForm, setProfileForm] = useState({ fullName: '', department: '' })
  const [refunds, setRefunds] = useState([])

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
        const publicEvents = await getPublicEventsFiltered(auth.token, filters)
        setEvents(publicEvents)
        setSelectedEventId((previous) => previous || String(publicEvents[0]?.id || ''))
        if (auth.user.role === 'user') {
          const profileData = await getMyProfile(auth.token)
          setProfile(profileData)
          setProfileForm({
            fullName: profileData.full_name,
            department: profileData.department,
          })
        }
        if (auth.user.role !== 'admin') {
          setAnalytics(null)
        }
        if (auth.user.role === 'admin') {
          const eventData = await getEvents(auth.token)
          setEvents(eventData)
          setAnalyticsLoading(true)
          const analyticsData = await getAdminAnalytics(auth.token)
          setAnalytics(analyticsData)
          const refundRows = await getRefunds(auth.token)
          setRefunds(refundRows)
        }
      } catch (error) {
        setApiError(error.message)
      } finally {
        setIsHistoryBusy(false)
        setAnalyticsLoading(false)
      }
    }
    loadData()
  }, [auth.token, auth.user?.role, filters])

  const isAdmin = auth.user?.role === 'admin'
  const isUser = auth.user?.role === 'user'

  useEffect(() => {
    if (!events.length || !selectedEventId) return
    const selected = events.find((item) => String(item.id) === String(selectedEventId))
    if (selected) setEvent(selected)
  }, [events, selectedEventId])

  useEffect(() => {
    if (!auth.token || !selectedEventId || !isUser) {
      setTakenSeats([])
      setSelectedSeats([])
      return
    }
    getEventSeats(auth.token, selectedEventId)
      .then((data) => {
        setTakenSeats(data.takenSeats || [])
        setSelectedSeats([])
      })
      .catch(() => {
        setTakenSeats([])
      })
  }, [auth.token, selectedEventId, isUser])

  useEffect(() => {
    if (activeTab === 'admin' && isAdmin) {
      getPromos(auth.token).then(setPromos).catch(() => {})
    }
  }, [activeTab, isAdmin, auth.token])

  useEffect(() => {
    if (activeTab === 'checkin' && checkinEventId && isAdmin) {
      getAttendees(auth.token, checkinEventId).then(setAttendees).catch(() => {})
    } else {
      setAttendees([])
    }
  }, [activeTab, checkinEventId, isAdmin, auth.token])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
    }
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3200)
  }

  const handleFilterChange = (field, value) => {
    setFilters((previous) => ({ ...previous, [field]: value }))
  }

  const handleSeatToggle = (seatCode) => {
    setSelectedSeats((previous) => {
      if (previous.includes(seatCode)) {
        return previous.filter((item) => item !== seatCode)
      }
      const limit = Number(formData.tickets || 0)
      if (limit > 0 && previous.length >= limit) {
        showToast('Seat limit reached for selected ticket count.', 'error')
        return previous
      }
      return [...previous, seatCode]
    })
  }

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
    if (event && event.availableTickets > 0 && tickets > 0 && selectedSeats.length !== tickets) {
      errors.selectedSeats = 'Please select seats matching your ticket count.'
    }
    return errors
  }

  const handleChange = (target) => {
    const { name, value } = target
    setFormData((previous) => ({ ...previous, [name]: value }))
    if (name === 'tickets') {
      const nextLimit = Number(value || 0)
      if (nextLimit >= 0) {
        setSelectedSeats((previous) => previous.slice(0, nextLimit))
      }
    }
    setFormErrors((previous) => ({ ...previous, [name]: '' }))
    setApiError('')
  }

  const handleReset = () => {
    setFormData({ name: '', email: '', department: '', tickets: '' })
    setFormErrors({})
    setApiError('')
    setSelectedSeats([])
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

  const handleCheckIn = async (code) => {
    if (!code) return
    try {
      setIsHistoryBusy(true)
      const res = await checkInTicket(auth.token, code)
      showToast(`Success: ${res.userName} is checked in!`, 'success')
      setCheckinCode('')
      if (checkinEventId) {
        getAttendees(auth.token, checkinEventId).then(setAttendees).catch(() => {})
      }
    } catch (error) {
      showToast(error.message || 'Check-in failed.', 'error')
    } finally {
      setIsHistoryBusy(false)
    }
  }

  const handleCreatePromo = async (e) => {
    e.preventDefault()
    try {
      await createPromo(auth.token, {
        code: promoForm.code,
        discountPercentage: Number(promoForm.discountPercentage),
        maxUses: Number(promoForm.maxUses) || 100
      })
      showToast('Promo code created!', 'success')
      setPromoForm({ code: '', discountPercentage: '', maxUses: '' })
      setPromos(await getPromos(auth.token))
    } catch (error) {
      showToast(error.message || 'Failed to create promo.', 'error')
    }
  }

  const handleProfileSave = async (eventObject) => {
    eventObject.preventDefault()
    try {
      await updateMyProfile(auth.token, profileForm)
      const refreshed = await getMyProfile(auth.token)
      setProfile(refreshed)
      setAuth((previous) => ({
        ...previous,
        user: {
          ...previous.user,
          fullName: refreshed.full_name,
          department: refreshed.department,
        },
      }))
      localStorage.setItem(
        'ticket_user',
        JSON.stringify({
          ...auth.user,
          fullName: refreshed.full_name,
          department: refreshed.department,
        })
      )
      showToast('Profile updated successfully.', 'success')
    } catch (error) {
      showToast(error.message || 'Unable to update profile.', 'error')
    }
  }

  const handleRefundUpdate = async (bookingId, refundStatus) => {
    try {
      await updateRefundStatus(auth.token, bookingId, {
        refundStatus,
        refundReference: refundStatus === 'processed' ? `AUTO-${bookingId}` : '',
      })
      setRefunds(await getRefunds(auth.token))
      showToast('Refund status updated.', 'success')
    } catch (error) {
      showToast(error.message || 'Unable to update refund status.', 'error')
    }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!reviewModalEvent) return
    const reviewEventId = Number(reviewModalEvent.eventId || reviewModalEvent.event_id)
    if (!Number.isInteger(reviewEventId) || reviewEventId <= 0) {
      showToast('Unable to identify event for feedback.', 'error')
      return
    }
    try {
      setIsHistoryBusy(true)
      await submitReview(auth.token, reviewEventId, reviewForm)
      showToast('Review submitted successfully!', 'success')
      setReviewModalEvent(null)
      setReviewForm({ rating: 5, feedbackText: '' })
    } catch (error) {
      showToast(error.message || 'Unable to submit review.', 'error')
    } finally {
      setIsHistoryBusy(false)
    }
  }

  const handleViewReviews = async (eventId) => {
    try {
      setIsHistoryBusy(true)
      const reviews = await getEventReviews(auth.token, eventId)
      setEventReviews(reviews)
      setShowingReviewsFor(eventId)
    } catch {
      showToast('Unable to fetch reviews.', 'error')
    } finally {
      setIsHistoryBusy(false)
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
    setSelectedSeats([])
    setTakenSeats([])
    setProfile(null)
    setRefunds([])
    setAnalytics(null)
    setToast(null)
    setActiveTab('booking')
  }

  const handleChatbotSend = async (message) => {
    if (!auth.token) {
      throw new Error('Please login first.')
    }
    return sendChatbotMessage(auth.token, message)
  }

  const handleEventSave = async (eventObject) => {
    eventObject.preventDefault()
    const payload = {
      eventName: eventForm.eventName,
      eventCategory: eventForm.eventCategory || 'General',
      departmentName: eventForm.departmentName,
      eventDateTime: eventForm.eventDateTime,
      venue: eventForm.venue,
      ticketPrice: Number(eventForm.ticketPrice),
      availableTickets: Number(eventForm.availableTickets),
      totalSeats: Number(eventForm.totalSeats),
    }
    try {
      if (eventForm.id) await updateEvent(auth.token, eventForm.id, payload)
      else await createEvent(auth.token, payload)
      setEvent(await getEventDetails())
      setEvents(await getEvents(auth.token))
      setEventForm({ id: '', eventName: '', eventCategory: 'General', departmentName: '', eventDateTime: '', venue: '', ticketPrice: '', availableTickets: '', totalSeats: '200' })
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
        selectedSeats,
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

  const handleWaitlistSubmit = async () => {
    if (!event) return
    const errors = validate()
    // For waitlist, we don't care if there are 0 available tickets, so we manually clear that error
    if (errors.tickets && errors.tickets.includes('available')) {
      delete errors.tickets
    }
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return
    
    setIsSubmitting(true)
    setApiError('')
    try {
      await joinWaitlist(auth.token, event.id, Number(formData.tickets))
      showToast('You have successfully joined the waitlist!', 'success')
      handleReset()
    } catch (error) {
      setApiError(error.message || 'Unable to join waitlist.')
      showToast(error.message || 'Unable to join waitlist.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompletePayment = async (paymentData, promoCode) => {
    if (!bookingDraft) {
      throw new Error('Booking draft missing. Please go back and confirm booking again.')
    }

    setApiError('')
    setIsSubmitting(true)
    try {
      if (bookingDraft.isWaitlistPayment) {
        await payForBooking(auth.token, bookingDraft.bookingId)
        setBookings(await getBookings(auth.token))
        setSummary({
          bookingId: bookingDraft.bookingId,
          bookingCode: 'Sent via Email', // Not strictly available in draft without fetch, or we can use draft.bookingCode if we added it
          name: bookingDraft.name,
          eventName: bookingDraft.eventName,
          ticketCount: bookingDraft.ticketCount,
          totalAmount: bookingDraft.totalAmount,
        })
      } else {
        if (!event) throw new Error('Event details unavailable. Please try again.')
        const payload = {
          eventId: bookingDraft.eventId,
          name: bookingDraft.name,
          email: bookingDraft.email,
          department: bookingDraft.department,
          ticketCount: bookingDraft.ticketCount,
          promoCode,
          selectedSeats: bookingDraft.selectedSeats || [],
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
      }
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
          {isUser && <button className="ghost" onClick={() => setActiveTab('profile')}>Profile</button>}
          <button className="ghost" onClick={() => setActiveTab('history')}>Booking History</button>
          {isAdmin && <button className="ghost" onClick={() => setActiveTab('analytics')}>Analytics</button>}
          {isAdmin && <button className="ghost" onClick={() => setActiveTab('admin')}>Admin</button>}
          {isAdmin && <button className="ghost" onClick={() => setActiveTab('checkin')}>Check-in</button>}
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
          <BookingForm event={event} events={events} selectedEventId={selectedEventId} filters={filters} formData={formData} formErrors={formErrors} totalAmount={totalAmount} isSubmitting={isSubmitting} takenSeats={takenSeats} selectedSeats={selectedSeats} onFilterChange={handleFilterChange} onChange={handleChange} onSelectEvent={(value) => setSelectedEventId(value)} onToggleSeat={handleSeatToggle} onSubmit={handleSubmit} onWaitlist={handleWaitlistSubmit} onReset={handleReset} />
        </section>
      )}
      {summary && <BookingSummary summary={summary} onDownload={() => downloadReceipt(summary.bookingId, auth.token, summary.bookingCode).catch((error) => setApiError(error.message))} />}
      {activeTab === 'profile' && isUser && profile && (
        <section className="content-grid">
          <article className="card">
            <h2>My Profile</h2>
            <form className="booking-form" onSubmit={handleProfileSave}>
              <label>
                Full Name
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(eventObject) =>
                    setProfileForm((previous) => ({ ...previous, fullName: eventObject.target.value }))
                  }
                />
              </label>
              <label>
                Department
                <input
                  type="text"
                  value={profileForm.department}
                  onChange={(eventObject) =>
                    setProfileForm((previous) => ({ ...previous, department: eventObject.target.value }))
                  }
                />
              </label>
              <label>
                Email
                <input type="email" value={profile.email} disabled />
              </label>
              <button type="submit">Save Profile</button>
            </form>
          </article>
          <article className="card">
            <h2>My Stats</h2>
            <div className="details-list">
              <p><span>Total Bookings</span><strong>{profile.stats.totalBookings}</strong></p>
              <p><span>Total Spent</span><strong>INR {Number(profile.stats.totalSpent).toFixed(2)}</strong></p>
              <p><span>Cancelled Bookings</span><strong>{profile.stats.cancelledBookings}</strong></p>
              <p><span>Member Since</span><strong>{new Date(profile.created_at).toLocaleDateString()}</strong></p>
            </div>
          </article>
        </section>
      )}
      {activeTab === 'history' && (
        <section className="card">
          <h2>Booking History</h2>
          <p className="table-note">Cancellation allowed till 24 hours before event start for users.</p>
          {isHistoryBusy && <p className="status-card">Refreshing booking status...</p>}
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Code</th><th>User</th><th>Event</th><th>Status</th><th>Seats</th><th>Tickets</th><th>Total</th><th>Booked At</th><th>Receipt</th><th>Action</th></tr></thead>
              <tbody>
                {bookings.map((item) => (
                  <tr key={item.id}>
                    <td>{item.booking_code}</td><td>{item.user_name}</td><td>{item.event_name}</td>
                    <td>
                      <span className={`status-pill status-${item.status}`}>{item.status}</span>
                      {item.status === 'cancelled' && item.refund_status && (
                        <small style={{ display: 'block', marginTop: '0.2rem' }}>refund: {item.refund_status}</small>
                      )}
                    </td>
                    <td>{item.seat_numbers || '-'}</td>
                    <td>{item.ticket_count}</td><td>INR {Number(item.total_amount).toFixed(2)}</td><td>{new Date(item.booked_at).toLocaleString()}</td>
                    <td>
                      <button className="ghost" disabled={item.status !== 'paid'} onClick={() => downloadReceipt(item.id, auth.token, item.booking_code).catch((error) => setApiError(error.message))}>
                        PDF
                      </button>
                    </td>
                    <td>
                      <div className="actions">
                        {item.status === 'pending_payment' ? (
                          <button
                            className="ghost"
                            disabled={isHistoryBusy}
                            onClick={() => {
                              const draft = {
                                bookingId: item.id,
                                eventId: item.event_id,
                                name: item.user_name,
                                email: item.email,
                                department: item.user_department,
                                ticketCount: item.ticket_count,
                                totalAmount: item.total_amount,
                                eventName: item.event_name,
                                isWaitlistPayment: true
                              }
                              setBookingDraft(draft)
                              localStorage.setItem('ticket_booking_draft', JSON.stringify(draft))
                              navigate('/payment')
                            }}
                          >
                            Pay Now
                          </button>
                        ) : (
                          <button
                            className="ghost"
                            disabled={item.status !== 'paid' || isHistoryBusy}
                            onClick={() => handleCancelBooking(item)}
                          >
                            Cancel
                          </button>
                        )}
                        {isUser && item.status === 'paid' && new Date(item.event_date_time) < new Date() && (
                          <button
                            className="ghost"
                            onClick={() => {
                              setReviewModalEvent({
                                ...item,
                                eventId: item.event_id || item.eventId,
                              })
                              setReviewForm({ rating: 5, feedbackText: '' })
                            }}
                          >
                            Feedback
                          </button>
                        )}
                      </div>
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
                  setEventForm({
                    id: String(selected.id),
                    eventName: selected.event_name,
                    eventCategory: selected.event_category || 'General',
                    departmentName: selected.department_name,
                    eventDateTime: new Date(selected.event_date_time).toISOString().slice(0, 16),
                    venue: selected.venue,
                    ticketPrice: selected.ticket_price,
                    availableTickets: selected.available_tickets,
                    totalSeats: selected.total_seats || 200,
                  })
                }}>
                  <option value="">Choose event to edit (optional)</option>
                  {events.map((item) => <option key={item.id} value={item.id}>{item.event_name}</option>)}
                </select>
              </label>
              {[['eventName', 'Event Name', 'text'], ['eventCategory', 'Category', 'text'], ['departmentName', 'Department', 'text'], ['eventDateTime', 'Date & Time', 'datetime-local'], ['venue', 'Venue', 'text'], ['ticketPrice', 'Ticket Price', 'number'], ['availableTickets', 'Available Tickets', 'number'], ['totalSeats', 'Total Seats', 'number']].map(([field, label, type]) => (
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
                <li key={item.id}>
                  <div>
                    <strong>{item.event_name}</strong>
                    <span>{item.event_category || 'General'}</span>
                    <span>{item.department_name}</span>
                    <span>{new Date(item.event_date_time).toLocaleString()}</span>
                    <span>{item.venue}</span>
                    <span>INR {Number(item.ticket_price).toFixed(2)} | Left: {item.available_tickets}</span>
                  </div>
                  <button className="ghost" onClick={() => handleViewReviews(item.id)}>View Feedback</button>
                </li>
              ))}
            </ul>
          </article>
          <article className="card">
            <h2>Promo Codes</h2>
            <form className="booking-form" onSubmit={handleCreatePromo}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" placeholder="CODE" value={promoForm.code} onChange={e => setPromoForm(p => ({...p, code: e.target.value.toUpperCase()}))} required />
                <input type="number" placeholder="Discount %" value={promoForm.discountPercentage} onChange={e => setPromoForm(p => ({...p, discountPercentage: e.target.value}))} required min="1" max="100" />
                <input type="number" placeholder="Max Uses" value={promoForm.maxUses} onChange={e => setPromoForm(p => ({...p, maxUses: e.target.value}))} />
                <button type="submit">Add</button>
              </div>
            </form>
            <div className="table-wrapper" style={{ marginTop: '1rem' }}>
              <table>
                <thead><tr><th>Code</th><th>Discount</th><th>Uses</th></tr></thead>
                <tbody>
                  {promos.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.code}</strong></td>
                      <td>{p.discount_percentage}%</td>
                      <td>{p.uses} / {p.max_uses}</td>
                    </tr>
                  ))}
                  {promos.length === 0 && <tr><td colSpan="3">No promo codes active.</td></tr>}
                </tbody>
              </table>
            </div>
          </article>
          <article className="card">
            <h2>Refund Workflow</h2>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>User</th>
                    <th>Event</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((refund) => (
                    <tr key={refund.id}>
                      <td>{refund.booking_code}</td>
                      <td>{refund.user_name}</td>
                      <td>{refund.event_name}</td>
                      <td>INR {Number(refund.refund_amount || 0).toFixed(2)}</td>
                      <td>
                        <select
                          value={refund.refund_status || 'pending'}
                          onChange={(eventObject) =>
                            handleRefundUpdate(refund.id, eventObject.target.value)
                          }
                        >
                          <option value="pending">pending</option>
                          <option value="initiated">initiated</option>
                          <option value="processed">processed</option>
                          <option value="failed">failed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {refunds.length === 0 && (
                    <tr>
                      <td colSpan="5">No cancelled bookings yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}
      {activeTab === 'checkin' && isAdmin && (
        <section className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2>Check-in Attendee</h2>
          <p>Enter the booking code manually to check someone in.</p>
          <div className="scanner-container">
            {/* HTML5 QR Scanner can be mounted here, keeping simple manual input for now to ensure robustness */}
            <form onSubmit={(e) => { e.preventDefault(); handleCheckIn(checkinCode); }} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <input type="text" placeholder="e.g. TBL7B29" value={checkinCode} onChange={(e) => setCheckinCode(e.target.value.toUpperCase())} required />
              <button type="submit" disabled={isHistoryBusy}>Check In</button>
            </form>
          </div>
          <div style={{ marginTop: '2rem' }}>
            <h3>Attendee List</h3>
            <select value={checkinEventId} onChange={e => setCheckinEventId(e.target.value)} style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}>
              <option value="">Select Event...</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.event_name}</option>)}
            </select>
            {checkinEventId && (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Name</th><th>Code</th><th>Status</th></tr></thead>
                  <tbody>
                    {attendees.map(a => (
                      <tr key={a.id}>
                        <td>{a.user_name}</td>
                        <td>{a.booking_code}</td>
                        <td>
                          {a.is_checked_in ? <span className="status-pill status-paid">Checked In</span> : <span className="status-pill status-pending_payment">Pending</span>}
                        </td>
                      </tr>
                    ))}
                    {attendees.length === 0 && <tr><td colSpan="3">No attendees found.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {reviewModalEvent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Leave Feedback</h2>
            <p>How was <strong>{reviewModalEvent.event_name}</strong>?</p>
            <form onSubmit={handleReviewSubmit}>
              <label>Rating</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={`star ${reviewForm.rating >= star ? 'active' : ''}`} onClick={() => setReviewForm(prev => ({...prev, rating: star}))}>★</span>
                ))}
              </div>
              <label>
                Review (Optional)
                <textarea rows="3" style={{width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc'}} value={reviewForm.feedbackText} onChange={(e) => setReviewForm(prev => ({...prev, feedbackText: e.target.value}))} placeholder="Share your experience..."></textarea>
              </label>
              <div className="actions" style={{marginTop: '1rem', justifyContent: 'flex-end'}}>
                <button type="button" className="ghost" onClick={() => setReviewModalEvent(null)}>Cancel</button>
                <button type="submit" disabled={isHistoryBusy}>Submit Feedback</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showingReviewsFor && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Event Feedback</h2>
              <button className="ghost" onClick={() => setShowingReviewsFor(null)}>Close</button>
            </div>
            {eventReviews.length === 0 ? <p>No feedback yet.</p> : (
              <div className="review-list">
                {eventReviews.map(r => (
                  <div key={r.id} className="review-card">
                    <div className="review-card-header">
                      <strong>{r.full_name}</strong>
                      <span className="review-card-rating">{'★'.repeat(r.rating)}</span>
                    </div>
                    <p style={{ margin: 0 }}>{r.feedback_text || <em>No text provided</em>}</p>
                    <small style={{ color: '#6b7280' }}>{new Date(r.created_at).toLocaleDateString()}</small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
      {auth.user && <ChatBotWidget onSend={handleChatbotSend} disabled={!auth.token} />}
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
              <PaymentPage draft={bookingDraft} onBack={() => navigate('/')} onComplete={handleCompletePayment} onValidatePromo={async (code) => await validatePromo(auth.token, code)} />
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

