const LoadingSkeleton = ({ rows = 3 }) => {
  return (
    <section className="card">
      <div className="skeleton skeleton-title" />
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton skeleton-line" />
      ))}
    </section>
  )
}

export default LoadingSkeleton

