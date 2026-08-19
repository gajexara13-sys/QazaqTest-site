import { useState } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import BackToTop from './components/BackToTop'
import ContactModal from './components/ContactModal'
import Header from './components/Header'
import ProductModal from './components/ProductModal'
import ScrollToTop from './components/ScrollToTop'
import SiteFooter from './components/SiteFooter'
import { DEFAULT_TOPIC } from './constants'
import AboutPage from './pages/AboutPage'
import CatalogPage from './pages/CatalogPage'
import CategoryPage from './pages/CategoryPage'
import ContactPage from './pages/ContactPage'
import GuidesPage from './pages/GuidesPage'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import ProductPage from './pages/ProductPage'
import SearchPage from './pages/SearchPage'
import ServicePage from './pages/ServicePage'
import ServicesPage from './pages/ServicesPage'

function AppShell() {
  const [isContactOpen, setContactOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_TOPIC)
  const [previewItem, setPreviewItem] = useState(null)

  const handleOpenModal = (category) => {
    setSelectedCategory(category)
    setPreviewItem(null)
    setContactOpen(true)
  }

  const handlePreviewProduct = (item) => setPreviewItem(item)

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--ink)] antialiased">
      <ScrollToTop />
      <Header />
      <BackToTop />
      {previewItem ? (
        <ProductModal
          item={previewItem}
          onOpenModal={handleOpenModal}
          onClose={() => setPreviewItem(null)}
        />
      ) : null}
      {isContactOpen ? (
        <ContactModal
          selectedCategory={selectedCategory}
          onClose={() => setContactOpen(false)}
        />
      ) : null}
      <main className="relative z-0 [overflow-anchor:none]">
        <Routes>
          <Route path="/" element={<HomePage onOpenModal={handleOpenModal} />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route
            path="/catalog/:id"
            element={
              <CategoryPage
                onOpenModal={handleOpenModal}
                onPreviewProduct={handlePreviewProduct}
              />
            }
          />
          <Route
            path="/catalog/:categoryId/:slug"
            element={
              <ProductPage
                onOpenModal={handleOpenModal}
                onPreviewProduct={handlePreviewProduct}
              />
            }
          />
          <Route
            path="/search"
            element={
              <SearchPage
                onOpenModal={handleOpenModal}
                onPreviewProduct={handlePreviewProduct}
              />
            }
          />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/service" element={<ServicePage />} />
          <Route path="/guides" element={<GuidesPage onOpenModal={handleOpenModal} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage onOpenModal={handleOpenModal} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <SiteFooter onOpenModal={handleOpenModal} />
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  )
}
