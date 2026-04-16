export async function execute(args) {
    if (args.length === 0) {
        window.term.write('\r\ndig: missing host\r\n\r$ ');
        return;
    }
    
    const host = args[0];
    window.term.write('\r\ndigging ' + host + '...\r\n');
    
    // Use Google DNS over HTTPS (CORS-friendly)
    try {
        const response = await fetch('https://dns.google/resolve?name=' + encodeURIComponent(host));
        if (!response.ok) throw new Error('DNS query failed');
        const data = await response.json();

        if (data.Answer && data.Answer.length > 0) {
            const answer = data.Answer.find(a => a.type === 1); // A record
            if (answer) {
                window.term.write(';; Got answer:\r\n');
                window.term.write(';; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: ' + Math.floor(Math.random() * 10000) + '\r\n');
                window.term.write(';; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1\r\n');
                window.term.write('\r\n');
                window.term.write(';; OPT PSEUDOSECTION:\r\n');
                window.term.write('; EDNS: version 0; flags: ; udp: 512\r\n');
                window.term.write('\r\n');
                window.term.write(';; ANSWER SECTION:\r\n');
                window.term.write(host + '.\t3600\tIN\tA\t' + answer.data + '\r\n');
                window.term.write('\r\n');
                window.term.write(';; Query time: 45 msec\r\n');
                window.term.write(';; SERVER: 8.8.8.8#53(8.8.8.8)\r\n');
                const now = new Date();
                window.term.write(';; WHEN: ' + now.toUTCString() + '\r\n');
                window.term.write(';; MSG SIZE  rcvd: 45\r\n');
                window.term.write('\r$ ');
            } else {
                window.term.write(';; NO A RECORD FOUND FOR ' + host + '\r\n\r$ ');
            }
        } else {
            window.term.write(';; FAILED TO RESOLVE ' + host + '\r\n\r$ ');
        }
    } catch (err) {
        window.term.write('\r\ndig: failed to resolve ' + host + ': ' + err.message + '\r\n\r$ ');
    }
}
