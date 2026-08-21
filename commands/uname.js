export const description = "Print system information";

export async function execute(args) {
    const ua = navigator.userAgent;
    const platform = navigator.platform || navigator.userAgentData?.platform || 'Unknown';

    if (args.includes('-a') || args.includes('--all')) {
        window.term.write('\rmaroku.sh ' + platform + ' ' + ua + '\r\n\r$ ');
    } else {
        window.term.write('\r' + platform + '\r\n\r$ ');
    }
}
