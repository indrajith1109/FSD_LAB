const API_BASE_URL = 'http://localhost:5000/api'

const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
})

const parseResponse = async (response) => {
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong.')
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
