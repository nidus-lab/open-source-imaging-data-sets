import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Home from './index'

export default function CatchAll() {
    const router = useRouter()

    useEffect(() => {
        // If this is not the home page, redirect to home
        if (router.asPath !== '/') {
            router.replace('/')
        }
    }, [router])

    return <Home />
}