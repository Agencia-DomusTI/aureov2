import React, { useState } from 'react';
import './Services.css';

const servicesData = {
  wellness: {
    title: "Medicina Wellness",
    items: [
      { 
        name: "Presoterapia", 
        desc: "Tratamiento médico y estético que utiliza la presión de aire para realizar un drenaje linfático. Mejora la circulación, reduce la retención de líquidos y ayuda a eliminar toxinas.",
        img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=500"
      },
      { 
        name: "Facial Médico", 
        desc: "Limpieza profunda de grado médico que exfolia y renueva las capas superficiales de la piel, extrayendo impurezas y nutriendo con sueros especializados.",
        img: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80&w=500"
      },
      { 
        name: "Hidrafacial", 
        desc: "Tecnología patentada Vortex-Fusion que limpia, extrae e hidrata. Resultados inmediatos de luminosidad y revitalización sin tiempo de recuperación.",
        img: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=500"
      },
      { 
        name: "Criolipólisis", 
        desc: "Procedimiento no invasivo que elimina grasa localizada mediante la aplicación controlada de frío, destruyendo las células grasas de forma natural.",
        img: "https://images.unsplash.com/photo-1579152276506-5d5ef24c9a49?auto=format&fit=crop&q=80&w=500"
      },
      { 
        name: "Cámara Hiperbárica", 
        desc: "Oxigenoterapia al 100% en ambiente presurizado. Acelera la cicatrización, regenera tejidos y potencia los resultados de cualquier tratamiento médico.",
        img: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=500"
      },
      { 
        name: "Radiofrecuencia Fraccionada", 
        desc: "Estimula la producción de colágeno y elastina mediante calor profundo. Ideal para tensar la piel, tratar cicatrices y mejorar la textura general.",
        img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=500"
      },
      { 
        name: "Ultrasonido Focalizado (HIFU)", 
        desc: "Lifting sin cirugía que utiliza ondas de ultrasonido para elevar y tensar el rostro, cuello y escote, trabajando en las capas profundas de la piel.",
        img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=500"
      },
      { 
        name: "Electromagnetismo (HIFEM)", 
        desc: "Tecnología que induce contracciones musculares supra-máximas. Ideal para tonificar músculos y quemar grasa de forma simultánea.",
        img: "https://images.unsplash.com/photo-1518459031867-a89b944bffe4?auto=format&fit=crop&q=80&w=500"
      },
      { 
        name: "Morpheus", 
        desc: "Radiofrecuencia fraccionada con microagujas que remodela el tejido subdérmico. El estándar de oro para flacidez severa y rejuvenecimiento profundo.",
        img: "https://images.unsplash.com/photo-1519415387722-a1c3bbef716c?auto=format&fit=crop&q=80&w=500"
      }
    ]
  },
  regenerativa: {
    title: "Medicina Regenerativa",
    items: [
      { name: "Sueroterapia", desc: "Infusión intravenosa de vitaminas y minerales para optimizar la salud celular.", img: "https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&q=80&w=500" },
      { name: "Células Madre", desc: "Terapia celular avanzada para regenerar tejidos y potenciar la longevidad.", img: "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=80&w=500" },
      { name: "Exosomas", desc: "Vesículas extracelulares que actúan como mensajeros celulares para la reparación profunda.", img: "https://images.unsplash.com/photo-1532187863486-abf9d39d9995?auto=format&fit=crop&q=80&w=500" },
      { name: "Ozonoterapia", desc: "Tratamiento sistémico con ozono médico para mejorar la oxigenación y el sistema inmune.", img: "https://images.unsplash.com/photo-1511174511562-5f7f18b874f8?auto=format&fit=crop&q=80&w=500" }
    ]
  },
  estetica: {
    title: "Medicina Estética",
    items: [
      { name: "Toxina Botulínica", desc: "Suaviza arrugas de expresión para un aspecto descansado y natural.", img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=500" },
      { name: "Rellenos (Fillers)", desc: "Ácido hialurónico para restaurar volúmenes y redefinir contornos faciales.", img: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80&w=500" },
      { name: "Hilos Tensores", desc: "Lifting mecánico inmediato y estimulación de colágeno a largo plazo.", img: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=500" },
      { name: "Bioestimuladores", desc: "Tratamientos inyectables que activan la producción natural de colágeno propio.", img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=500" }
    ]
  }
};

const Services = () => {
  const [activeTab, setActiveTab] = useState('wellness');
  const [selectedService, setSelectedService] = useState(null);

  return (
    <section className="services" id="servicios">
      <div className="container">
        <div className="services-header">
          <span className="subtitle">Nuestros Tratamientos</span>
          <h2>Excelencia en <span>Medicina Especializada</span></h2>
        </div>

        <div className="services-tabs">
          {Object.keys(servicesData).map((key) => (
            <button 
              key={key} 
              className={`tab-btn ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {servicesData[key].title}
            </button>
          ))}
        </div>

        <div className="services-grid">
          {servicesData[activeTab].items.map((service, index) => (
            <div 
              key={index} 
              className="service-card animate-fade" 
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => setSelectedService(service)}
            >
              <div className="card-image">
                <img src={service.img} alt={service.name} />
              </div>
              <div className="card-content">
                <span className="service-number">{(index + 1).toString().padStart(2, '0')}</span>
                <h3>{service.name}</h3>
                <span className="learn-more">Ver más →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedService && (
        <div className="modal-overlay" onClick={() => setSelectedService(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedService(null)}>&times;</button>
            <div className="modal-grid">
              <div className="modal-image">
                <img src={selectedService.img} alt={selectedService.name} />
              </div>
              <div className="modal-text">
                <span className="subtitle">{servicesData[activeTab].title}</span>
                <h2>{selectedService.name}</h2>
                <p>{selectedService.desc}</p>
                <a href="#contacto" className="btn-primary" onClick={() => setSelectedService(null)}>Agendar valoración</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Services;
