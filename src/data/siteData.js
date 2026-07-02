import catalogGenerated from './catalog.generated.json'

export const categories = [
  {
    id: 'asphalt',
    title: 'Асфальтобетоны',
    icon: '🛣️',
    description:
      'Оборудование для проектирования смесей, контроля уплотнения и определения свойств асфальтобетона.',
    items: ['Компакторы', 'Установки Rice Test', 'Экстракторы'],
    heroLabel: 'Асфальтобетонные покрытия',
    accent: '#D86350',
    coverImage: '/categories/lab-equipment.png',
    coverPosition: '48% 52%',
    image:
      'linear-gradient(135deg, rgba(8,15,28,0.58), rgba(8,15,28,0.16)), radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18), transparent 25%), linear-gradient(120deg, #3f4c5a 0%, #202934 45%, #101826 100%)',
  },
  {
    id: 'bitumen',
    title: 'Битумные вяжущие',
    icon: '🧪',
    description:
      'Приборы для оценки вязкости, старения, пластичности и температурных характеристик битума.',
    items: ['Дуктилометры', 'Вискозиметры', 'Печи RTFOT / PAV'],
    heroLabel: 'Испытания битума',
    accent: '#D86350',
    coverImage: '/categories/lab-equipment.png',
    coverPosition: '38% 48%',
    image:
      'linear-gradient(135deg, rgba(9,15,24,0.65), rgba(9,15,24,0.22)), radial-gradient(circle at 72% 25%, rgba(255,170,0,0.18), transparent 28%), linear-gradient(120deg, #2b3036 0%, #16181d 48%, #090b10 100%)',
  },
  {
    id: 'aggregates',
    title: 'Каменные заполнители',
    icon: '🪨',
    description:
      'Решения для ситового анализа, определения дробимости и оценки сцепления заполнителей.',
    items: ['Лос-Анджелес', 'Ситовые анализаторы', 'Адгезия'],
    heroLabel: 'Испытания заполнителей',
    accent: '#D86350',
    coverImage: '/categories/lab-equipment.png',
    coverPosition: '58% 44%',
    image:
      'linear-gradient(135deg, rgba(18,24,31,0.5), rgba(18,24,31,0.14)), radial-gradient(circle at 30% 30%, rgba(255,255,255,0.16), transparent 24%), linear-gradient(130deg, #6f675f 0%, #9a8f84 28%, #4a4642 100%)',
  },
  {
    id: 'concrete',
    title: 'Бетоны и растворы',
    icon: '🧱',
    description:
      'Лабораторные установки для приготовления, выдерживания и испытания бетонных образцов.',
    items: ['Прессы', 'Климатические камеры', 'Формы для кубов'],
    heroLabel: 'Испытания бетона',
    accent: '#D86350',
    coverImage: '/categories/lab-equipment.png',
    coverPosition: '45% 55%',
    image:
      'linear-gradient(135deg, rgba(16,20,27,0.54), rgba(16,20,27,0.12)), radial-gradient(circle at 22% 18%, rgba(255,255,255,0.16), transparent 26%), linear-gradient(125deg, #b3b8bd 0%, #d6dadf 26%, #6f7880 100%)',
  },
  {
    id: 'stabilized-soil',
    title: 'Укрепленные грунты',
    icon: '🛤️',
    description:
      'Приборы для контроля прочности, влажности и качества грунтов, укреплённых вяжущими.',
    items: ['Приборы СоюздорНИИ', 'Прочность на сжатие'],
    heroLabel: 'Укреплённые грунты',
    accent: '#D86350',
    coverImage: '/categories/lab-equipment.png',
    coverPosition: '40% 42%',
    image:
      'linear-gradient(135deg, rgba(12,18,24,0.54), rgba(12,18,24,0.12)), radial-gradient(circle at 68% 20%, rgba(255,255,255,0.15), transparent 24%), linear-gradient(125deg, #77634d 0%, #a68a67 33%, #3f3328 100%)',
  },
  {
    id: 'cement',
    title: 'Цементные вяжущие',
    icon: '🏗️',
    description:
      'Решения для определения сроков схватывания, равномерности объёма и прочности цементных составов.',
    items: ['Приборы Вика', 'Автоклавы', 'Смесители'],
    heroLabel: 'Цементные системы',
    accent: '#D86350',
    coverImage: '/categories/lab-equipment.png',
    coverPosition: '52% 46%',
    image:
      'linear-gradient(135deg, rgba(15,20,27,0.5), rgba(15,20,27,0.1)), radial-gradient(circle at 75% 24%, rgba(255,255,255,0.15), transparent 24%), linear-gradient(122deg, #d7d2c7 0%, #c3beb2 32%, #79756c 100%)',
  },
  {
    id: 'soil',
    title: 'Грунты и почвы',
    icon: '🌍',
    description:
      'Оборудование для компрессионных испытаний, определения плотности и подготовки проб грунта.',
    items: ['Приборы компрессионного сжатия', 'Плотномеры'],
    heroLabel: 'Механика грунтов',
    accent: '#D86350',
    coverImage: '/categories/lab-equipment.png',
    coverPosition: '62% 54%',
    image:
      'linear-gradient(135deg, rgba(10,17,24,0.55), rgba(10,17,24,0.12)), radial-gradient(circle at 25% 24%, rgba(255,255,255,0.16), transparent 24%), linear-gradient(125deg, #5f7155 0%, #98a58a 34%, #384333 100%)',
  },
  {
    id: 'min-powder',
    title: 'Минеральные порошки',
    icon: '🌫️',
    description:
      'Оборудование для анализа тонкости, влажности и физико-химических свойств минеральных порошков.',
    items: ['Приборы ПСХ', 'Определение влажности', 'Тонкость помола'],
    heroLabel: 'Анализ порошков',
    accent: '#D86350',
    coverImage: '/categories/lab-equipment.png',
    coverPosition: '68% 50%',
    image:
      'linear-gradient(135deg, rgba(24,27,31,0.48), rgba(24,27,31,0.12)), radial-gradient(circle at 70% 26%, rgba(255,255,255,0.2), transparent 30%), linear-gradient(125deg, #e5e7eb 0%, #cfd6de 36%, #8a98a5 100%)',
  },
  {
    id: 'bitumen-emulsions',
    title: 'Битумные эмульсии',
    icon: '💧',
    description:
      'Оборудование для приготовления, хранения и лабораторного контроля битумных эмульсий и эмульсионных вяжущих.',
    items: ['Коллоидные мельницы', 'Испытания на остаток', 'Вязкость и стабильность'],
    heroLabel: 'Битумные эмульсии',
    accent: '#D86350',
    coverImage: '/categories/lab-equipment.png',
    coverPosition: '55% 48%',
    image:
      'linear-gradient(135deg, rgba(14,20,28,0.55), rgba(14,20,28,0.14)), radial-gradient(circle at 40% 28%, rgba(100,160,220,0.25), transparent 30%), linear-gradient(125deg, #3d5a6e 0%, #6a8fa8 38%, #1e2d3a 100%)',
  },
  {
    id: 'field-testing',
    title: 'Полевые испытания',
    icon: '📍',
    description:
      'Портативные приборы для контроля плотности, влажности и свойств материалов на объекте и в дорожном строительстве.',
    items: ['Плотномеры', 'Пенетрометры', 'Влагомеры'],
    heroLabel: 'Полевые испытания',
    accent: '#D86350',
    coverImage: '/categories/lab-equipment.png',
    coverPosition: '55% 48%',
    image:
      'linear-gradient(135deg, rgba(14,22,18,0.55), rgba(14,22,18,0.14)), radial-gradient(circle at 35% 30%, rgba(120,174,173,0.22), transparent 28%), linear-gradient(125deg, #4a6b5c 0%, #7a9a88 35%, #2a3d34 100%)',
  },
  {
    id: 'ndt',
    title: 'Неразрушающий контроль',
    icon: '🔍',
    description:
      'Приборы и комплекты для оценки свойств материалов и конструкций без разрушения образца: ультразвук, дефектоскопия, толщиномеры.',
    items: ['Ультразвуковой контроль', 'Толщиномеры', 'Дефектоскопы'],
    heroLabel: 'Неразрушающий контроль',
    accent: '#D86350',
    coverImage: '/categories/lab-equipment.png',
    coverPosition: '50% 45%',
    image:
      'linear-gradient(135deg, rgba(18,18,28,0.55), rgba(18,18,28,0.12)), radial-gradient(circle at 65% 22%, rgba(180,200,255,0.2), transparent 26%), linear-gradient(125deg, #3a3f52 0%, #5c6478 36%, #1a1f2e 100%)',
  },
  {
    id: 'general-lab',
    title: 'Общелабораторное оборудование',
    icon: '🔬',
    description:
      'Базовая инфраструктура лаборатории: нагрев, сушка, взвешивание и подготовка материалов.',
    items: ['Сушильные шкафы', 'Весы', 'Муфельные печи'],
    heroLabel: 'Общелабораторное оборудование',
    accent: '#D86350',
    coverImage: '/categories/lab-equipment.png',
    coverPosition: '50% 40%',
    image:
      'linear-gradient(135deg, rgba(11,18,25,0.58), rgba(11,18,25,0.12)), radial-gradient(circle at 70% 26%, rgba(255,255,255,0.18), transparent 26%), linear-gradient(125deg, #2f3743 0%, #657181 32%, #0e141d 100%)',
  },
]

export const brands = [
  { name: 'HTKYYQ', logo: '/brands/htkyyq.png' },
  { name: 'Нефтехимавтоматика', logo: '/brands/neftehimavtomatika-clean.png' },
  { name: 'СТМ', logo: '/brands/stm.svg' },
  { name: 'Техком', logo: '/brands/tehkom-clean.png' },
  { name: 'Lithostek', logo: '/brands/lithostek-clean.png' },
  { name: 'Грин-Тех', logo: '/brands/green-tech.png' },
]

export const benefits = [
  {
    value: '0 ₸',
    title: 'За экспертный подбор',
    description:
      'Поможем выбрать оборудование под ваши задачи и нормативы, не навязываем лишнее.',
  },
  {
    value: '1 день',
    title: 'Срок реакции на заявку',
    description:
      'Настройка, проверка и ремонт оборудования силами своих технических специалистов, а не посредников.',
  },
  {
    value: '12+ лет',
    title: 'Опыт работы в лабораториях',
    description:
      'Знаем технологию дорожного производства и требования к лабораторному контролю, поэтому говорим с вами на одном языке.',
  },
]

export const catalogItems = catalogGenerated

export function getCategoryById(categoryId) {
  return categories.find((category) => category.id === categoryId)
}
