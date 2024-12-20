'use client'
import { useState, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import Lightbox from 'yet-another-react-lightbox'
import LightboxFullscreen from 'yet-another-react-lightbox/plugins/fullscreen'
import LightboxDownload from 'yet-another-react-lightbox/plugins/download'
import LightboxCaptions from 'yet-another-react-lightbox/plugins/captions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { isEmpty } from 'lodash-es'

import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/captions.css'

type Props = {
  data: UnsplashImage[]
}

function Unsplash(props: Props) {
  const { data = [] } = props
  const { t } = useTranslation()
  const [showLightbox, setShowLightbox] = useState<boolean>(false)
  const [lightboxIndex, setLightboxIndex] = useState<number>(0)

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
    setShowLightbox(true)
  }, [])

  if (isEmpty(data)) return null

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {data.slice(4, 8).map((item, idx) => {
          return (
            <div key={item.id} className="group/unsplash relative h-40 w-40 max-sm:h-36 max-sm:w-36">
              <picture>
                <source srcSet={item.thumbnail} type="image/jpeg" />
                <img
                  className="h-full w-full rounded-sm object-cover"
                  src={item.src}
                  title={item.title}
                  alt={item.title}
                  onClick={() => openLightbox(idx)}
                />
              </picture>
              <a
                className="absolute bottom-2 right-2 cursor-pointer rounded-full bg-white/20 p-1 text-white opacity-0 hover:bg-white/40 group-hover/unsplash:opacity-100"
                href={item.download}
                download
                target="_blank"
              >
                <Download className="h-4 w-4" />
              </a>
              <a
                className="absolute bottom-2 left-2 inline-flex w-4/5 opacity-0 group-hover/unsplash:opacity-100"
                href={item.user.link}
                target="_blank"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={item.user.avatar} />
                  <AvatarFallback>{item.user.name}</AvatarFallback>
                </Avatar>
                <p className="ml-1 truncate text-sm leading-6 text-white">{item.user.name}</p>
              </a>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between py-2">
        <p className="text-sm">
          {t('plugins.unsplash.totalPictures', { total: data.length })}
          <span
            className="cursor-pointer text-sm text-blue-500 underline-offset-2 hover:underline"
            onClick={() => openLightbox(0)}
          >
            {t('plugins.unsplash.viewAll')}
          </span>
        </p>
      </div>
      <Lightbox
        open={showLightbox}
        close={() => setShowLightbox(false)}
        slides={data.map((item) => ({
          src: item.src,
          downloadUrl: item.download,
          description: (
            <div>
              <a className="inline-flex" href={item.user.link} target="_blank">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={item.user.avatar} />
                  <AvatarFallback>{item.user.name}</AvatarFallback>
                </Avatar>
                <p className="ml-1 truncate text-sm leading-6 text-white">{item.user.name}</p>
              </a>
              <p>{item.title}</p>
            </div>
          ),
        }))}
        index={lightboxIndex}
        plugins={[LightboxFullscreen, LightboxDownload, LightboxCaptions]}
      />
    </>
  )
}

export default memo(Unsplash)
