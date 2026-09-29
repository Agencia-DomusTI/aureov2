import './AdminPanel.css';

const DOCTORALIA_URL = 'https://www.doctoralia.com.mx/perfil/demetrio-quintero-marmol-cisneros';

/** Panel admin en pausa: la agenda en línea se maneja desde Doctoralia. */
const AdminIdle = () => (
  <div className="admin admin--login">
    <div className="admin-login-card">
      <img src="/logosin.png" alt="Áureo Clinique" className="admin-login-logo" />
      <h1>Panel en pausa</h1>
      <p>
        Las citas en línea ahora se gestionan desde Doctoralia. Este panel está inactivo por el
        momento.
      </p>
      <a href={DOCTORALIA_URL} className="btn-primary" target="_blank" rel="noopener noreferrer">
        Ir a Doctoralia
      </a>
      <a href="/" className="admin-back">← Volver al sitio</a>
    </div>
  </div>
);

export default AdminIdle;
