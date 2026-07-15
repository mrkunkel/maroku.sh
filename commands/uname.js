export const description = "Print system information";

export async function execute(args) {
    if (args.includes('-a') || args.includes('--all')) {
        window.term.write('\rLinux frameworkd 7.1.3-ogc3.4.fc44.x86_64 #1 SMP PREEMPT_DYNAMIC Fri Jul 10 04:06:08 UTC 2026 x86_64 GNU/Linux\r\n\r$ ');
    } else {
        window.term.write('\rLinux\r\n\r$ ');
    }
}
