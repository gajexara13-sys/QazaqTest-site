/* Общие скрипты: шапка, мобильное меню, модалка, форма, анимации */

(function () {
  'use strict';

  /* ---- Шапка: тень при прокрутке ---- */
  const header = document.getElementById('header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Мобильное меню ---- */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        burger.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---- Модальное окно заявки ---- */
  const modal = document.getElementById('modal');
  if (modal) {
    const messageField = modal.querySelector('[name="message"]');

    const openModal = (product) => {
      if (product && messageField && !messageField.value) {
        messageField.value = 'Интересует: ' + product;
      }
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      const first = modal.querySelector('input');
      if (first) setTimeout(() => first.focus(), 250);
    };

    const closeModal = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    document.addEventListener('click', (e) => {
      const opener = e.target.closest('[data-modal-open]');
      if (opener) { openModal(opener.dataset.product); return; }
      if (e.target.closest('[data-modal-close]')) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });
  }

  /* ---- Формы заявки (модалка + страница контактов) ---- */
  document.querySelectorAll('form.form').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('[required]').forEach((field) => {
        const ok = field.value.trim().length > 1;
        field.classList.toggle('is-invalid', !ok);
        if (!ok) valid = false;
      });
      if (!valid) return;

      /* TODO: подключить отправку на бэкенд / Telegram / email.
         Сейчас форма только показывает подтверждение. */
      const success = form.querySelector('.form__success');
      const submit = form.querySelector('.form__submit');
      if (success) success.hidden = false;
      if (submit) submit.disabled = true;
      form.querySelectorAll('input, textarea').forEach((f) => (f.disabled = true));
    });

    form.addEventListener('input', (e) => {
      if (e.target.classList.contains('is-invalid') && e.target.value.trim().length > 1) {
        e.target.classList.remove('is-invalid');
      }
    });
  });

  /* ---- Появление блоков при прокрутке ---- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---- Популярные товары на главной ---- */
  const featuredGrid = document.getElementById('featured-grid');
  if (featuredGrid && typeof PRODUCTS !== 'undefined') {
    featuredGrid.innerHTML = PRODUCTS.filter((p) => p.featured).map(productCardHTML).join('');
  }
})();
