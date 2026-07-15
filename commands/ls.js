export const description = "List directory contents";

export async function execute(args) {
    if (args.some(a => a.includes('-a') || a.includes('-l') || a.includes('-h'))) {
        window.term.write('\r\ntotal 0\r\n');
        window.term.write('drwxr-xr-x 2 maroku maroku  64 Jul 10 04:06 .\r\n');
        window.term.write('drwxr-xr-x 3 maroku maroku  96 Jul 10 04:06 ..\r\n');
        window.term.write('-rw-r--r-- 1 maroku maroku   0 Jul 10 04:06 .bashrc\r\n');
        window.term.write('-rw-r--r-- 1 maroku maroku   0 Jul 10 04:06 .config\r\n');
        window.term.write('-rw-r--r-- 1 maroku maroku   0 Jul 10 04:06 .tetris-save\r\n');
        window.term.write('\r$ ');
    } else {
        window.term.write('\r$ ');
    }
}
