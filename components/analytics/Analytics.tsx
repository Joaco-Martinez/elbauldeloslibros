import Script from 'next/script';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim();
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
const SAFE_ID = /^[A-Za-z0-9-]+$/;

/**
 * Carga Google Analytics 4 y el Meta Pixel solo si sus ids están en las variables de entorno.
 * Los eventos de compra se mandan con track() (lib/analytics.ts).
 */
export function Analytics() {
  const ga = GA_ID && SAFE_ID.test(GA_ID) ? GA_ID : null;
  const pixel = PIXEL_ID && SAFE_ID.test(PIXEL_ID) ? PIXEL_ID : null;
  if (!ga && !pixel) return null;
  return (
    <>
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${ga}');`}
          </Script>
        </>
      )}
      {pixel && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
