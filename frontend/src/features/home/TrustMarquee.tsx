import './TrustMarquee.css';

const CLIENTS = ['DajDaj', 'WestAgroLand', 'Marmosters', 'Agronix', 'Cebalt', 'Valtex', 'Respol'];

function TrackItems() {
  return (
    <>
      {CLIENTS.map(name => (
        <span key={name} className="tm-item">
          <span className="tm-name">{name}</span>
          <span className="tm-dot" aria-hidden="true" />
        </span>
      ))}
    </>
  );
}

export default function TrustMarquee() {
  return (
    <section className="tm-section" aria-label="Our clients">
      <div className="tm-eyebrow">
        <span className="tm-eyebrow-line" />
        <span className="tm-eyebrow-text">trusted by</span>
        <span className="tm-eyebrow-line" />
      </div>

      <div className="tm-marquee-wrap">
        <div className="tm-fade tm-fade-left"  aria-hidden="true" />
        <div className="tm-fade tm-fade-right" aria-hidden="true" />
        <div className="tm-track" aria-hidden="true">
          <TrackItems /><TrackItems /><TrackItems />
        </div>
      </div>
    </section>
  );
}