import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useCurrentUser } from '~/hooks/useCurrentUser'

const DeveloperToolContext = createContext<DeveloperToolContextType | undefined>(undefined)

export const DEVTOOL_TAB_PARAMS = 'devtool-tab'
export const DEVTOOL_AUTO_SAVE_ID = 'devtools'
// This is generated by the react-resizable-panels library and is used to save the state of the devtools
export const DEVTOOL_AUTO_SAVE_KEY = `react-resizable-panels:${DEVTOOL_AUTO_SAVE_ID}`

export interface DeveloperToolContextType {
  isOpen: boolean
  size: number
  url: string
  open: () => void
  close: () => void
  setSize: (size: number) => void
  setUrl: (url: string) => void
}

export function DeveloperToolProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [size, setSize] = useState(0)
  const [url, setUrl] = useState('')

  return (
    <DeveloperToolContext.Provider
      value={{
        isOpen,
        size,
        url,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        setSize,
        setUrl,
      }}
    >
      {children}
    </DeveloperToolContext.Provider>
  )
}

export function useDeveloperTool(): DeveloperToolContextType {
  const context = useContext(DeveloperToolContext)
  const { currentUser } = useCurrentUser()

  const navigate = useNavigate()

  // We can copy/paste the URL of the devtools in the browser and it will open the devtools with the correct tab
  const checkParamsFromUrl = () => {
    const params = new URLSearchParams(window.location.search)
    const devtoolTab = params.get(DEVTOOL_TAB_PARAMS) ?? ''
    const decodedDevtoolTab = decodeURIComponent(devtoolTab)

    const isValidUser = !!currentUser

    if (decodedDevtoolTab && isValidUser) {
      navigate(decodedDevtoolTab)
      context?.open()
    }

    // Remove the params from the URL
    params.delete(DEVTOOL_TAB_PARAMS)
    const url = `${window.location.pathname}`

    window.history.replaceState({}, '', url)
  }

  useEffect(() => {
    // On mounted, check the params from the URL
    checkParamsFromUrl()
  }, [])

  // Throw an error if the hook is used outside of the provider
  if (!context) {
    throw new Error('useDeveloperTool must be used within a DeveloperToolProvider')
  }

  return context
}
