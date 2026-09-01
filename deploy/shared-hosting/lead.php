<?php
/**
 * Приём заявок с сайта — версия для виртуального хостинга.
 *
 * На shared-хостинге нет ни root, ни systemd, ни возможности держать
 * постоянный процесс, поэтому Node-сервис из server/lead-service.mjs там не
 * запустится. PHP есть везде — этот файл делает ровно то же самое.
 *
 * Порядок действий:
 *   1. записать заявку в журнал на диск;
 *   2. ответить сайту и отпустить браузер;
 *   3. досылать уведомления (Telegram, почта) уже без него.
 *
 * Журнал первым потому, что уведомление может не уйти — Telegram недоступен,
 * токен протух, хостер режет исходящие соединения. Заявка не должна исчезнуть
 * вместе с ним: пока строка на диске, клиенту можно перезвонить.
 *
 * Ответ раньше уведомлений потому, что заявка уже принята, и держать человека
 * у крутящейся кнопки незачем. Когда хостинг режет исходящие соединения,
 * ожидание упирается в таймаут — форма «думает» несколько секунд на ровном
 * месте, хотя всё уже сохранено.
 *
 * Куда класть: рядом с сайтом, в папку api/ — путь /api/lead.php.
 * Настройки: файл lead-config.php рядом (см. lead-config.example.php).
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$config = [
    'tg_token'       => '',
    'tg_chat'        => '',
    'mail_to'        => '',
    'mail_from'      => '',
    'allowed_origin' => '',
    // Журнал за пределами корня сайта, иначе его можно скачать по прямой
    // ссылке вместе со всеми телефонами клиентов.
    'log'            => __DIR__ . '/../../leads.jsonl',
];

$configFile = __DIR__ . '/lead-config.php';
if (is_readable($configFile)) {
    $config = array_merge($config, require $configFile);
}

const MAX_BODY_BYTES = 4096;
const LIMIT_REQUESTS = ['window' => 60, 'max' => 20];
const LIMIT_ACCEPTED = ['window' => 600, 'max' => 5];

function respond(int $code, array $payload, string $origin, string $allowed, bool $keepRunning = false): void
{
    http_response_code($code);
    if ($allowed !== '' && $origin === $allowed) {
        header('Access-Control-Allow-Origin: ' . $allowed);
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
        header('Vary: Origin');
    }
    $body = json_encode($payload, JSON_UNESCAPED_UNICODE);
    header('Content-Length: ' . strlen((string) $body));
    echo $body;

    if (!$keepRunning) {
        exit;
    }

    // Отпускаем браузер и досылаем уведомление уже без него.
    //
    // Заявка к этому моменту записана в журнал, то есть не потеряна. Держать
    // человека у крутящейся кнопки, пока мы стучимся в Telegram, незачем — а
    // если хостинг режет исходящие соединения, ожидание упирается в таймаут,
    // и посетитель видит зависшую форму на пустом месте.
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
        return;
    }
    // Без PHP-FPM закрываем соединение вручную
    ignore_user_abort(true);
    while (ob_get_level() > 0) {
        ob_end_flush();
    }
    flush();
}

/**
 * Два раздельных ограничения.
 *
 * Одно на все обращения — против потока мусора. Второе только на принятые
 * заявки — против спам-ботов. Разделены потому, что общий счётчик наказывал бы
 * живого человека: тот, кто дважды опечатался в телефоне и исправил,
 * расходовал бы лимит наравне с ботом и упирался в отказ на настоящей заявке.
 */
function rateLimited(string $kind, string $ip, array $limit): bool
{
    $file = sys_get_temp_dir() . '/qazaqtest-lead-' . $kind . '-' . md5($ip) . '.txt';
    $now = time();

    $times = [];
    if (is_readable($file)) {
        $times = array_filter(
            array_map('intval', explode(',', (string) file_get_contents($file))),
            static fn(int $at): bool => $now - $at < $limit['window']
        );
    }
    $times[] = $now;
    @file_put_contents($file, implode(',', $times), LOCK_EX);

    return count($times) > $limit['max'];
}

function clean(mixed $value, int $limit): string
{
    if (!is_string($value)) {
        return '';
    }
    $value = preg_replace('/\s+/u', ' ', $value);
    return mb_substr(trim((string) $value), 0, $limit);
}

function notifyTelegram(array $lead, array $config): array
{
    if ($config['tg_token'] === '' || $config['tg_chat'] === '') {
        return [false, 'не настроен'];
    }

    $lines = [
        '<b>Заявка с сайта QAZAQTEST</b>',
        '',
        '<b>Имя:</b> ' . htmlspecialchars($lead['name'], ENT_NOQUOTES, 'UTF-8'),
        '<b>Телефон:</b> ' . htmlspecialchars($lead['phone'], ENT_NOQUOTES, 'UTF-8'),
        '<b>Тема:</b> ' . htmlspecialchars($lead['topic'], ENT_NOQUOTES, 'UTF-8'),
    ];
    if ($lead['page'] !== '') {
        $lines[] = '<b>Страница:</b> ' . htmlspecialchars($lead['page'], ENT_NOQUOTES, 'UTF-8');
    }

    $payload = json_encode([
        'chat_id'                  => $config['tg_chat'],
        'text'                     => implode("\n", $lines),
        'parse_mode'               => 'HTML',
        'disable_web_page_preview' => true,
    ], JSON_UNESCAPED_UNICODE);

    $url = 'https://api.telegram.org/bot' . $config['tg_token'] . '/sendMessage';

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 8,
        ]);
        $body = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($body === false) {
            return [false, $error !== '' ? $error : 'curl не смог'];
        }
        return $code === 200 ? [true, ''] : [false, 'HTTP ' . $code];
    }

    // Некоторые хостеры отключают curl — пробуем обычный поток
    $context = stream_context_create([
        'http' => [
            'method'        => 'POST',
            'header'        => "Content-Type: application/json\r\n",
            'content'       => $payload,
            'timeout'       => 10,
            'ignore_errors' => true,
        ],
    ]);
    $body = @file_get_contents($url, false, $context);
    return $body === false ? [false, 'исходящие запросы запрещены'] : [true, ''];
}

/**
 * Письмо — запасной канал на случай, когда хостинг не выпускает наружу.
 *
 * На виртуальном хостинге почта уходит через почтовый сервер самого хостера,
 * у которого настроены SPF и репутация домена, поэтому доходит она обычно
 * лучше, чем письмо с только что поднятого VPS.
 */
function notifyMail(array $lead, array $config): array
{
    if (empty($config['mail_to']) || !function_exists('mail')) {
        return [false, 'не настроен'];
    }

    $lines = [
        'Заявка с сайта QAZAQTEST',
        '',
        'Имя:      ' . $lead['name'],
        'Телефон:  ' . $lead['phone'],
        'Тема:     ' . $lead['topic'],
    ];
    if ($lead['page'] !== '') {
        $lines[] = 'Страница: ' . $lead['page'];
    }

    $from = $config['mail_from'] ?: ('noreply@' . ($_SERVER['HTTP_HOST'] ?? 'localhost'));
    $headers = implode("\r\n", [
        'From: QAZAQTEST <' . $from . '>',
        'Content-Type: text/plain; charset=UTF-8',
        'X-Mailer: qazaqtest-lead',
    ]);
    $subject = '=?UTF-8?B?' . base64_encode('Заявка с сайта: ' . $lead['topic']) . '?=';

    $sent = @mail($config['mail_to'], $subject, implode("\n", $lines), $headers);
    return $sent ? [true, ''] : [false, 'mail() вернул false'];
}

// ---------------------------------------------------------------------------

$origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = (string) $config['allowed_origin'];

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    respond(204, [], $origin, $allowed);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['error' => 'Method not allowed'], $origin, $allowed);
}

$ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$ip = trim(explode(',', (string) $ip)[0]);

if (rateLimited('req', $ip, LIMIT_REQUESTS)) {
    respond(429, ['error' => 'Слишком много обращений, попробуйте через минуту'], $origin, $allowed);
}

if ($allowed !== '' && $origin !== '' && $origin !== $allowed) {
    respond(403, ['error' => 'Forbidden origin'], $origin, $allowed);
}

$body = (string) file_get_contents('php://input');
if (strlen($body) > MAX_BODY_BYTES) {
    respond(413, ['error' => 'Слишком длинный запрос'], $origin, $allowed);
}

$raw = json_decode($body, true);
if (!is_array($raw)) {
    respond(400, ['error' => 'Некорректный запрос'], $origin, $allowed);
}

$name  = clean($raw['name'] ?? null, 120);
$phone = clean($raw['phone'] ?? null, 40);

if ($name === '' || $phone === '') {
    respond(400, ['error' => 'Укажите имя и телефон'], $origin, $allowed);
}
if (strlen(preg_replace('/\D/', '', $phone) ?? '') < 10) {
    respond(400, ['error' => 'Телефон выглядит неполным'], $origin, $allowed);
}

if (rateLimited('ok', $ip, LIMIT_ACCEPTED)) {
    respond(429, ['error' => 'Заявка уже отправлена, мы свяжемся с вами'], $origin, $allowed);
}

$lead = [
    'name'        => $name,
    'phone'       => $phone,
    'topic'       => clean($raw['topic'] ?? null, 200) ?: 'Общий запрос',
    'page'        => clean($raw['page'] ?? null, 300),
    'submittedAt' => gmdate('c'),
];

$line = json_encode($lead + ['ip' => $ip], JSON_UNESCAPED_UNICODE) . "\n";
if (@file_put_contents($config['log'], $line, FILE_APPEND | LOCK_EX) === false) {
    // Записать не смогли — принимать заявку нельзя: сайт скажет клиенту
    // «принято», а её нигде не будет. Пусть лучше сработает WhatsApp.
    error_log('[lead] журнал недоступен: ' . $config['log']);
    respond(500, ['error' => 'Не удалось сохранить заявку'], $origin, $allowed);
}

// Заявка в журнале — значит принята. Отвечаем сразу, уведомления досылаем
// следом: их задержка не должна превращаться в ожидание у формы.
respond(200, ['ok' => true], $origin, $allowed, true);

$delivered = false;
foreach ([['Telegram', notifyTelegram($lead, $config)], ['почта', notifyMail($lead, $config)]] as [$channel, $result]) {
    [$sent, $reason] = $result;
    if ($sent) {
        $delivered = true;
    } elseif ($reason !== 'не настроен') {
        error_log('[lead] ' . $channel . ': не ушло (' . $reason . ')');
    }
}
if (!$delivered) {
    error_log('[lead] ни один канал уведомлений не сработал, заявка только в журнале');
}
