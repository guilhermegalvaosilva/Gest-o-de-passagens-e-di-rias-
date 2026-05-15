export function FormSection({ number, title, accent, children }) {
  return (
    <section className={`form-section ${accent ? "accent-section" : ""}`}>
      <h3>
        <span>{number}</span>
        {title}
      </h3>
      <div className="form-grid">{children}</div>
    </section>
  );
}

export function Input({ label, name, value, setField, full, required, ...props }) {
  return (
    <div className={`form-group ${full ? "full" : ""}`}>
      <label>
        {label} {required && <span className="required">*</span>}
      </label>
      <input
        name={name}
        value={value || ""}
        onChange={(event) => setField(name, event.target.value)}
        required={required}
        {...props}
      />
    </div>
  );
}

export function TextArea({ label, name, value, setField, full, required }) {
  return (
    <div className={`form-group ${full ? "full" : ""}`}>
      <label>
        {label} {required && <span className="required">*</span>}
      </label>
      <textarea
        name={name}
        value={value || ""}
        onChange={(event) => setField(name, event.target.value)}
        required={required}
      />
    </div>
  );
}

export function Select({ label, name, value, setField, options, required }) {
  return (
    <div className="form-group">
      <label>
        {label} {required && <span className="required">*</span>}
      </label>
      <select
        name={name}
        value={value || ""}
        onChange={(event) => setField(name, event.target.value)}
        required={required}
      >
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}
