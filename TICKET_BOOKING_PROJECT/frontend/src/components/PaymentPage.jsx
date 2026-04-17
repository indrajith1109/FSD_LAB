import { useState } from 'react'

const PaymentPage = ({ draft, onBack, onComplete }) => {
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    nameOnCard: '',
  })
  const [errors, setErrors] = useState({})
  const [processing, setProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const validate = () => {
    const nextErrors = {}

    const cardNumber = paymentData.cardNumber.replace(/\s+/g, '')
    if (!cardNumber || !/^\d+$/.test(cardNumber) || cardNumber.length < 12) {
      nextErrors.cardNumber = 'Enter a valid card number.'
    }

    const expiry = paymentData.expiry.trim()
    if (!expiry || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      nextErrors.expiry = 'Expiry must be in MM/YY format.'
    }

    const cvv = paymentData.cvv.trim()
    if (!cvv || !/^\d{3,4}$/.test(cvv)) {
      nextErrors.cvv = 'CVV must be 3 or 4 digits.'
    }

    const nameOnCard = paymentData.nameOnCard.trim()
    if (!nameOnCard) {
      nextErrors.nameOnCard = 'Name on card is required.'
    }

    return nextErrors
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setProcessing(true)
    try {
      // Demo payment: payment details are validated locally, and we confirm booking
      // after clicking "Pay & Confirm".
      await onComplete(paymentData)
    } catch (err) {
      setErrorMessage(err?.message || 'Payment confirmation failed.')
      setProcessing(false)
    }
  }

  return (
    <main className="app-shell">
      <nav className="navbar">
        <div className="nav-brand">EventHub</div>
        <div className="nav-actions">
          <button className="ghost" onClick={onBack} type="button">
            Back
          </button>
        </div>
      </nav>

      <section className="content-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(280px, 1fr))' }}>
        <article className="card">
          <h2>Review Booking</h2>
          <div className="details-list">
            <p>
              <span>Event</span>
              <strong>{draft.eventName}</strong>
            </p>
            <p>
              <span>Tickets</span>
              <strong>{draft.ticketCount}</strong>
            </p>
            <p>
              <span>Total</span>
              <strong>INR {Number(draft.totalAmount).toFixed(2)}</strong>
            </p>
            <p>
              <span>Guest</span>
              <strong>{draft.name}</strong>
            </p>
          </div>
          <div className="availability-tag" style={{ marginTop: '1rem' }}>
            Payment details below are for simulation/demo.
          </div>
        </article>

        <article className="card">
          <h2>Payment</h2>
          <form onSubmit={onSubmit} className="booking-form" noValidate>
            <label>
              Card Number
              <input
                type="text"
                inputMode="numeric"
                value={paymentData.cardNumber}
                onChange={(event) =>
                  setPaymentData((prev) => ({ ...prev, cardNumber: event.target.value }))
                }
                placeholder="1234 5678 9012 3456"
              />
              {errors.cardNumber && <small className="error">{errors.cardNumber}</small>}
            </label>

            <label>
              Expiry (MM/YY)
              <input
                type="text"
                value={paymentData.expiry}
                onChange={(event) =>
                  setPaymentData((prev) => ({ ...prev, expiry: event.target.value }))
                }
                placeholder="MM/YY"
              />
              {errors.expiry && <small className="error">{errors.expiry}</small>}
            </label>

            <label>
              CVV
              <input
                type="password"
                inputMode="numeric"
                value={paymentData.cvv}
                onChange={(event) => setPaymentData((prev) => ({ ...prev, cvv: event.target.value }))}
                placeholder="123"
              />
              {errors.cvv && <small className="error">{errors.cvv}</small>}
            </label>

            <label>
              Name on Card
              <input
                type="text"
                value={paymentData.nameOnCard}
                onChange={(event) =>
                  setPaymentData((prev) => ({ ...prev, nameOnCard: event.target.value }))
                }
                placeholder="Your name"
              />
              {errors.nameOnCard && <small className="error">{errors.nameOnCard}</small>}
            </label>

            {errorMessage && <p className="error-banner">{errorMessage}</p>}

            <div className="actions">
              <button type="submit" disabled={processing}>
                {processing ? 'Processing...' : 'Pay & Confirm'}
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  setPaymentData({ cardNumber: '', expiry: '', cvv: '', nameOnCard: '' })
                  setErrors({})
                  setErrorMessage('')
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </article>
      </section>
    </main>
  )
}

export default PaymentPage

