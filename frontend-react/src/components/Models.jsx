import { MODELS } from '../config'
import './Models.css'

export default function Models() {
  return (
    <section className="section" id="models">
      <div className="section-header">
        <h2>Model Pricing</h2>
        <p>Pay per call. No subscriptions.</p>
      </div>
      <div className="models-table">
        <div className="models-head">
          <span>Model</span><span>Provider</span><span>Price/Call</span>
        </div>
        {MODELS.map(([name, provider, price, type]) => (
          <div key={name} className="model-row">
            <span className="model-name">{name}</span>
            <span className={`provider-badge ${type}`}>{provider}</span>
            <span className="model-price">${price.toFixed(3)}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
