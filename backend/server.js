const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
const pdfkit = require('pdfkit')
const pool = require('./db')
const qrcode = require('qrcode')
require('dotenv').config()

const app = express()
const PORT = Number(process.env.PORT || 5000)
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_only'

app.use(cors())
app.use(express.json())

const buildMailTransport = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

const mailTransport = buildMailTransport()

const sendWelcomeEmail = async ({ to, fullName, department }) => {
  if (!mailTransport) {
    return
  }

  await mailTransport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'Welcome to EventHub',
    html: `
      <h2>Hello ${fullName},</h2>
      <p>Your EventHub account has been created successfully.</p>
      <ul>
        <li><strong>Email:</strong> ${to}</li>
        <li><strong>Department:</strong> ${department}</li>
      </ul>
      <p>You can now sign in and start booking tickets.</p>
    `,
  })
}

const createToken = (user) =>
  jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, {
    expiresIn: '8h',
  })

const authRequired = (request, response, next) => {
  const header = request.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return response.status(401).json({ message: 'Authentication required.' })
  }

  try {
    const token = header.substring(7)
    request.user = jwt.verify(token, JWT_SECRET)
    return next()
  } catch (_error) {
    return response.status(401).json({ message: 'Invalid or expired token.' })
  }
}

const roleRequired = (...allowedRoles) => (request, response, next) => {
  if (!request.user || !allowedRoles.includes(request.user.role)) {
    return response.status(403).json({ message: 'You do not have access to this resource.' })
  }
  return next()
}

const adminRequired = roleRequired('admin')
const VALID_REFUND_STATUSES = new Set(['pending', 'initiated', 'processed', 'failed'])

const normalizeSeatCode = (seat) => String(seat || '').trim().toUpperCase()
const isSeatCodeValid = (seat) => /^[A-Z]{1,2}\d{1,3}$/.test(seat)
const BOT_GREETING = 'Hi! I am EventHub Assistant. Ask me about events, pricing, bookings, or refunds.'

const formatEventDate = (value) =>
  new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

const matchesKeyword = (text, keyword) => {
  const k = String(keyword).toLowerCase()
  if (k.includes(' ')) {
    return text.includes(k)
  }
  if (k.length <= 3) {
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, 'i').test(text)
  }
  return text.includes(k)
}

const isQuestion = (text, keywords) => keywords.some((keyword) => matchesKeyword(text, keyword))

const ensureBookingColumns = async () => {
  const [columns] = await pool.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'bookings'`
  )
  const existing = new Set(columns.map((column) => column.COLUMN_NAME))

  const migrations = [
    {
      name: 'status',
      sql: "ALTER TABLE bookings ADD COLUMN status ENUM('pending_payment', 'paid', 'failed', 'cancelled') NOT NULL DEFAULT 'paid'",
    },
    {
      name: 'refund_amount',
      sql: 'ALTER TABLE bookings ADD COLUMN refund_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00',
    },
    {
      name: 'cancelled_at',
      sql: 'ALTER TABLE bookings ADD COLUMN cancelled_at DATETIME NULL',
    },
    {
      name: 'cancellation_reason',
      sql: 'ALTER TABLE bookings ADD COLUMN cancellation_reason VARCHAR(255) NULL',
    },
    {
      name: 'is_checked_in',
      sql: 'ALTER TABLE bookings ADD COLUMN is_checked_in BOOLEAN NOT NULL DEFAULT FALSE',
    },
    {
      name: 'check_in_time',
      sql: 'ALTER TABLE bookings ADD COLUMN check_in_time DATETIME NULL',
    },
    {
      name: 'seat_numbers',
      sql: 'ALTER TABLE bookings ADD COLUMN seat_numbers TEXT NULL',
    },
    {
      name: 'refund_status',
      sql: "ALTER TABLE bookings ADD COLUMN refund_status ENUM('pending', 'initiated', 'processed', 'failed') NULL",
    },
    {
      name: 'refund_reference',
      sql: 'ALTER TABLE bookings ADD COLUMN refund_reference VARCHAR(120) NULL',
    },
    {
      name: 'refunded_at',
      sql: 'ALTER TABLE bookings ADD COLUMN refunded_at DATETIME NULL',
    },
  ]

  for (const migration of migrations) {
    if (!existing.has(migration.name)) {
      await pool.query(migration.sql)
    }
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT PRIMARY KEY AUTO_INCREMENT,
      event_id INT NOT NULL,
      user_id INT NOT NULL,
      rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      feedback_text TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_review_event FOREIGN KEY (event_id) REFERENCES events(id),
      CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS waitlist (
      id INT PRIMARY KEY AUTO_INCREMENT,
      event_id INT NOT NULL,
      user_id INT NOT NULL,
      ticket_count INT NOT NULL,
      status ENUM('waiting', 'promoted', 'cancelled') NOT NULL DEFAULT 'waiting',
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_waitlist_event FOREIGN KEY (event_id) REFERENCES events(id),
      CONSTRAINT fk_waitlist_user FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS promo_codes (
      id INT PRIMARY KEY AUTO_INCREMENT,
      code VARCHAR(50) UNIQUE NOT NULL,
      discount_percentage INT NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
      max_uses INT NOT NULL DEFAULT 100,
      uses INT NOT NULL DEFAULT 0,
      valid_until DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  const [eventColumns] = await pool.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'events'`
  )
  const existingEventColumns = new Set(eventColumns.map((column) => column.COLUMN_NAME))
  if (!existingEventColumns.has('event_category')) {
    await pool.query("ALTER TABLE events ADD COLUMN event_category VARCHAR(80) NOT NULL DEFAULT 'General'")
  }
  if (!existingEventColumns.has('total_seats')) {
    await pool.query('ALTER TABLE events ADD COLUMN total_seats INT NOT NULL DEFAULT 200')
  }
}

app.post('/api/auth/register', async (request, response) => {
  const { fullName, email, department, password } = request.body

  if (!fullName || !email || !department || !password) {
    return response.status(400).json({ message: 'All fields are mandatory.' })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response.status(400).json({ message: 'Email format is invalid.' })
  }

  if (String(password).length < 6) {
    return response.status(400).json({ message: 'Password must be at least 6 characters.' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, department, role, password_hash)
       VALUES (?, ?, ?, 'user', ?)`,
      [fullName, email, department, passwordHash]
    )

    const user = {
      id: result.insertId,
      full_name: fullName,
      email,
      department,
      role: 'user',
    }

    sendWelcomeEmail({
      to: email,
      fullName,
      department,
    }).catch((error) => console.error('Welcome email error:', error.message))

    return response.status(201).json({
      token: createToken(user),
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        department: user.department,
        role: user.role,
      },
    })
  } catch (error) {
    console.error(error)
    if (error.code === 'ER_DUP_ENTRY') {
      return response.status(409).json({ message: 'Email is already registered. Please login.' })
    }
    return response.status(500).json({ message: 'Unable to register right now.' })
  }
})

app.post('/api/auth/login', async (request, response) => {
  const { email, password } = request.body

  if (!email || !password) {
    return response.status(400).json({ message: 'Email and password are required.' })
  }

  try {
    const [users] = await pool.query(
      `SELECT id, full_name, email, department, role, password_hash
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email]
    )

    if (users.length === 0) {
      return response.status(401).json({ message: 'Invalid credentials.' })
    }

    const user = users[0]
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return response.status(401).json({ message: 'Invalid credentials.' })
    }

    return response.json({
      token: createToken(user),
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        department: user.department,
        role: user.role,
      },
    })
  } catch (error) {
    console.error(error)
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return response.status(500).json({
        message:
          'Database setup incomplete. Run backend/schema.sql in MySQL Workbench and restart server.',
      })
    }
    return response.status(500).json({ message: 'Unable to login right now.' })
  }
})

const handleRoleLogin = (expectedRole) => async (request, response) => {
  const { email, password } = request.body

  if (!email || !password) {
    return response.status(400).json({ message: 'Email and password are required.' })
  }

  try {
    const [users] = await pool.query(
      `SELECT id, full_name, email, department, role, password_hash
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email]
    )

    if (users.length === 0) {
      return response.status(401).json({ message: 'Invalid credentials.' })
    }

    const user = users[0]
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return response.status(401).json({ message: 'Invalid credentials.' })
    }

    if (user.role !== expectedRole) {
      return response.status(403).json({
        message:
          expectedRole === 'admin'
            ? 'This account is not an admin account.'
            : 'This account is not a user account.',
      })
    }

    return response.json({
      token: createToken(user),
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        department: user.department,
        role: user.role,
      },
    })
  } catch (error) {
    console.error(error)
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return response.status(500).json({
        message:
          'Database setup incomplete. Run backend/schema.sql in MySQL Workbench and restart server.',
      })
    }
    return response.status(500).json({ message: 'Unable to login right now.' })
  }
}

app.post('/api/auth/login/user', handleRoleLogin('user'))
app.post('/api/auth/login/admin', handleRoleLogin('admin'))

app.get('/api/events-public', authRequired, async (request, response) => {
  const search = String(request.query.search || '').trim()
  const category = String(request.query.category || '').trim()
  const minPrice = Number(request.query.minPrice || 0)
  const maxPrice = Number(request.query.maxPrice || 0)
  const dateFrom = String(request.query.dateFrom || '').trim()
  const dateTo = String(request.query.dateTo || '').trim()

  try {
    const where = []
    const params = []
    if (search) {
      where.push('(event_name LIKE ? OR department_name LIKE ? OR venue LIKE ?)')
      const like = `%${search}%`
      params.push(like, like, like)
    }
    if (category) {
      where.push('event_category = ?')
      params.push(category)
    }
    if (minPrice > 0) {
      where.push('ticket_price >= ?')
      params.push(minPrice)
    }
    if (maxPrice > 0) {
      where.push('ticket_price <= ?')
      params.push(maxPrice)
    }
    if (dateFrom) {
      where.push('event_date_time >= ?')
      params.push(dateFrom)
    }
    if (dateTo) {
      where.push('event_date_time <= ?')
      params.push(dateTo)
    }

    const [rows] = await pool.query(
      `SELECT id, event_name, event_category, department_name, event_date_time, venue, ticket_price, available_tickets, total_seats
       FROM events
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY event_date_time DESC`
      ,
      params
    )

    return response.json(
      rows.map((event) => ({
        id: event.id,
        eventName: event.event_name,
        eventCategory: event.event_category,
        departmentName: event.department_name,
        eventDateTime: event.event_date_time,
        venue: event.venue,
        ticketPrice: Number(event.ticket_price),
        availableTickets: event.available_tickets,
        totalSeats: event.total_seats,
      }))
    )
  } catch (error) {
    console.error(error)
    return response.status(500).json({ message: 'Unable to fetch events.' })
  }
})

app.get('/api/event', async (_request, response) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, event_name, event_category, department_name, event_date_time, venue, ticket_price, available_tickets, total_seats
       FROM events
       ORDER BY id DESC
       LIMIT 1`
    )
    if (rows.length === 0) {
      return response.status(404).json({ message: 'No event is configured.' })
    }
    const event = rows[0]
    return response.json({
      id: event.id,
      eventName: event.event_name,
      eventCategory: event.event_category,
      departmentName: event.department_name,
      eventDateTime: event.event_date_time,
      venue: event.venue,
      ticketPrice: Number(event.ticket_price),
      availableTickets: event.available_tickets,
      totalSeats: event.total_seats,
    })
  } catch (error) {
    console.error(error)
    return response.status(500).json({ message: 'Failed to fetch event details.' })
  }
})

app.post('/api/chatbot', authRequired, async (request, response) => {
  const message = String(request.body.message || '').trim()
  if (!message) {
    return response.status(400).json({ message: 'Message is required.' })
  }

  const normalized = message.toLowerCase()

  try {
    if (isQuestion(normalized, ['hello', 'hi', 'hey', 'help', 'start'])) {
      return response.json({
        reply: `${BOT_GREETING}
- Try: "show upcoming events"
- Try: "cheapest event"
- Try: "how to cancel booking?"`,
      })
    }

    if (
      isQuestion(normalized, [
        'upcoming',
        'next event',
        'events',
        'event list',
        'list event',
        'show event',
        'all event',
        'schedule',
        'what event',
        'which event',
        'ticket booking',
        'show tickets',
        'book tickets',
        'available tickets',
      ])
    ) {
      let [rows] = await pool.query(
        `SELECT event_name, event_date_time, venue, ticket_price, available_tickets
         FROM events
         WHERE event_date_time >= NOW()
         ORDER BY event_date_time ASC
         LIMIT 5`
      )
      if (rows.length === 0) {
        ;[rows] = await pool.query(
          `SELECT event_name, event_date_time, venue, ticket_price, available_tickets
           FROM events
           ORDER BY event_date_time DESC
           LIMIT 5`
        )
      }
      if (rows.length === 0) {
        return response.json({ reply: 'No events are in the database yet. An admin can add events from the Admin tab.' })
      }
      const eventLines = rows.map(
        (item, index) =>
          `${index + 1}. ${item.event_name} at ${item.venue} on ${formatEventDate(item.event_date_time)} (INR ${Number(
            item.ticket_price
          ).toFixed(2)}, seats left: ${item.available_tickets})`
      )
      const header =
        rows[0] && new Date(rows[0].event_date_time) >= new Date()
          ? 'Upcoming events:'
          : 'No future events found. Latest events in the system:'
      return response.json({ reply: `${header}\n${eventLines.join('\n')}` })
    }

    if (isQuestion(normalized, ['cheap', 'lowest price', 'affordable', 'price', 'cost', 'how much'])) {
      let [rows] = await pool.query(
        `SELECT event_name, venue, event_date_time, ticket_price
         FROM events
         WHERE event_date_time >= NOW()
         ORDER BY ticket_price ASC, event_date_time ASC
         LIMIT 1`
      )
      if (rows.length === 0) {
        ;[rows] = await pool.query(
          `SELECT event_name, venue, event_date_time, ticket_price
           FROM events
           ORDER BY ticket_price ASC, event_date_time DESC
           LIMIT 1`
        )
      }
      if (rows.length === 0) {
        return response.json({ reply: 'I could not find any events to compare prices.' })
      }
      const event = rows[0]
      const isUpcoming = new Date(event.event_date_time) >= new Date()
      const label = isUpcoming ? 'Most affordable upcoming event' : 'Lowest-priced event on record'
      return response.json({
        reply: `${label} is "${event.event_name}" at ${event.venue} on ${formatEventDate(
          event.event_date_time
        )}. Ticket price is INR ${Number(event.ticket_price).toFixed(2)}.`,
      })
    }

    if (isQuestion(normalized, ['my bookings', 'booking history', 'my booking', 'reservation'])) {
      const [rows] = await pool.query(
        `SELECT booking_code, status, total_amount, booked_at
         FROM bookings
         WHERE user_id = ?
         ORDER BY booked_at DESC
         LIMIT 5`,
        [request.user.id]
      )
      if (rows.length === 0) {
        return response.json({ reply: 'You do not have any bookings yet.' })
      }
      const lines = rows.map(
        (item) =>
          `- ${item.booking_code}: ${item.status} | INR ${Number(item.total_amount).toFixed(2)} | ${
            item.booked_at ? formatEventDate(item.booked_at) : '—'
          }`
      )
      return response.json({ reply: `Your latest bookings:\n${lines.join('\n')}` })
    }

    if (isQuestion(normalized, ['cancel', 'refund', 'cancellation'])) {
      return response.json({
        reply:
          'You can cancel from Booking History. For user accounts, cancellation is allowed up to 24 hours before event start. Refund status is visible in your booking record.',
      })
    }

    if (isQuestion(normalized, ['book', 'tickets', 'seat', 'buy', 'purchase', 'register'])) {
      return response.json({
        reply:
          'To book: choose an event in Booking tab, enter details, select ticket count and seats, then continue to payment.',
      })
    }

    const isDismissal =
      /\bno thanks\b/.test(normalized) ||
      /\bno thank you\b/.test(normalized) ||
      /\b(nah|nope) thanks\b/.test(normalized) ||
      /\bthat'?s all\b/.test(normalized) ||
      /\b(i'?m good|im good)\b/.test(normalized) ||
      /\ball set\b/.test(normalized) ||
      /\bnot interested\b/.test(normalized) ||
      isQuestion(normalized, ['bye', 'goodbye']) ||
      normalized.includes('see you') ||
      normalized.includes('see ya')

    if (isDismissal) {
      return response.json({
        reply:
          'Understood. If you need help with events or bookings later, just open this chat again.',
      })
    }

    const isGratitude =
      normalized.includes('thank you') ||
      /\bthanks\b/.test(normalized) ||
      normalized.includes('thx') ||
      /\bty\b/.test(normalized) ||
      normalized.includes('appreciate')

    if (isGratitude) {
      return response.json({
        reply: "You're welcome! Glad I could help. Anything else about EventHub?",
      })
    }

    return response.json({
      reply:
        'I did not quite catch that. Try: "show upcoming events", "my bookings", "ticket price", or "how do I cancel?".',
    })
  } catch (error) {
    console.error('Chatbot error:', error)
    return response.status(500).json({ message: 'Unable to process chatbot request right now.' })
  }
})

app.get('/api/events', authRequired, adminRequired, async (_request, response) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, event_name, event_category, department_name, event_date_time, venue, ticket_price, available_tickets, total_seats
       FROM events
       ORDER BY event_date_time DESC`
    )
    return response.json(rows)
  } catch (error) {
    console.error(error)
    return response.status(500).json({ message: 'Unable to fetch events.' })
  }
})

app.post('/api/events', authRequired, adminRequired, async (request, response) => {
  const {
    eventName,
    eventCategory,
    departmentName,
    eventDateTime,
    venue,
    ticketPrice,
    availableTickets,
    totalSeats,
  } =
    request.body
  if (
    !eventName ||
    !departmentName ||
    !eventDateTime ||
    !venue ||
    Number(ticketPrice) <= 0 ||
    Number(availableTickets) < 0 ||
    Number(totalSeats) <= 0
  ) {
    return response.status(400).json({ message: 'All event fields are mandatory.' })
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO events (event_name, event_category, department_name, event_date_time, venue, ticket_price, available_tickets, total_seats)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventName,
        eventCategory || 'General',
        departmentName,
        eventDateTime,
        venue,
        ticketPrice,
        availableTickets,
        totalSeats,
      ]
    )
    return response.status(201).json({ id: result.insertId })
  } catch (error) {
    console.error(error)
    return response.status(500).json({ message: 'Unable to create event.' })
  }
})

app.put('/api/events/:id', authRequired, adminRequired, async (request, response) => {
  const { id } = request.params
  const {
    eventName,
    eventCategory,
    departmentName,
    eventDateTime,
    venue,
    ticketPrice,
    availableTickets,
    totalSeats,
  } =
    request.body
  try {
    await pool.query(
      `UPDATE events
       SET event_name = ?, event_category = ?, department_name = ?, event_date_time = ?, venue = ?, ticket_price = ?, available_tickets = ?, total_seats = ?
       WHERE id = ?`,
      [
        eventName,
        eventCategory || 'General',
        departmentName,
        eventDateTime,
        venue,
        ticketPrice,
        availableTickets,
        totalSeats,
        id,
      ]
    )
    return response.json({ message: 'Event updated.' })
  } catch (error) {
    console.error(error)
    return response.status(500).json({ message: 'Unable to update event.' })
  }
})

app.get('/api/bookings', authRequired, async (request, response) => {
  try {
    const isAdmin = request.user.role === 'admin'
    const [rows] = await pool.query(
      `SELECT b.id, b.event_id, b.booking_code, b.user_name, b.email, b.user_department, b.ticket_count, b.total_amount, b.status,
              b.refund_amount, b.refund_status, b.refund_reference, b.refunded_at, b.seat_numbers,
              b.cancelled_at, b.cancellation_reason, b.booked_at, e.event_name, e.event_date_time
       FROM bookings b
       INNER JOIN events e ON e.id = b.event_id
       ${isAdmin ? '' : 'WHERE b.user_id = ?'}
       ORDER BY b.booked_at DESC`,
      isAdmin ? [] : [request.user.id]
    )
    return response.json(rows)
  } catch (error) {
    console.error(error)
    return response.status(500).json({ message: 'Unable to fetch bookings.' })
  }
})

app.patch('/api/bookings/:id/cancel', authRequired, roleRequired('admin', 'user'), async (request, response) => {
  const bookingId = Number(request.params.id)
  const cancellationReason = String(request.body.reason || 'User requested cancellation').trim().slice(0, 255)

  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return response.status(400).json({ message: 'Invalid booking id.' })
  }

  let connection
  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()

    const [rows] = await connection.query(
      `SELECT b.id, b.user_id, b.event_id, b.ticket_count, b.total_amount, b.status, e.event_date_time
       FROM bookings b
       INNER JOIN events e ON e.id = b.event_id
       WHERE b.id = ?
       FOR UPDATE`,
      [bookingId]
    )

    if (rows.length === 0) {
      await connection.rollback()
      return response.status(404).json({ message: 'Booking not found.' })
    }

    const booking = rows[0]
    const isOwner = request.user.id === booking.user_id
    const isAdmin = request.user.role === 'admin'
    if (!isOwner && !isAdmin) {
      await connection.rollback()
      return response.status(403).json({ message: 'Not allowed to cancel this booking.' })
    }

    if (booking.status === 'cancelled') {
      await connection.rollback()
      return response.status(400).json({ message: 'Booking is already cancelled.' })
    }

    const eventDate = new Date(booking.event_date_time)
    const deadline = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000)
    if (!isAdmin && Date.now() > deadline.getTime()) {
      await connection.rollback()
      return response.status(400).json({
        message: 'Cancellation is allowed only up to 24 hours before the event.',
      })
    }

    const refundAmount = Number(booking.total_amount).toFixed(2)

    await connection.query(
      `UPDATE bookings
       SET status = 'cancelled',
           refund_amount = ?,
           refund_status = 'pending',
           cancelled_at = NOW(),
           cancellation_reason = ?
       WHERE id = ?`,
      [refundAmount, cancellationReason, booking.id]
    )

    await connection.query('UPDATE events SET available_tickets = available_tickets + ? WHERE id = ?', [
      booking.ticket_count,
      booking.event_id,
    ])

    // Waitlist Auto-Queue
    const [updatedEvents] = await connection.query(`SELECT available_tickets, ticket_price FROM events WHERE id = ? FOR UPDATE`, [booking.event_id])
    let currentAvailable = updatedEvents[0].available_tickets
    const ticketPrice = Number(updatedEvents[0].ticket_price)

    const [waitlist] = await connection.query(
      `SELECT w.id, w.user_id, w.ticket_count, u.full_name, u.email, u.department 
       FROM waitlist w 
       INNER JOIN users u ON u.id = w.user_id
       WHERE w.event_id = ? AND w.status = 'waiting' 
       ORDER BY w.joined_at ASC`,
      [booking.event_id]
    )

    for (const entry of waitlist) {
      if (currentAvailable >= entry.ticket_count) {
        const baseAmount = ticketPrice * entry.ticket_count
        const code = `TB${Date.now().toString(36).toUpperCase()}`
        
        await connection.query(
          `INSERT INTO bookings (event_id, user_id, booking_code, user_name, email, user_department, ticket_count, total_amount, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment')`,
          [booking.event_id, entry.user_id, code, entry.full_name, entry.email, entry.department, entry.ticket_count, baseAmount]
        )
        
        await connection.query(`UPDATE waitlist SET status = 'promoted' WHERE id = ?`, [entry.id])
        await connection.query(`UPDATE events SET available_tickets = available_tickets - ? WHERE id = ?`, [entry.ticket_count, booking.event_id])
        currentAvailable -= entry.ticket_count
      }
    }

    await connection.commit()
    return response.json({
      message: 'Booking cancelled. Refund will be processed as per policy.',
      refundAmount: Number(refundAmount),
      status: 'cancelled',
    })
  } catch (error) {
    if (connection) {
      await connection.rollback()
    }
    console.error(error)
    return response.status(500).json({ message: 'Unable to cancel booking right now.' })
  } finally {
    if (connection) {
      connection.release()
    }
  }
})

app.get('/api/admin/analytics', authRequired, adminRequired, async (_request, response) => {
  try {
    const [overviewRows] = await pool.query(
      `SELECT
         COUNT(*) AS totalBookings,
         SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) AS paidRevenue,
         SUM(CASE WHEN status = 'cancelled' THEN refund_amount ELSE 0 END) AS refundsIssued,
         SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelledBookings
       FROM bookings`
    )

    const [eventRows] = await pool.query(
      `SELECT e.id, e.event_name AS eventName,
              SUM(CASE WHEN b.status = 'paid' THEN b.total_amount ELSE 0 END) AS revenue,
              SUM(CASE WHEN b.status = 'paid' THEN b.ticket_count ELSE 0 END) AS tickets,
              (SELECT AVG(rating) FROM reviews WHERE event_id = e.id) AS averageRating,
              (SELECT COUNT(*) FROM reviews WHERE event_id = e.id) AS reviewCount
       FROM events e
       LEFT JOIN bookings b ON b.event_id = e.id
       GROUP BY e.id, e.event_name
       ORDER BY revenue DESC`
    )

    const [departmentRows] = await pool.query(
      `SELECT b.user_department AS department,
              COUNT(*) AS bookings,
              SUM(CASE WHEN b.status = 'paid' THEN b.total_amount ELSE 0 END) AS revenue
       FROM bookings b
       GROUP BY b.user_department
       ORDER BY bookings DESC`
    )

    const [dateRows] = await pool.query(
      `SELECT DATE(b.booked_at) AS dateLabel,
              COUNT(*) AS bookings,
              SUM(CASE WHEN b.status = 'paid' THEN b.total_amount ELSE 0 END) AS revenue
       FROM bookings b
       GROUP BY DATE(b.booked_at)
       ORDER BY DATE(b.booked_at) ASC`
    )

    return response.json({
      overview: {
        totalBookings: Number(overviewRows[0].totalBookings || 0),
        paidRevenue: Number(overviewRows[0].paidRevenue || 0),
        refundsIssued: Number(overviewRows[0].refundsIssued || 0),
        cancelledBookings: Number(overviewRows[0].cancelledBookings || 0),
      },
      byEvent: eventRows.map((row) => ({
        eventName: row.eventName,
        revenue: Number(row.revenue || 0),
        tickets: Number(row.tickets || 0),
        averageRating: Number(row.averageRating || 0).toFixed(1),
        reviewCount: Number(row.reviewCount || 0),
      })),
      byDepartment: departmentRows.map((row) => ({
        department: row.department,
        bookings: Number(row.bookings || 0),
        revenue: Number(row.revenue || 0),
      })),
      byDate: dateRows.map((row) => ({
        date: row.dateLabel,
        bookings: Number(row.bookings || 0),
        revenue: Number(row.revenue || 0),
      })),
    })
  } catch (error) {
    console.error(error)
    return response.status(500).json({ message: 'Unable to fetch analytics right now.' })
  }
})

const sendBookingEmail = async ({ to, name, eventName, ticketCount, totalAmount, bookingCode }) => {
  if (!mailTransport) {
    return
  }

  await mailTransport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `Payment Successful - ${eventName}`,
    html: `
      <h2>Hello ${name},</h2>
      <p>Your payment was successful.</p>
      <p>Your booking is now confirmed.</p>
      <ul>
        <li><strong>Booking Code:</strong> ${bookingCode}</li>
        <li><strong>Event:</strong> ${eventName}</li>
        <li><strong>Tickets:</strong> ${ticketCount}</li>
        <li><strong>Total:</strong> INR ${Number(totalAmount).toFixed(2)}</li>
      </ul>
      <p>Thank you for your payment.</p>
    `,
  })
}

app.post('/api/bookings', authRequired, roleRequired('user'), async (request, response) => {
  const { eventId, name, email, department, ticketCount, promoCode, selectedSeats } = request.body

  if (!eventId || !name || !email || !department || !ticketCount) {
    return response.status(400).json({ message: 'All fields are mandatory.' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response.status(400).json({ message: 'Email format is invalid.' })
  }
  if (!Number.isInteger(ticketCount) || ticketCount <= 0) {
    return response.status(400).json({ message: 'Ticket count must be positive.' })
  }
  const seatList = Array.isArray(selectedSeats) ? selectedSeats.map(normalizeSeatCode).filter(Boolean) : []
  const uniqueSeatList = [...new Set(seatList)]
  if (uniqueSeatList.length > 0) {
    if (uniqueSeatList.length !== ticketCount) {
      return response.status(400).json({ message: 'Select exactly one seat per ticket.' })
    }
    if (!uniqueSeatList.every(isSeatCodeValid)) {
      return response.status(400).json({ message: 'Seat format is invalid.' })
    }
  }

  let connection
  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()

    const [events] = await connection.query(
      `SELECT id, event_name, ticket_price, available_tickets, total_seats
       FROM events
       WHERE id = ?
       FOR UPDATE`,
      [eventId]
    )
    if (events.length === 0) {
      await connection.rollback()
      return response.status(404).json({ message: 'Event not found.' })
    }
    const event = events[0]
    const maxSeatCapacity = Number(event.total_seats || 200)
    if (uniqueSeatList.some((seat) => {
      const value = Number(seat.match(/\d+$/)?.[0] || 0)
      return value <= 0 || value > maxSeatCapacity
    })) {
      await connection.rollback()
      return response.status(400).json({ message: 'One or more selected seats are outside event seat map.' })
    }

    if (uniqueSeatList.length > 0) {
      const [reservedRows] = await connection.query(
        `SELECT seat_numbers
         FROM bookings
         WHERE event_id = ?
           AND status IN ('paid', 'pending_payment')
           AND seat_numbers IS NOT NULL`,
        [event.id]
      )
      const reservedSet = new Set()
      for (const row of reservedRows) {
        for (const seat of String(row.seat_numbers || '').split(',').map(normalizeSeatCode).filter(Boolean)) {
          reservedSet.add(seat)
        }
      }
      const alreadyTaken = uniqueSeatList.filter((seat) => reservedSet.has(seat))
      if (alreadyTaken.length > 0) {
        await connection.rollback()
        return response.status(409).json({ message: `Seats already booked: ${alreadyTaken.join(', ')}` })
      }
    }
    if (ticketCount > event.available_tickets) {
      await connection.rollback()
      return response.status(400).json({
        message: `Only ${event.available_tickets} tickets are available right now.`,
      })
    }

    let discountPercentage = 0
    let promoId = null
    if (promoCode) {
      const [promos] = await connection.query(
        `SELECT id, discount_percentage, max_uses, uses, valid_until FROM promo_codes WHERE code = ? FOR UPDATE`,
        [promoCode.toUpperCase()]
      )
      if (promos.length > 0) {
        const promo = promos[0]
        if (promo.uses < promo.max_uses && (!promo.valid_until || new Date() <= new Date(promo.valid_until))) {
          discountPercentage = promo.discount_percentage
          promoId = promo.id
        }
      }
    }

    const baseAmount = Number(event.ticket_price) * ticketCount
    const totalAmount = baseAmount - (baseAmount * discountPercentage / 100)
    const bookingCode = `TB${Date.now().toString(36).toUpperCase()}`

    const [inserted] = await connection.query(
      `INSERT INTO bookings (event_id, user_id, booking_code, user_name, email, user_department, ticket_count, total_amount, status, seat_numbers)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?)`,
      [event.id, request.user.id, bookingCode, name, email, department, ticketCount, totalAmount, uniqueSeatList.join(',')]
    )

    if (promoId) {
      await connection.query(`UPDATE promo_codes SET uses = uses + 1 WHERE id = ?`, [promoId])
    }

    await connection.query(
      'UPDATE events SET available_tickets = available_tickets - ? WHERE id = ?',
      [ticketCount, event.id]
    )
    await connection.commit()

    const [updated] = await connection.query(
      'SELECT available_tickets FROM events WHERE id = ?',
      [event.id]
    )

    sendBookingEmail({
      to: email,
      name,
      eventName: event.event_name,
      ticketCount,
      totalAmount,
      bookingCode,
    }).catch((error) => console.error('Email error:', error.message))

    return response.status(201).json({
      bookingId: inserted.insertId,
      bookingCode,
      message: 'Booking confirmed.',
      eventName: event.event_name,
      totalAmount,
      status: 'paid',
      availableTickets: updated[0].available_tickets,
      seats: uniqueSeatList,
    })
  } catch (error) {
    if (connection) {
      await connection.rollback()
    }
    console.error(error)
    return response.status(500).json({ message: 'Unable to complete booking.' })
  } finally {
    if (connection) {
      connection.release()
    }
  }
})

app.post('/api/admin/checkin', authRequired, adminRequired, async (request, response) => {
  const { bookingCode } = request.body
  if (!bookingCode) {
    return response.status(400).json({ message: 'Booking code is required.' })
  }

  try {
    const [rows] = await pool.query(
      `SELECT id, status, is_checked_in, user_name, event_id FROM bookings WHERE booking_code = ? LIMIT 1`,
      [bookingCode]
    )

    if (rows.length === 0) {
      return response.status(404).json({ message: 'Booking not found.' })
    }

    const booking = rows[0]

    if (booking.status === 'cancelled') {
      return response.status(400).json({ message: 'This booking has been cancelled.' })
    }
    if (booking.status !== 'paid') {
      return response.status(400).json({ message: 'This booking is not paid.' })
    }
    if (booking.is_checked_in) {
      return response.status(400).json({ message: 'User is already checked in.' })
    }

    await pool.query(
      `UPDATE bookings SET is_checked_in = TRUE, check_in_time = NOW() WHERE id = ?`,
      [booking.id]
    )

    return response.json({ message: 'Checked in successfully.', userName: booking.user_name })
  } catch (error) {
    console.error('Check-in error:', error)
    return response.status(500).json({ message: 'Unable to check in.' })
  }
})

app.post('/api/events/:id/reviews', authRequired, roleRequired('user'), async (request, response) => {
  const eventId = Number(request.params.id)
  const { rating, feedbackText } = request.body

  if (!rating || rating < 1 || rating > 5) {
    return response.status(400).json({ message: 'Rating must be between 1 and 5.' })
  }
  if (isNaN(eventId)) {
    return response.status(400).json({ message: 'Invalid event ID.' })
  }

  try {
    const [bookings] = await pool.query(
      `SELECT id FROM bookings WHERE event_id = ? AND user_id = ? AND status = 'paid' LIMIT 1`,
      [eventId, request.user.id]
    )
    if (bookings.length === 0) {
      return response.status(403).json({ message: 'You can only review events you have booked.' })
    }

    const [existing] = await pool.query(
      `SELECT id FROM reviews WHERE event_id = ? AND user_id = ? LIMIT 1`,
      [eventId, request.user.id]
    )
    if (existing.length > 0) {
      return response.status(400).json({ message: 'You have already reviewed this event.' })
    }

    await pool.query(
      `INSERT INTO reviews (event_id, user_id, rating, feedback_text) VALUES (?, ?, ?, ?)`,
      [eventId, request.user.id, rating, feedbackText || '']
    )

    return response.status(201).json({ message: 'Review submitted successfully.' })
  } catch (error) {
    console.error('Review error:', error)
    return response.status(500).json({ message: 'Unable to submit review.' })
  }
})

app.get('/api/events/:id/reviews', authRequired, async (request, response) => {
  const eventId = Number(request.params.id)
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.rating, r.feedback_text, r.created_at, u.full_name
       FROM reviews r
       INNER JOIN users u ON u.id = r.user_id
       WHERE r.event_id = ?
       ORDER BY r.created_at DESC`,
      [eventId]
    )
    return response.json(rows)
  } catch (error) {
    console.error('Fetch reviews error:', error)
    return response.status(500).json({ message: 'Unable to fetch reviews.' })
  }
})

app.get('/api/events/:id/attendees', authRequired, adminRequired, async (request, response) => {
  const eventId = Number(request.params.id)
  try {
    const [rows] = await pool.query(
      `SELECT id, user_name, email, user_department, booking_code, is_checked_in, check_in_time, ticket_count
       FROM bookings
       WHERE event_id = ? AND status = 'paid'
       ORDER BY booked_at DESC`,
      [eventId]
    )
    return response.json(rows)
  } catch (error) {
    console.error('Fetch attendees error:', error)
    return response.status(500).json({ message: 'Unable to fetch attendees.' })
  }
})

app.post('/api/admin/promos', authRequired, adminRequired, async (request, response) => {
  const { code, discountPercentage, maxUses, validUntil } = request.body
  if (!code || !discountPercentage || discountPercentage <= 0 || discountPercentage > 100) {
    return response.status(400).json({ message: 'Valid code and discount percentage are required.' })
  }
  try {
    const validUntilDate = validUntil ? new Date(validUntil) : null
    await pool.query(
      `INSERT INTO promo_codes (code, discount_percentage, max_uses, valid_until) VALUES (?, ?, ?, ?)`,
      [code.toUpperCase(), discountPercentage, maxUses || 100, validUntilDate]
    )
    return response.status(201).json({ message: 'Promo code created.' })
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return response.status(400).json({ message: 'Promo code already exists.' })
    }
    console.error('Create promo error:', error)
    return response.status(500).json({ message: 'Unable to create promo code.' })
  }
})

app.get('/api/admin/promos', authRequired, adminRequired, async (request, response) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM promo_codes ORDER BY created_at DESC`)
    return response.json(rows)
  } catch (error) {
    return response.status(500).json({ message: 'Unable to fetch promo codes.' })
  }
})

app.post('/api/promos/validate', authRequired, async (request, response) => {
  const { code } = request.body
  if (!code) return response.status(400).json({ message: 'Code is required.' })

  try {
    const [rows] = await pool.query(
      `SELECT discount_percentage, max_uses, uses, valid_until FROM promo_codes WHERE code = ? LIMIT 1`,
      [code.toUpperCase()]
    )
    if (rows.length === 0) return response.status(404).json({ message: 'Invalid promo code.' })
    
    const promo = rows[0]
    if (promo.uses >= promo.max_uses) return response.status(400).json({ message: 'Promo code usage limit reached.' })
    if (promo.valid_until && new Date() > new Date(promo.valid_until)) {
      return response.status(400).json({ message: 'Promo code has expired.' })
    }

    return response.json({ discountPercentage: promo.discount_percentage })
  } catch (error) {
    return response.status(500).json({ message: 'Unable to validate promo code.' })
  }
})

app.post('/api/events/:id/waitlist', authRequired, roleRequired('user'), async (request, response) => {
  const eventId = Number(request.params.id)
  const { ticketCount } = request.body

  if (!Number.isInteger(ticketCount) || ticketCount <= 0) {
    return response.status(400).json({ message: 'Ticket count must be positive.' })
  }

  try {
    const [events] = await pool.query(`SELECT available_tickets FROM events WHERE id = ?`, [eventId])
    if (events.length === 0) return response.status(404).json({ message: 'Event not found.' })
    
    if (events[0].available_tickets > 0) {
      return response.status(400).json({ message: 'Tickets are currently available. Please book directly.' })
    }

    const [existing] = await pool.query(
      `SELECT id FROM waitlist WHERE event_id = ? AND user_id = ? AND status = 'waiting' LIMIT 1`,
      [eventId, request.user.id]
    )
    if (existing.length > 0) {
      return response.status(400).json({ message: 'You are already on the waitlist for this event.' })
    }

    await pool.query(
      `INSERT INTO waitlist (event_id, user_id, ticket_count) VALUES (?, ?, ?)`,
      [eventId, request.user.id, ticketCount]
    )
    return response.status(201).json({ message: 'Joined waitlist successfully.' })
  } catch (error) {
    console.error('Waitlist error:', error)
    return response.status(500).json({ message: 'Unable to join waitlist.' })
  }
})

app.post('/api/bookings/:id/pay', authRequired, async (request, response) => {
  const bookingId = Number(request.params.id)
  try {
    const [bookings] = await pool.query(
      `SELECT id, status FROM bookings WHERE id = ? AND user_id = ? FOR UPDATE`,
      [bookingId, request.user.id]
    )
    if (bookings.length === 0) return response.status(404).json({ message: 'Booking not found.' })
    if (bookings[0].status !== 'pending_payment') {
      return response.status(400).json({ message: 'This booking is not pending payment.' })
    }

    await pool.query(`UPDATE bookings SET status = 'paid', booked_at = NOW() WHERE id = ?`, [bookingId])
    return response.json({ message: 'Payment successful.' })
  } catch (error) {
    return response.status(500).json({ message: 'Payment failed.' })
  }
})

app.get('/api/events/:id/seats', authRequired, async (request, response) => {
  const eventId = Number(request.params.id)
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return response.status(400).json({ message: 'Invalid event id.' })
  }
  try {
    const [events] = await pool.query(
      'SELECT id, total_seats FROM events WHERE id = ? LIMIT 1',
      [eventId]
    )
    if (events.length === 0) {
      return response.status(404).json({ message: 'Event not found.' })
    }
    const [rows] = await pool.query(
      `SELECT seat_numbers
       FROM bookings
       WHERE event_id = ?
         AND status IN ('paid', 'pending_payment')
         AND seat_numbers IS NOT NULL`,
      [eventId]
    )
    const takenSeats = []
    for (const row of rows) {
      takenSeats.push(
        ...String(row.seat_numbers || '')
          .split(',')
          .map(normalizeSeatCode)
          .filter(Boolean)
      )
    }
    return response.json({
      eventId,
      totalSeats: Number(events[0].total_seats || 200),
      takenSeats: [...new Set(takenSeats)],
    })
  } catch (error) {
    console.error('Fetch seats error:', error)
    return response.status(500).json({ message: 'Unable to fetch seat map.' })
  }
})

app.get('/api/users/me', authRequired, async (request, response) => {
  try {
    const [users] = await pool.query(
      `SELECT id, full_name, email, department, role, created_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [request.user.id]
    )
    if (users.length === 0) {
      return response.status(404).json({ message: 'User not found.' })
    }
    const [bookingStats] = await pool.query(
      `SELECT COUNT(*) AS totalBookings,
              SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) AS totalSpent,
              SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelledBookings
       FROM bookings
       WHERE user_id = ?`,
      [request.user.id]
    )
    return response.json({
      ...users[0],
      stats: {
        totalBookings: Number(bookingStats[0].totalBookings || 0),
        totalSpent: Number(bookingStats[0].totalSpent || 0),
        cancelledBookings: Number(bookingStats[0].cancelledBookings || 0),
      },
    })
  } catch (error) {
    console.error('Profile error:', error)
    return response.status(500).json({ message: 'Unable to fetch profile.' })
  }
})

app.patch('/api/users/me', authRequired, async (request, response) => {
  const fullName = String(request.body.fullName || '').trim()
  const department = String(request.body.department || '').trim()
  if (!fullName || !department) {
    return response.status(400).json({ message: 'Full name and department are required.' })
  }
  try {
    await pool.query(
      'UPDATE users SET full_name = ?, department = ? WHERE id = ?',
      [fullName, department, request.user.id]
    )
    return response.json({ message: 'Profile updated successfully.' })
  } catch (error) {
    console.error('Profile update error:', error)
    return response.status(500).json({ message: 'Unable to update profile.' })
  }
})

app.get('/api/admin/refunds', authRequired, adminRequired, async (_request, response) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.id, b.booking_code, b.user_name, b.email, b.refund_amount, b.refund_status, b.refund_reference, b.cancelled_at,
              e.event_name
       FROM bookings b
       INNER JOIN events e ON e.id = b.event_id
       WHERE b.status = 'cancelled'
       ORDER BY b.cancelled_at DESC`
    )
    return response.json(rows)
  } catch (error) {
    console.error('Refund list error:', error)
    return response.status(500).json({ message: 'Unable to fetch refund requests.' })
  }
})

app.patch('/api/admin/refunds/:id', authRequired, adminRequired, async (request, response) => {
  const bookingId = Number(request.params.id)
  const refundStatus = String(request.body.refundStatus || '').trim()
  const refundReference = String(request.body.refundReference || '').trim().slice(0, 120)
  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return response.status(400).json({ message: 'Invalid booking id.' })
  }
  if (!VALID_REFUND_STATUSES.has(refundStatus)) {
    return response.status(400).json({ message: 'Invalid refund status.' })
  }
  try {
    const [result] = await pool.query(
      `UPDATE bookings
       SET refund_status = ?,
           refund_reference = ?,
           refunded_at = CASE WHEN ? = 'processed' THEN NOW() ELSE refunded_at END
       WHERE id = ? AND status = 'cancelled'`,
      [refundStatus, refundReference || null, refundStatus, bookingId]
    )
    if (result.affectedRows === 0) {
      return response.status(404).json({ message: 'Cancelled booking not found.' })
    }
    return response.json({ message: 'Refund status updated.' })
  } catch (error) {
    console.error('Refund update error:', error)
    return response.status(500).json({ message: 'Unable to update refund status.' })
  }
})

app.get('/api/bookings/:id/receipt', authRequired, async (request, response) => {
  const bookingId = Number(request.params.id)
  try {
    const [rows] = await pool.query(
      `SELECT b.id, b.user_id, b.booking_code, b.user_name, b.email, b.user_department, b.ticket_count, b.total_amount, b.status, b.booked_at,
              e.event_name, e.venue, e.event_date_time
       FROM bookings b
       INNER JOIN events e ON e.id = b.event_id
       WHERE b.id = ?`,
      [bookingId]
    )

    if (rows.length === 0) {
      return response.status(404).json({ message: 'Booking not found.' })
    }

    const booking = rows[0]
    if (request.user.role !== 'admin' && request.user.id !== booking.user_id) {
      return response.status(403).json({ message: 'Not allowed to access this receipt.' })
    }
    if (booking.status !== 'paid') {
      return response.status(400).json({ message: 'Receipt can be downloaded only for paid bookings.' })
    }

    response.setHeader('Content-Type', 'application/pdf')
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="receipt-${booking.booking_code}.pdf"`
    )

    const qrDataUrl = await qrcode.toDataURL(booking.booking_code)

    const doc = new pdfkit({ margin: 40 })
    doc.pipe(response)
    doc.fontSize(22).fillColor('#5B21B6').text('Ticket Booking Receipt')
    doc.moveDown()
    
    doc.image(qrDataUrl, doc.page.width - 140, 40, { width: 100 })

    doc.fontSize(12).fillColor('#111827').text(`Booking Code: ${booking.booking_code}`)
    doc.text(`Booked By: ${booking.user_name}`)
    doc.text(`Email: ${booking.email}`)
    doc.text(`Department: ${booking.user_department}`)
    doc.moveDown()
    doc.text(`Event: ${booking.event_name}`)
    doc.text(`Venue: ${booking.venue}`)
    doc.text(`Event Date: ${new Date(booking.event_date_time).toLocaleString()}`)
    doc.moveDown()
    doc.text(`Tickets: ${booking.ticket_count}`)
    doc.text(`Total Amount: INR ${Number(booking.total_amount).toFixed(2)}`)
    doc.text(`Booked At: ${new Date(booking.booked_at).toLocaleString()}`)
    doc.end()
  } catch (error) {
    console.error(error)
    return response.status(500).json({ message: 'Unable to generate receipt.' })
  }
})

const startServer = async () => {
  try {
    await ensureBookingColumns()
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Startup failed:', error)
    process.exit(1)
  }
}

startServer()
