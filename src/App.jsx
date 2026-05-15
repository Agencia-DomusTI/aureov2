import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Ticker from './components/Ticker';
import About from './components/About';
import ParallaxBand from './components/ParallaxBand';
import Services from './components/Services';
import Contact from './components/Contact';
import Footer from './components/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';

function App() {
  return (
    <div className="App">
      <Navbar />
      <main>
        <Hero />
        <Ticker />
        <About />
        <ParallaxBand />
        <Services />
        <Contact />
      </main>
      <FloatingWhatsApp />
      <Footer />
    </div>
  );
}

export default App;
