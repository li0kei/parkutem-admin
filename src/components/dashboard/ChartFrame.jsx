// =====================================================
// IMPORTS
// =====================================================

import { useEffect, useRef, useState } from "react"

// =====================================================
// CHART FRAME
// Supports both:
// 1. children as function: {({ width, height }) => <Chart />}
// 2. normal children: <ResponsiveContainer>...</ResponsiveContainer>
// =====================================================

function ChartFrame({ children, className = "" }) {
  const frameRef = useRef(null)

  const [size, setSize] = useState({
    width: 0,
    height: 0,
  })

  useEffect(() => {
    const element = frameRef.current

    if (!element) {
      return undefined
    }

    function updateSize() {
      const rect = element.getBoundingClientRect()

      setSize({
        width: Math.max(1, Math.floor(rect.width)),
        height: Math.max(1, Math.floor(rect.height)),
      })
    }

    updateSize()

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(updateSize)
    })

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

  const isReady = size.width > 1 && size.height > 1

  return (
    <div ref={frameRef} className={`min-w-0 ${className}`}>
      {isReady && typeof children === "function" ? children(size) : null}
      {isReady && typeof children !== "function" ? children : null}
    </div>
  )
}

export default ChartFrame