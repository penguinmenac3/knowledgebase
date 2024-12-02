/**
 * @type {import('vite').UserConfig}
 */
const config = {
    // ...
    base: "/knowledgebase/",
    server: {
        watch: {
            ignored: ['!**/dist/'],
            usePolling: true
        }
    }
}

export default config