'use client'
import { useLayoutEffect } from 'react'
import { useSettingStore } from '@/store/setting'

function StoreProvider({ children, isProtected = false }: { children: React.ReactNode; isProtected?: boolean }) {
  const { setIsProtected } = useSettingStore()

  useLayoutEffect(() => {
    setIsProtected(isProtected)
  }, [setIsProtected, isProtected])
  return children
}

export default StoreProvider
