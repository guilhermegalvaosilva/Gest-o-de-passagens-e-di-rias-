export function Message({ message }) {
  if (!message) return null;

  const tone = message.type === "error" ? "error" : message.type === "warning" ? "warning" : "";
  return <div className={`message ${tone}`}>{message.text}</div>;
}
