import { useEffect, useRef, useState } from 'react'

function ChatBotWidget({ onSend, disabled }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'bot',
      text: 'Hi! I am EventHub Assistant. Ask me about events, bookings, or refunds.',
    },
  ])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isLoading, isOpen])

  const handleSend = async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || disabled || isLoading) return

    const userMessage = { id: Date.now(), role: 'user', text: trimmed }
    setMessages((previous) => [...previous, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const result = await onSend(trimmed)
      setMessages((previous) => [
        ...previous,
        { id: Date.now() + 1, role: 'bot', text: result.reply || 'No response.' },
      ])
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 2,
          role: 'bot',
          text: error.message || 'Sorry, I could not process your request.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chatbot-shell">
      {isOpen && (
        <section className="chatbot-panel">
          <header className="chatbot-header">
            <strong>EventHub Assistant</strong>
            <button className="ghost" type="button" onClick={() => setIsOpen(false)}>
              Close
            </button>
          </header>
          <div className="chatbot-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chatbot-message ${
                  message.role === 'user' ? 'chatbot-message-user' : 'chatbot-message-bot'
                }`}
              >
                {message.text}
              </div>
            ))}
            {isLoading && <div className="chatbot-message chatbot-message-bot">Thinking...</div>}
            <span ref={messagesEndRef} />
          </div>
          <div className="chatbot-input-row">
            <input
              type="text"
              value={inputValue}
              placeholder="Ask something..."
              onChange={(eventObject) => setInputValue(eventObject.target.value)}
              onKeyDown={(eventObject) => {
                if (eventObject.key === 'Enter') {
                  eventObject.preventDefault()
                  handleSend()
                }
              }}
            />
            <button type="button" onClick={handleSend} disabled={isLoading || disabled}>
              Send
            </button>
          </div>
        </section>
      )}
      {!isOpen && (
        <button className="chatbot-fab" type="button" onClick={() => setIsOpen(true)} disabled={disabled}>
          Chat
        </button>
      )}
    </div>
  )
}

export default ChatBotWidget
