export const description = "Show network interface configuration";

export async function execute(args) {
    window.term.write('\reth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\r\n');
    window.term.write('        inet 127.0.0.1  netmask 255.0.0.0  broadcast 127.255.255.255\r\n');
    window.term.write('        inet6 fe80::1  prefixlen 64  scopeid 0x20<link>\r\n');
    window.term.write('        ether 00:00:00:00:00:00  txqueuelen 1000  (Ethernet)\r\n');
    window.term.write('        RX packets 1024  bytes 89234 (89.2 KB)\r\n');
    window.term.write('        RX errors 0  dropped 0  overruns 0  frame 0\r\n');
    window.term.write('        TX packets 1024  bytes 89234 (89.2 KB)\r\n');
    window.term.write('        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0\r\n');
    window.term.write('\r\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\r\n');
    window.term.write('        inet 127.0.0.1  netmask 255.0.0.0\r\n');
    window.term.write('        inet6 ::1  prefixlen 128  scopeid 0x10<host>\r\n');
    window.term.write('        loop  txqueuelen 1000  (Local Loopback)\r\n');
    window.term.write('        RX packets 512  bytes 45678 (45.6 KB)\r\n');
    window.term.write('        RX errors 0  dropped 0  overruns 0  frame 0\r\n');
    window.term.write('        TX packets 512  bytes 45678 (45.6 KB)\r\n');
    window.term.write('        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0\r\n');
    window.term.write('\r$ ');
}
