# Выкладка на VPS

Инструкция для VPS с Ubuntu 22.04/24.04 и root-доступом — Cloudzy или любой
другой: ничего специфичного для провайдера здесь нет.

> **Для виртуального хостинга (Spaceweb «Старт» и подобные) эта инструкция не
> подходит** — там нет root, systemd и постоянных процессов. Смотрите
> `DEPLOY-shared.md`.

> **Если на сервере уже работает сайт**, команда `rsync --delete` в разделах 4
> и 8 сотрёт его без предупреждения. Сначала сделайте резервную копию корня
> сайта и конфигурации nginx, а выкладку ведите в отдельный каталог, переключив
> `root` в конфиге только после проверки.

Что получится: nginx отдаёт собранный сайт, отдельный маленький сервис
принимает заявки с формы и шлёт их в Telegram.

---

## 1. Что нужно до начала

- VPS с Ubuntu и доступом по SSH;
- домен `qazaqtest.kz`, у которого A-запись указывает на IP сервера;
- Node.js 20+ **на сервере** — нужен и для сборки, и для сервиса заявок.

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git
node -v
```

---

## 2. Бот для заявок

Заявки приходят в Telegram, а не на почту. Причина практическая: письма с
только что созданного VPS почти всегда попадают в спам или отбиваются —
у нового IP нет репутации, нужны SPF, DKIM и прогрев домена. Telegram работает
сразу, приходит на телефон и ничего не стоит.

1. Написать [@BotFather](https://t.me/BotFather), команда `/newbot`, ответить на
   два вопроса. В ответ придёт токен вида `8123456789:AAH...`.
2. Написать своему новому боту любое сообщение — без этого он не имеет права
   вам писать.
3. Узнать свой chat id: открыть в браузере
   `https://api.telegram.org/bot<ТОКЕН>/getUpdates` и найти `"chat":{"id":...}`.

Если заявки должны видеть несколько человек — создайте группу, добавьте туда
бота и возьмите id группы (он будет отрицательным).

---

## 3. Сервис заявок

```bash
sudo useradd --system --home /opt/qazaqtest-lead --shell /usr/sbin/nologin qazaqtest
sudo mkdir -p /opt/qazaqtest-lead
sudo cp server/lead-service.mjs /opt/qazaqtest-lead/
sudo chown -R qazaqtest:qazaqtest /opt/qazaqtest-lead
```

Секреты — отдельным файлом, доступным только root:

```bash
sudo tee /etc/qazaqtest-lead.env > /dev/null <<'EOF'
LEAD_PORT=8081
LEAD_LOG=/var/lib/qazaqtest-lead/leads.jsonl
LEAD_TG_BOT_TOKEN=сюда_токен_от_BotFather
LEAD_TG_CHAT_ID=сюда_chat_id
LEAD_ALLOWED_ORIGIN=https://qazaqtest.kz
EOF
sudo chmod 600 /etc/qazaqtest-lead.env
```

Запуск:

```bash
sudo cp deploy/qazaqtest-lead.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now qazaqtest-lead
curl -s localhost:8081/health
```

Здоровый ответ: `{"ok":true,"telegram":true}`. Если `telegram:false` — токен или
chat id не подхватились.

---

## 4. Сборка сайта

```bash
git clone https://github.com/gajexara13-sys/QazaqTest-site.git
cd QazaqTest-site
npm install

echo 'VITE_LEAD_ENDPOINT=/api/lead' > .env.production
npm run build

sudo mkdir -p /var/www/qazaqtest
sudo rsync -a --delete dist/ /var/www/qazaqtest/
```

`VITE_LEAD_ENDPOINT=/api/lead` — относительный путь, а не полный адрес: форма и
обработчик живут на одном домене, поэтому браузеру не нужен предварительный
CORS-запрос, и одна возможная точка отказа исчезает.

**Переменная читается во время сборки, а не при запуске.** Поменяли её —
пересоберите сайт, иначе в бандле останется прежнее значение.

---

## 5. nginx

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/qazaqtest
sudo ln -sf /etc/nginx/sites-available/qazaqtest /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Ключевая строка в конфиге — `try_files $uri $uri/ /index.html`. Без неё прямой
заход на `/catalog/asphalt/press-lwd-5b` вернёт 404: такого файла на диске нет,
адрес существует только внутри приложения. Ломается это ровно там, где больнее
всего — на ссылке из поиска или мессенджера.

---

## 6. HTTPS

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d qazaqtest.kz -d www.qazaqtest.kz
```

Certbot сам допишет TLS в конфиг и заведёт автопродление. Проверить:

```bash
sudo certbot renew --dry-run
```

---

## 7. Проверка

```bash
curl -I https://qazaqtest.kz/                       # 200
curl -I https://qazaqtest.kz/catalog/asphalt        # 200, не 404
curl -sX POST https://qazaqtest.kz/api/lead \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://qazaqtest.kz' \
  -d '{"name":"Проверка","phone":"+7 701 000 00 00","topic":"Тест"}'
```

Последняя команда должна вернуть `{"ok":true}`, а в Telegram — прийти
сообщение. Затем отправьте настоящую заявку через форму на сайте: важно
убедиться, что работает весь путь целиком, а не только curl.

---

## 8. Обновление сайта

```bash
cd QazaqTest-site
git pull
npm install
npm run build
sudo rsync -a --delete dist/ /var/www/qazaqtest/
```

Сервис заявок при этом не трогается — он живёт отдельно от статики.

---

## Если что-то не работает

**Форма показывает «Заявка не ушла автоматически».** Значит запрос не дошёл или
вернул ошибку. По порядку:

```bash
systemctl status qazaqtest-lead      # сервис жив?
journalctl -u qazaqtest-lead -n 50   # что он пишет
curl -s localhost:8081/health        # отвечает ли напрямую
sudo tail -f /var/log/nginx/error.log
```

Частая причина — забыли пересобрать сайт после добавления `.env.production`.

**Заявки не приходят в Telegram, но в журнале есть.** Так и задумано: журнал
пишется первым и не зависит от Telegram. Заявки не потеряны:

```bash
sudo tail -20 /var/lib/qazaqtest-lead/leads.jsonl
```

Смотрите в `journalctl` строку `уведомление не ушло` — там будет причина.

**Глубокие ссылки дают 404.** Не применилось правило `try_files`: проверьте
`nginx -t` и что включён именно ваш конфиг, а не `default`.
