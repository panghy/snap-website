import { useState } from 'react'
import Header from './components/Header'
import HeroSection from './components/HeroSection'
import ProblemSection from './components/ProblemSection'
import SolutionSection from './components/SolutionSection'
import SnapSection from './components/SnapSection'
import Footer from './components/Footer'
import { CataloguePage } from './components/catalogue/CataloguePage'
import './App.css'

function App() {
  const [showCatalogue, setShowCatalogue] = useState(false)
  const [catalogueFilter, setCatalogueFilter] = useState<{ language?: string }>()

  const handleNavigate = (page: 'catalogue', filter?: { language?: string }) => {
    if (page === 'catalogue') {
      setShowCatalogue(true)
      setCatalogueFilter(filter)
    }
  }

  return (
    <div className="app">
      <Header
        onCatalogueClick={() => {
          setShowCatalogue(true)
          setCatalogueFilter(undefined)
        }}
        onHomeClick={() => setShowCatalogue(false)}
        isLightTheme={showCatalogue}
      />
      {showCatalogue ? (
        <>
          <CataloguePage initialFilter={catalogueFilter} />
          <Footer onNavigate={handleNavigate} isLightTheme={true} />
        </>
      ) : (
        <>
          <HeroSection />
          <SnapSection />
          <ProblemSection />
          <SolutionSection />
          <Footer onNavigate={handleNavigate} />
        </>
      )}
    </div>
  )
}

export default App