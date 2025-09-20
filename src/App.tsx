import { useState, useEffect } from 'react'
import Header from './components/Header'
import HeroSection from './components/HeroSection'
import ProblemSection from './components/ProblemSection'
import SolutionSection from './components/SolutionSection'
import SnapSection from './components/SnapSection'
import Footer from './components/Footer'
import { CataloguePage } from './components/catalogue/CataloguePage'
import './App.css'

function App() {
  // Check URL on initial load
  const initialShowCatalogue = window.location.pathname === '/catalogue' ||
                              window.location.search.includes('view=catalogue')

  const [showCatalogue, setShowCatalogue] = useState(initialShowCatalogue)
  const [catalogueFilter, setCatalogueFilter] = useState<{ language?: string }>()

  // Update URL when view changes
  useEffect(() => {
    const url = new URL(window.location.href)
    if (showCatalogue) {
      url.searchParams.set('view', 'catalogue')
    } else {
      url.searchParams.delete('view')
    }
    window.history.replaceState({}, '', url.toString())
  }, [showCatalogue])

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
          <HeroSection onExploreSNAPsClick={() => {
            setShowCatalogue(true);
            setCatalogueFilter(undefined);
          }} />
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