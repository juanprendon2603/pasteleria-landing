export default function Footer() {
  return (
    <footer>
      <div className="container" style={{paddingTop: 20, paddingBottom: 24}}>
        <p className="muted">© {new Date().getFullYear()} Pastelería. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}
