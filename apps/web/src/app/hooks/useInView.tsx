"use client"

import { useEffect, useRef, useState } from "react"

// Reusable scroll-trigger hook
export function useInView(threshold = 0.15) {
    const ref = useRef<HTMLDivElement>(null)
    const [inView, setInView] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect() } },
            { threshold }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [threshold])

    return { ref, inView }
}