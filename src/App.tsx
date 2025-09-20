import { useState, useEffect } from 'react'
import Header from './components/Header'
import HeroSection from './components/HeroSection'
import ProblemSection from './components/ProblemSection'
import SolutionSection from './components/SolutionSection'
import SnapSection from './components/SnapSection'
import Footer from './components/Footer'
import { CataloguePage } from './components/catalogue/CataloguePage'
import { SpecificationPage } from './components/specification/SpecificationPage'
import './App.css'

function App() {
  // Check URL on initial load
  const initialShowCatalogue = window.location.pathname === '/catalogue' ||
                              window.location.search.includes('view=catalogue')
  const initialShowSpecification = window.location.pathname === '/specification' ||
                                   window.location.search.includes('view=specification')

  const [showCatalogue, setShowCatalogue] = useState(initialShowCatalogue)
  const [showSpecification, setShowSpecification] = useState(initialShowSpecification)
  const [catalogueFilter, setCatalogueFilter] = useState<{ language?: string }>()

  // Update URL when view changes
  useEffect(() => {
    const url = new URL(window.location.href)
    if (showCatalogue) {
      url.searchParams.set('view', 'catalogue')
    } else if (showSpecification) {
      url.searchParams.set('view', 'specification')
    } else {
      url.searchParams.delete('view')
    }
    window.history.replaceState({}, '', url.toString())
  }, [showCatalogue, showSpecification])

  // Set body background color based on current page
  useEffect(() => {
    if (showSpecification || showCatalogue) {
      document.body.style.backgroundColor = '#ffffff'
      document.documentElement.style.backgroundColor = '#ffffff'
    } else {
      document.body.style.backgroundColor = '#0a0a0a'
      document.documentElement.style.backgroundColor = '#0a0a0a'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.backgroundColor = ''
      document.documentElement.style.backgroundColor = ''
    }
  }, [showSpecification, showCatalogue])

  const handleNavigate = (page: 'catalogue' | 'specification', filter?: { language?: string }) => {
    if (page === 'catalogue') {
      setShowCatalogue(true)
      setShowSpecification(false)
      setCatalogueFilter(filter)
    } else if (page === 'specification') {
      setShowSpecification(true)
      setShowCatalogue(false)
    }
  }

  return (
    <div className="app">
      <Header
        onCatalogueClick={() => {
          setShowCatalogue(true)
          setShowSpecification(false)
          setCatalogueFilter(undefined)
        }}
        onSpecificationClick={() => {
          setShowSpecification(true)
          setShowCatalogue(false)
        }}
        onHomeClick={() => {
          setShowCatalogue(false)
          setShowSpecification(false)
        }}
        isLightTheme={showCatalogue || showSpecification}
        activePage={showCatalogue ? 'catalogue' : showSpecification ? 'specification' : 'home'}
      />
      {showCatalogue ? (
        <>
          <CataloguePage initialFilter={catalogueFilter} />
          <Footer onNavigate={handleNavigate} isLightTheme={true} />
        </>
      ) : showSpecification ? (
        <>
          <SpecificationPage />
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