import { lazy, Suspense, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import BackToTop from './components/BackToTop'
import ContactModal from './components/ContactModal'
import Header from './components/Header'
import ScrollToTop from './components/ScrollToTop'
import SiteFooter from './components/SiteFooter'
import { DEFAULT_TOPIC } from './constants'

// Быстрый просмотр товара читает цену и категорию через ProductImage —
// то есть тоже тянет siteData.js целиком (см. комментарий у HomePage ниже).
// Модалка не нужна, пока по карточке не кликнули, поэтому она лениво
// подгружаемая точно так же, как строки поиска в шапке.
const ProductModal = lazy(() => import('./components/ProductModal'))

// Каждая страница — свой чанк, который грузится только при переходе на неё.
// Каталог, карточка товара и поиск тянут за собой catalogItems (422 КБ
// описаний всех 135 позиций); без разбивки этот вес попадал в общий бандл и
// скачивался даже тем, кто открыл только главную.
const HomePage = lazy(() => import('./pages/HomePage'))
const CatalogPage = lazy(() => import('./pages/CatalogPage'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const ProductPage = lazy(() => import('./pages/ProductPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const ServicesPage = lazy(() => import('./pages/ServicesPage'))
const ServicePage = lazy(() => import('./pages/ServicePage'))
const GuidesPage = lazy(() => import('./pages/GuidesPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

/** Пусто, а не спиннер: переход между страницами и так быстрый, а мигающий
 * индикатор на каждый клик по ссылке раздражал бы больше, чем короткая
 * пауза перед отрисовкой. */
function RouteFallback() {
  return null
}

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
        <Suspense fallback={null}>
          <ProductModal
            item={previewItem}
            onOpenModal={handleOpenModal}
            onClose={() => setPreviewItem(null)}
          />
        </Suspense>
      ) : null}
      {isContactOpen ? (
        <ContactModal
          selectedCategory={selectedCategory}
          onClose={() => setContactOpen(false)}
        />
      ) : null}
      <main className="relative z-0 [overflow-anchor:none]">
        <Suspense fallback={<RouteFallback />}>
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
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <SiteFooter onOpenModal={handleOpenModal} />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
