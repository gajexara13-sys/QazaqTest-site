import { Link } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import { CONTACT_EMAIL, CONTACT_PHONE_HREF, CONTACT_PHONE_LABEL } from '../constants'
import { COMPANY_DETAILS } from '../data/siteData'
import usePageMeta from '../hooks/usePageMeta'

function Section({ title, children }) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)]">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-slate-700">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  usePageMeta(
    'Политика конфиденциальности',
    'Какие персональные данные собирает сайт QAZAQTEST, зачем, сколько они хранятся и как отозвать согласие на обработку.',
  )

  return (
    <>
      <Breadcrumbs trail={[{ title: 'Политика конфиденциальности' }]} />

      <section className="bg-[var(--page-bg)]">
        <div className="mx-auto max-w-[var(--page-shell-max)] px-6 py-12 md:px-12 md:py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-black tracking-tight text-[var(--ink)] md:text-5xl">
              Политика конфиденциальности
            </h1>
            <div className="mt-7 h-1 w-28 rounded-full bg-[var(--accent)]" />
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              Документ описывает, какие данные о посетителе собирает сайт {COMPANY_DETAILS.legalName},
              зачем они нужны, сколько хранятся и как отказаться от их обработки.
            </p>

            <Section title="1. Кто обрабатывает данные">
              <p>
                Оператор — {COMPANY_DETAILS.fullLegalName}, БИН {COMPANY_DETAILS.bin},{' '}
                {COMPANY_DETAILS.address}.
              </p>
              <p>
                Связаться по любому вопросу об обработке данных:{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[var(--accent-text)] hover:underline">
                  {CONTACT_EMAIL}
                </a>{' '}
                или{' '}
                <a href={CONTACT_PHONE_HREF} className="font-semibold text-[var(--accent-text)] hover:underline">
                  {CONTACT_PHONE_LABEL}
                </a>
                .
              </p>
            </Section>

            <Section title="2. Какие данные собираются">
              <p>
                Сайт не требует регистрации и не собирает данные скрытно. Персональные данные
                поступают только из формы заявки, и только те, что вы ввели сами:
              </p>
              <ul className="ml-5 list-disc space-y-1">
                <li>имя, которым вы представились;</li>
                <li>номер телефона для ответа;</li>
                <li>тема запроса — раздел каталога или название прибора;</li>
                <li>адрес страницы, с которой отправлена заявка, и время отправки.</li>
              </ul>
              <p>
                Последние два пункта — не сведения о вас, а контекст обращения: по ним менеджер
                понимает, о каком приборе речь, и не переспрашивает.
              </p>
              <p>
                Сайт не собирает адрес электронной почты, не запрашивает документы, не определяет
                местоположение и не использует рекламные трекеры.
              </p>
            </Section>

            <Section title="3. Зачем они нужны">
              <p>
                Единственная цель — ответить на вашу заявку: перезвонить, подобрать оборудование под
                задачу, выставить счёт, согласовать поставку. Для рассылок и передачи третьим лицам в
                рекламных целях данные не используются.
              </p>
            </Section>

            <Section title="4. Основание обработки">
              <p>
                Обработка ведётся с вашего согласия, которое вы даёте, отмечая соответствующий пункт
                при отправке формы. Согласие добровольное: без него форму можно не отправлять и
                связаться напрямую по телефону.
              </p>
              <p>
                Обработка соответствует Закону Республики Казахстан от 21 мая 2013 года № 94-V
                «О персональных данных и их защите».
              </p>
            </Section>

            <Section title="5. Кому передаются">
              <p>
                Данные заявки получает только оператор. Третьим лицам они не продаются и не
                передаются, кроме двух случаев:
              </p>
              <ul className="ml-5 list-disc space-y-1">
                <li>
                  если вы сами нажали кнопку «Продублировать в WhatsApp» — тогда сообщение уходит
                  через WhatsApp и попадает под правила этого сервиса;
                </li>
                <li>если этого требует закон и есть надлежащим образом оформленный запрос.</li>
              </ul>
            </Section>

            <Section title="6. Сколько хранятся">
              <p>
                Заявка хранится, пока идёт работа по ней, и далее — в пределах сроков, установленных
                законодательством для документов о сделках. Когда цель обработки исчерпана, данные
                удаляются.
              </p>
            </Section>

            <Section title="7. Как отозвать согласие">
              <p>
                Напишите на{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[var(--accent-text)] hover:underline">
                  {CONTACT_EMAIL}
                </a>{' '}
                с просьбой удалить ваши данные — этого достаточно, обосновывать причину не нужно.
                Тем же письмом можно запросить, какие данные о вас есть, потребовать их исправления
                или блокирования.
              </p>
            </Section>

            <Section title="8. Файлы cookie">
              <p>
                Счётчики аналитики и рекламные cookie на сайте не установлены. Браузер может хранить
                служебные данные, необходимые для работы страниц, — они не позволяют вас
                идентифицировать.
              </p>
            </Section>

            <Section title="9. Изменения">
              <p>
                Актуальная редакция всегда опубликована на этой странице. Существенные изменения
                вступают в силу с момента публикации.
              </p>
            </Section>

            <div className="mt-12 border-t border-[#78AEAD]/25 pt-8">
              <p className="text-sm text-[var(--muted-text)]">
                Остались вопросы об обработке данных — напишите нам на{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[var(--accent-text)] hover:underline">
                  {CONTACT_EMAIL}
                </a>{' '}
                или зайдите в{' '}
                <Link to="/contact" className="font-semibold text-[var(--accent-text)] hover:underline">
                  контакты
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
