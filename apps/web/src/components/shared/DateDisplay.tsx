"use client"

import { useEffect, useState } from "react";

export function DateDisplay({ date }: { date: string | Date }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <span style={{ opacity: 0 }}>—</span>;
    }

    return <span>{new Date(date).toLocaleDateString()}</span>;
}