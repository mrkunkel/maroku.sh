export const description = "Print current user";

export async function execute(args) {
    window.term.write('\rmaroku\r\n\r$ ');
}
