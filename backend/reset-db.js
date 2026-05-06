require('dotenv').config()
const mysql = require('mysql2/promise')

async function resetDatabase() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ticket_booking',
    port: Number(process.env.DB_PORT || 3306),
  })

  await conn.query('SET FOREIGN_KEY_CHECKS = 0')
  for (const table of ['waitlist', 'reviews', 'bookings', 'promo_codes', 'events', 'users']) {
    await conn.query(`TRUNCATE TABLE ${table}`)
  }
  await conn.query('SET FOREIGN_KEY_CHECKS = 1')

  await conn.query(
    'INSERT INTO users (full_name, email, department, role, password_hash) VALUES (?, ?, ?, ?, ?)',
    [
      'System Admin',
      'admin@college.edu',
      'Computer Science',
      'admin',
      '$2b$10$d1dvBj.NVgTf7ztKp22i9eiKIGXXkrc4QlO2wblBsT12vxSuFi6HG',
    ]
  )

  await conn.query(
    'INSERT INTO users (full_name, email, department, role, password_hash) VALUES (?, ?, ?, ?, ?)',
    [
      'Student User',
      'student@college.edu',
      'Electronics',
      'user',
      '$2b$10$U4.plE63Jt0LWXdFpXzFUeVZL60XRm3xEoJpm9/IvGbsgK0uVSR7C',
    ]
  )

  await conn.query(
    `INSERT INTO events
      (event_name, event_category, department_name, event_date_time, venue, ticket_price, available_tickets, total_seats)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'InnovateX Technical Fest 2026',
      'General',
      'Computer Science Department',
      '2026-05-10 10:00:00',
      'Main Seminar Hall',
      299.0,
      150,
      200,
    ]
  )

  const [userRows] = await conn.query('SELECT COUNT(*) AS count FROM users')
  const [eventRows] = await conn.query('SELECT COUNT(*) AS count FROM events')
  const [bookingRows] = await conn.query('SELECT COUNT(*) AS count FROM bookings')
  const [waitlistRows] = await conn.query('SELECT COUNT(*) AS count FROM waitlist')
  const [reviewRows] = await conn.query('SELECT COUNT(*) AS count FROM reviews')
  const [promoRows] = await conn.query('SELECT COUNT(*) AS count FROM promo_codes')

  await conn.end()
  console.log(
    `Database reset complete. users=${userRows[0].count}, events=${eventRows[0].count}, bookings=${bookingRows[0].count}, waitlist=${waitlistRows[0].count}, reviews=${reviewRows[0].count}, promos=${promoRows[0].count}`
  )
}

resetDatabase().catch((error) => {
  console.error('Database reset failed:', error)
  process.exit(1)
})
