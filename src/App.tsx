import Header from './components/Header'
import HeroSection from './components/HeroSection'
import ProblemSection from './components/ProblemSection'
import SolutionSection from './components/SolutionSection'
import SnapSection from './components/SnapSection'
import Footer from './components/Footer'
import './App.css'

function App() {
  return (
    <div className="app">
      <Header />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <SnapSection />
      <Footer />
    </div>
  )
}

export default App