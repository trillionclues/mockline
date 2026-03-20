import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js'

export function initLemonSqueezy() {
    lemonSqueezySetup({
        apiKey: process.env.LEMONSQUEEZY_API_KEY!,
        onError: (error) => console.error('[LemonSqueezy]', error),
    })
}
