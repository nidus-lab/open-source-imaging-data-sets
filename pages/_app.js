import { NextSeo } from "next-seo"

import 'styles/index.css'

export default function MyApp({ Component, pageProps }) {
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
