import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Toaster } from '@/components/ui/toaster'
import ThemeProvider from '@/components/ThemeProvider'
import StoreProvider from '@/components/StoreProvider'
import I18Provider from '@/components/I18nProvider'
import { SidebarProvider } from '@/components/ui/sidebar'
import AppSidebar from '@/components/AppSidebar'
import { isUndefined } from 'lodash-es'

import './globals.css'

const HEAD_SCRIPTS = process.env.HEAD_SCRIPTS as string
const ENABLE_PROTECT = !isUndefined(process.env.ACCESS_PASSWORD) && process.env.ACCESS_PASSWORD !== ''

const APP_NAME = 'Gemini Next Chat'
const APP_DEFAULT_TITLE = 'Gemini Next Chat'
const APP_TITLE_TEMPLATE = '%s - PWA App'
const APP_DESCRIPTION =
  'Deploy your private Gemini application for free with one click, supporting Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini Pro and Gemini Pro Vision models. 一键免费部署您的私人 Gemini 应用, 支持 Gemini 1.5 Pro、Gemini 1.5 Flash、Gemini Pro 和 Gemini Pro Vision 模型。'

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  keywords: ['Gemini', 'Gemini Pro', 'Gemini 1.5', 'Gemini Chat', 'AI', 'voice', 'Free Chatgpt', 'Chatgpt'],
  icons: {
    icon: {
      type: 'image/svg+xml',
      url: './logo.svg',
    },
  },
  manifest: './manifest.json',
  appleWebApp: {
    capable: false,
    statusBarStyle: 'default',
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  minimumScale: 1.0,
  maximumScale: 1.0,
  viewportFit: 'cover',
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>{HEAD_SCRIPTS ? <Script id="headscript">{HEAD_SCRIPTS}</Script> : null}</head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <StoreProvider isProtected={ENABLE_PROTECT}>
            <I18Provider>
              <SidebarProvider defaultOpen={false}>
                <AppSidebar />
                {children}
              </SidebarProvider>
            </I18Provider>
          </StoreProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}
