import { useEffect, useState } from 'react'

export function useSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('saaf-sidebar-collapsed') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('saaf-sidebar-collapsed', collapsed ? 'true' : 'false')
  }, [collapsed])

  const toggle = () => setCollapsed((c) => !c)
  const collapse = () => setCollapsed(true)
  const expand = () => setCollapsed(false)

  return { collapsed, toggle, collapse, expand }
}