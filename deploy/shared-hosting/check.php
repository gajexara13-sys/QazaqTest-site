<?php
/**
 * Разовая диагностика хостинга: что доступно обработчику заявок.
 *
 * Положить рядом с lead.php, открыть в браузере, прочитать ответ —
 * и УДАЛИТЬ. Наружу этот файл ничего секретного не отдаёт, но и висеть
 * на боевом сайте ему незачем.
 */
declare(strict_types=1);
header('Content-Type: text/plain; charset=utf-8');

echo "PHP: " . PHP_VERSION . "\n";
echo "curl: " . (function_exists('curl_init') ? 'есть' : 'НЕТ') . "\n";
echo "allow_url_fopen: " . (ini_get('allow_url_fopen') ? 'вкл' : 'ВЫКЛ') . "\n";
echo "mail(): " . (function_exists('mail') ? 'есть' : 'НЕТ') . "\n";
echo "fastcgi_finish_request(): " . (function_exists('fastcgi_finish_request') ? 'есть' : 'нет') . "\n";

$config = @include __DIR__ . '/lead-config.php';
$log = is_array($config) && isset($config['log']) ? $config['log'] : __DIR__ . '/../../leads.jsonl';
echo "\nЖурнал: $log\n";
echo "  каталог существует: " . (is_dir(dirname($log)) ? 'да' : 'НЕТ') . "\n";
echo "  доступен на запись: " . (is_writable(dirname($log)) ? 'да' : 'НЕТ') . "\n";
echo "  вне корня сайта: " .
    (strpos(realpath(dirname($log)) ?: '', realpath($_SERVER['DOCUMENT_ROOT']) ?: 'x') === 0 ? 'НЕТ — виден снаружи!' : 'да') . "\n";

echo "\nИсходящее соединение с api.telegram.org:\n";
$start = microtime(true);
if (function_exists('curl_init')) {
    $ch = curl_init('https://api.telegram.org/');
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8, CURLOPT_NOBODY => true]);
    $ok = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err = curl_error($ch);
    $errno = curl_errno($ch);
    curl_close($ch);
    printf("  время: %.1f с\n", microtime(true) - $start);
    if ($ok === false) {
        echo "  РЕЗУЛЬТАТ: не удалось — curl #$errno: $err\n";
        echo "  Скорее всего хостинг блокирует исходящие соединения.\n";
    } else {
        echo "  РЕЗУЛЬТАТ: соединение есть, HTTP $code\n";
    }
} else {
    echo "  curl недоступен\n";
}

if (is_array($config) && !empty($config['tg_token']) && !empty($config['tg_chat'])) {
    echo "\nПроверка бота (getMe):\n";
    $ch = curl_init('https://api.telegram.org/bot' . $config['tg_token'] . '/getMe');
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8]);
    $body = curl_exec($ch);
    curl_close($ch);
    echo '  ' . ($body === false ? 'запрос не прошёл' : substr((string) $body, 0, 300)) . "\n";
} else {
    echo "\nТокен или chat id в lead-config.php не заполнены.\n";
}
