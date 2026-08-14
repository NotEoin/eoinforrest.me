import { useEffect } from 'react'

export default function usePageTitle(page?: string) {
  useEffect(() => {
    document.title = page ? `Eoin Forrest — ${page}` : 'Eoin Forrest — Portfolio'
  }, [page])
}
