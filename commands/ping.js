export const description = "Test network connectivity to a host";

export async function execute(args) {
    if (args.length === 0) {
        window.term.write('\r\nping: missing hostname\r\n\r$ ');
        return;
    }
    
    const host = args[0];
    window.term.write('\r\nPING ' + host + ' (' + host + ') 56(84) bytes of data.\r\n');
    
    // Check connectivity using fetch (works for HTTP/HTTPS hosts)
    const startTime = Date.now();
    
    try {
        await fetch('https://' + host, { method: 'HEAD', mode: 'no-cors' });
        const endTime = Date.now();
        const rtt = endTime - startTime;
        
        // Show ping responses
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                window.term.write('64 bytes from ' + host + ': icmp_seq=' + (i+1) + ' ttl=64 time=' + rtt + ' ms\r\n');
            }, i * 50);
        }
        
        // Show summary after all responses
        setTimeout(() => {
            window.term.write('\r\n--- ' + host + ' ping statistics ---\r\n');
            window.term.write('4 packets transmitted, 4 received, 0% packet loss, time ' + (rtt * 4) + 'ms\r\n');
            window.term.write('rtt min/avg/max/mdev = ' + rtt + '/' + rtt + '/' + rtt + '/0.000 ms\r\n');
            window.term.write('\r$ ');
        }, 250);
    } catch (err) {
        // Show failure responses
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                window.term.write('Request failed: host unreachable\r\n');
            }, i * 50);
        }
        
        setTimeout(() => {
            window.term.write('\r\n--- ' + host + ' ping statistics ---\r\n');
            window.term.write('4 packets transmitted, 0 received, 100% packet loss, time ' + (Date.now() - startTime) + 'ms\r\n');
            window.term.write('\r$ ');
        }, 250);
    }
}
