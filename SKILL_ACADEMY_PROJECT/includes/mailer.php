<?php
function sa_smtp_expect($socket, $codes = [250]) {
    $response = '';
    while (($line = fgets($socket, 515)) !== false) {
        $response .= $line;
        if (strlen($line) >= 4 && $line[3] === ' ') {
            break;
        }
    }
    if ($response === '') {
        return false;
    }
    $code = (int) substr($response, 0, 3);
    return in_array($code, $codes, true);
}

function sa_smtp_send($socket, $command, $expect_codes = [250]) {
    fwrite($socket, $command . "\r\n");
    return sa_smtp_expect($socket, $expect_codes);
}

function sa_send_mail($to, $subject, $message) {
    $to = trim((string) $to);
    if ($to === '') {
        return false;
    }
    $subject = str_replace(["\r", "\n"], ' ', (string) $subject);

    $cfg_file = __DIR__ . '/mailer_config.php';
    $cfg = file_exists($cfg_file) ? include $cfg_file : [];
    $enabled = !empty($cfg['enabled']);

    if ($enabled) {
        $host = isset($cfg['host']) ? $cfg['host'] : '';
        $port = isset($cfg['port']) ? (int) $cfg['port'] : 465;
        $enc = isset($cfg['encryption']) ? $cfg['encryption'] : 'ssl';
        $user = isset($cfg['username']) ? $cfg['username'] : '';
        $pass = isset($cfg['password']) ? $cfg['password'] : '';
        $from_email = isset($cfg['from_email']) ? $cfg['from_email'] : $user;
        $from_name = isset($cfg['from_name']) ? $cfg['from_name'] : 'Skill Academy';

        if ($host !== '' && $user !== '' && $pass !== '' && $from_email !== '') {
            $remote = ($enc === 'ssl' ? 'ssl://' : '') . $host;
            $socket = @fsockopen($remote, $port, $errno, $errstr, 15);
            if ($socket) {
                stream_set_timeout($socket, 15);

                $ok = sa_smtp_expect($socket, [220]);
                $ok = $ok && sa_smtp_send($socket, "EHLO localhost", [250]);
                $ok = $ok && sa_smtp_send($socket, "AUTH LOGIN", [334]);
                $ok = $ok && sa_smtp_send($socket, base64_encode($user), [334]);
                $ok = $ok && sa_smtp_send($socket, base64_encode($pass), [235]);
                $ok = $ok && sa_smtp_send($socket, "MAIL FROM:<{$from_email}>", [250]);
                $ok = $ok && sa_smtp_send($socket, "RCPT TO:<{$to}>", [250, 251]);
                $ok = $ok && sa_smtp_send($socket, "DATA", [354]);

                if ($ok) {
                    $headers = [];
                    $headers[] = 'From: ' . $from_name . ' <' . $from_email . '>';
                    $headers[] = 'To: <' . $to . '>';
                    $headers[] = 'Subject: ' . $subject;
                    $headers[] = 'MIME-Version: 1.0';
                    $headers[] = 'Content-Type: text/plain; charset=UTF-8';
                    $data = implode("\r\n", $headers) . "\r\n\r\n" . $message . "\r\n.";
                    fwrite($socket, $data . "\r\n");
                    $ok = sa_smtp_expect($socket, [250]);
                }

                @sa_smtp_send($socket, "QUIT", [221, 250]);
                fclose($socket);

                if ($ok) {
                    return true;
                }
            }
        }
    }

    // Fallback to php mail() if SMTP is disabled/unavailable.
    $headers = [];
    $headers[] = "MIME-Version: 1.0";
    $headers[] = "Content-type: text/plain; charset=UTF-8";
    $headers[] = "From: Skill Academy <no-reply@skillacademy.local>";
    return @mail($to, $subject, $message, implode("\r\n", $headers));
}
