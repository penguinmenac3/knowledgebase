/**
 * @type {import('vite').UserConfig}
 */
const config = {
    // ...
    base: "/knowledgebase/",
    server: {
        host: "localhost",
        watch: {
            ignored: ['!**/dist/'],
            usePolling: true
        }
    }
}

export default config