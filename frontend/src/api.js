const API_BASE_URL = import.meta.env.VITE_API_URL
  ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '')
  : import.meta.env.DEV
    ? '/api'
    : 'http://localhost:5000/api'

const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
})

const parseResponse = async (response) => {
  const raw = await response.text()
  let data = {}
  if (raw) {
    try {
      data = JSON.parse(raw)
    } catch {
      throw new Error(
        response.ok
          ? 'Unexpected response from server.'
          : raw.slice(0, 160) || `Request failed (${response.status}).`
      )
    }
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed (${response.status}).`)
  }

  return data
}

export const getEventDetails = async () => {
  const response = await fetch(`${API_BASE_URL}/event`)
  return parseResponse(response)
}

export const createBooking = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(payload.token),
    },
    body: JSON.stringify(payload.body),
  })

  return parseResponse(response)
}

export const loginUser = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/auth/login/user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseResponse(response)
}

export const loginAdmin = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/auth/login/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseResponse(response)
}

export const registerUser = async (payload) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseResponse(response)
}

export const getBookings = async (token) => {
  const response = await fetch(`${API_BASE_URL}/bookings`, {
    headers: authHeader(token),
  })
  return parseResponse(response)
}

export const cancelBooking = async (bookingId, token, reason) => {
  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token),
    },
    body: JSON.stringify({ reason }),
  })
  return parseResponse(response)
}

export const getPublicEvents = async (token) => {
  const response = await fetch(`${API_BASE_URL}/events-public`, {
    headers: authHeader(token),
  })
  return parseResponse(response)
}

export const getPublicEventsFiltered = async (token, filters) => {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.category) params.set('category', filters.category)
  if (filters.minPrice) params.set('minPrice', filters.minPrice)
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  const response = await fetch(`${API_BASE_URL}/events-public?${params.toString()}`, {
    headers: authHeader(token),
  })
  return parseResponse(response)
}

export const getEvents = async (token) => {
  const response = await fetch(`${API_BASE_URL}/events`, {
    headers: authHeader(token),
  })
  return parseResponse(response)
}

export const createEvent = async (token, payload) => {
  const response = await fetch(`${API_BASE_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token),
    },
    body: JSON.stringify(payload),
  })
  return parseResponse(response)
}

export const updateEvent = async (token, eventId, payload) => {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(token),
    },
    body: JSON.stringify(payload),
  })
  return parseResponse(response)
}

export const getAdminAnalytics = async (token) => {
  const response = await fetch(`${API_BASE_URL}/admin/analytics`, {
    headers: authHeader(token),
  })
  return parseResponse(response)
}

export const downloadReceipt = async (bookingId, token, bookingCode) => {
  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/receipt`, {
    headers: authHeader(token),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Unable to download receipt.')
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `receipt-${bookingCode}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const checkInTicket = async (token, bookingCode) => {
  const response = await fetch(`${API_BASE_URL}/admin/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify({ bookingCode }),
  })
  return parseResponse(response)
}

export const submitReview = async (token, eventId, reviewData) => {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify(reviewData),
  })
  return parseResponse(response)
}

export const getEventReviews = async (token, eventId) => {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/reviews`, {
    headers: authHeader(token),
  })
  return parseResponse(response)
}

export const getAttendees = async (token, eventId) => {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/attendees`, {
    headers: authHeader(token),
  })
  return parseResponse(response)
}

export const createPromo = async (token, promoData) => {
  const response = await fetch(`${API_BASE_URL}/admin/promos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify(promoData),
  })
  return parseResponse(response)
}

export const getPromos = async (token) => {
  const response = await fetch(`${API_BASE_URL}/admin/promos`, {
    headers: authHeader(token),
  })
  return parseResponse(response)
}

export const validatePromo = async (token, code) => {
  const response = await fetch(`${API_BASE_URL}/promos/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify({ code }),
  })
  return parseResponse(response)
}

export const joinWaitlist = async (token, eventId, ticketCount) => {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify({ ticketCount }),
  })
  return parseResponse(response)
}

export const payForBooking = async (token, bookingId) => {
  const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/pay`, {
    method: 'POST',
    headers: authHeader(token),
  })
  return parseResponse(response)
}

export const getEventSeats = async (token, eventId) => {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/seats`, {
    headers: authHeader(token),
  })
  return parseResponse(response)
}

export const getMyProfile = async (token) => {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: authHeader(token),
  })
  return parseResponse(response)
}

export const updateMyProfile = async (token, payload) => {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify(payload),
  })
  return parseResponse(response)
}

export const getRefunds = async (token) => {
  const response = await fetch(`${API_BASE_URL}/admin/refunds`, {
    headers: authHeader(token),
  })
  return parseResponse(response)
}

export const updateRefundStatus = async (token, bookingId, payload) => {
  const response = await fetch(`${API_BASE_URL}/admin/refunds/${bookingId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify(payload),
  })
  return parseResponse(response)
}

export const sendChatbotMessage = async (token, message) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chatbot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(token) },
      body: JSON.stringify({ message }),
    })
    return await parseResponse(response)
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        'Cannot reach the API. Start the backend (npm start in backend) and use npm run dev for the frontend so /api is proxied.'
      )
    }
    throw error
  }
}
