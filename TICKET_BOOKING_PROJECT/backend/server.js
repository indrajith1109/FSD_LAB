const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
const PDFDocument = require('pdfkit')
const pool = require('./db')
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
  ]

  for (const migration of migrations) {
    if (!existing.has(migration.name)) {
      await pool.query(migration.sql)
    }
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

app.get('/api/events-public', authRequired, async (_request, response) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, event_name, department_name, event_date_time, venue, ticket_price, available_tickets
       FROM events
       ORDER BY event_date_time DESC`
    )

    return response.json(
      rows.map((event) => ({
        id: event.id,
        eventName: event.event_name,
        departmentName: event.department_name,
        eventDateTime: event.event_date_time,
        venue: event.venue,
        ticketPrice: Number(event.ticket_price),
        availableTickets: event.available_tickets,
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
      `SELECT id, event_name, department_name, event_date_time, venue, ticket_price, available_tickets
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
      departmentName: event.department_name,
      eventDateTime: event.event_date_time,
      venue: event.venue,
      ticketPrice: Number(event.ticket_price),
      availableTickets: event.available_tickets,
    })
  } catch (error) {
    console.error(error)
    return response.status(500).json({ message: 'Failed to fetch event details.' })
  }
})

app.get('/api/events', authRequired, adminRequired, async (_request, response) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, event_name, department_name, event_date_time, venue, ticket_price, available_tickets
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
  const { eventName, departmentName, eventDateTime, venue, ticketPrice, availableTickets } =
    request.body
  if (
    !eventName ||
    !departmentName ||
    !eventDateTime ||
    !venue ||
    Number(ticketPrice) <= 0 ||
    Number(availableTickets) < 0
  ) {
    return response.status(400).json({ message: 'All event fields are mandatory.' })
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO events (event_name, department_name, event_date_time, venue, ticket_price, available_tickets)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [eventName, departmentName, eventDateTime, venue, ticketPrice, availableTickets]
    )
    return response.status(201).json({ id: result.insertId })
  } catch (error) {
    console.error(error)
    return response.status(500).json({ message: 'Unable to create event.' })
  }
})

app.put('/api/events/:id', authRequired, adminRequired, async (request, response) => {
  const { id } = request.params
  const { eventName, departmentName, eventDateTime, venue, ticketPrice, availableTickets } =
    request.body
  try {
    await pool.query(
      `UPDATE events
       SET event_name = ?, department_name = ?, event_date_time = ?, venue = ?, ticket_price = ?, available_tickets = ?
       WHERE id = ?`,
      [eventName, departmentName, eventDateTime, venue, ticketPrice, availableTickets, id]
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
      `SELECT b.id, b.booking_code, b.user_name, b.email, b.user_department, b.ticket_count, b.total_amount, b.status,
              b.refund_amount, b.cancelled_at, b.cancellation_reason, b.booked_at, e.event_name, e.event_date_time
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
           cancelled_at = NOW(),
           cancellation_reason = ?
       WHERE id = ?`,
      [refundAmount, cancellationReason, booking.id]
    )

    await connection.query('UPDATE events SET available_tickets = available_tickets + ? WHERE id = ?', [
      booking.ticket_count,
      booking.event_id,
    ])

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
      `SELECT e.event_name AS eventName,
              SUM(CASE WHEN b.status = 'paid' THEN b.total_amount ELSE 0 END) AS revenue,
              SUM(CASE WHEN b.status = 'paid' THEN b.ticket_count ELSE 0 END) AS tickets
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
  const { eventId, name, email, department, ticketCount } = request.body

  if (!eventId || !name || !email || !department || !ticketCount) {
    return response.status(400).json({ message: 'All fields are mandatory.' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response.status(400).json({ message: 'Email format is invalid.' })
  }
  if (!Number.isInteger(ticketCount) || ticketCount <= 0) {
    return response.status(400).json({ message: 'Ticket count must be positive.' })
  }

  let connection
  try {
    connection = await pool.getConnection()
    await connection.beginTransaction()

    const [events] = await connection.query(
      `SELECT id, event_name, ticket_price, available_tickets
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
    if (ticketCount > event.available_tickets) {
      await connection.rollback()
      return response.status(400).json({
        message: `Only ${event.available_tickets} tickets are available right now.`,
      })
    }

    const totalAmount = Number(event.ticket_price) * ticketCount
    const bookingCode = `TB${Date.now().toString(36).toUpperCase()}`

    const [inserted] = await connection.query(
      `INSERT INTO bookings (event_id, user_id, booking_code, user_name, email, user_department, ticket_count, total_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid')`,
      [event.id, request.user.id, bookingCode, name, email, department, ticketCount, totalAmount]
    )

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

    const doc = new PDFDocument({ margin: 40 })
    doc.pipe(response)
    doc.fontSize(22).fillColor('#5B21B6').text('Ticket Booking Receipt')
    doc.moveDown()
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
