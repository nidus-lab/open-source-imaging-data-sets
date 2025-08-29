import { NextSeo } from "next-seo"
import { useEffect } from "react"
import { useRouter } from "next/router"

import 'styles/index.css'

export default function MyApp({ Component, pageProps }) {
  const router = useRouter()

  useEffect(() => {
    // Handle GitHub Pages 404 redirect
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const currentRoute = urlParams.get('currentRoute')

      if (currentRoute) {
        // Remove the currentRoute parameter from the URL
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('currentRoute')

        // Navigate to the route and replace the URL
        router.replace(`/${currentRoute}`)
      }
    }
  }, [router])

  return (
    <>
      <NextSeo
        title="Ultrasound Open Access Datasets"
        description="A list of open access ultrasound datasets."
        openGraph={{
          url: 'http://ultrasound-datasets.nidusai.ca/',
          title: 'Ultrasound Open Access Datasets',
          description: 'A list of open source imaging datasets, maintained by the NIDUS Lab and RadOSS',
          images: [
            {
              url: 'http://ultrasound-datasets.nidusai.ca/social-back.jpg',
              width: 1200,
              height: 630,
              alt: 'Ultrasound Open Access Datasets Cover',
              type: 'image/png',
            }
          ],
        }}
      />
      <Component {...pageProps} />
    </>
  )
}
