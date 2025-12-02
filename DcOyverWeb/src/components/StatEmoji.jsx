import { useEffect, useRef } from 'react'

export default function StatEmoji({ type, size = 20 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = size
    canvas.height = size

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    switch (type) {
      case 'heart':
        // Premium Red Heart - Nadir tasarım
        // Glow effect
        const heartGlow = ctx.createRadialGradient(size * 0.5, size * 0.5, 0, size * 0.5, size * 0.5, size * 0.5)
        heartGlow.addColorStop(0, 'rgba(239, 68, 68, 0.4)')
        heartGlow.addColorStop(1, 'rgba(239, 68, 68, 0)')
        ctx.fillStyle = heartGlow
        ctx.beginPath()
        ctx.moveTo(size * 0.5, size * 0.7)
        ctx.bezierCurveTo(size * 0.5, size * 0.5, size * 0.2, size * 0.3, size * 0.2, size * 0.5)
        ctx.bezierCurveTo(size * 0.2, size * 0.7, size * 0.5, size * 0.9, size * 0.5, size * 0.9)
        ctx.bezierCurveTo(size * 0.5, size * 0.9, size * 0.8, size * 0.7, size * 0.8, size * 0.5)
        ctx.bezierCurveTo(size * 0.8, size * 0.3, size * 0.5, size * 0.5, size * 0.5, size * 0.7)
        ctx.fill()
        
        // Heart gradient
        const heartGradient = ctx.createLinearGradient(size * 0.2, size * 0.3, size * 0.8, size * 0.9)
        heartGradient.addColorStop(0, '#FF6B6B')
        heartGradient.addColorStop(0.5, '#EF4444')
        heartGradient.addColorStop(1, '#DC2626')
        ctx.fillStyle = heartGradient
        ctx.beginPath()
        ctx.moveTo(size * 0.5, size * 0.7)
        ctx.bezierCurveTo(size * 0.5, size * 0.5, size * 0.2, size * 0.3, size * 0.2, size * 0.5)
        ctx.bezierCurveTo(size * 0.2, size * 0.7, size * 0.5, size * 0.9, size * 0.5, size * 0.9)
        ctx.bezierCurveTo(size * 0.5, size * 0.9, size * 0.8, size * 0.7, size * 0.8, size * 0.5)
        ctx.bezierCurveTo(size * 0.8, size * 0.3, size * 0.5, size * 0.5, size * 0.5, size * 0.7)
        ctx.fill()
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.beginPath()
        ctx.arc(size * 0.4, size * 0.4, size * 0.1, 0, Math.PI * 2)
        ctx.fill()
        break

      case 'members':
        // Premium Two People Icon - Nadir tasarım
        ctx.fillStyle = '#9CA3AF'
        // Person 1 - Left
        // Head
        ctx.beginPath()
        ctx.arc(size * 0.3, size * 0.35, size * 0.12, 0, Math.PI * 2)
        ctx.fill()
        // Body
        ctx.beginPath()
        ctx.arc(size * 0.3, size * 0.65, size * 0.18, 0, Math.PI, true)
        ctx.fill()
        // Person 2 - Right
        // Head
        ctx.beginPath()
        ctx.arc(size * 0.7, size * 0.35, size * 0.12, 0, Math.PI * 2)
        ctx.fill()
        // Body
        ctx.beginPath()
        ctx.arc(size * 0.7, size * 0.65, size * 0.18, 0, Math.PI, true)
        ctx.fill()
        // Connection line
        ctx.strokeStyle = '#6B7280'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(size * 0.42, size * 0.5)
        ctx.lineTo(size * 0.58, size * 0.5)
        ctx.stroke()
        break

      case 'online':
        // Green circle
        ctx.fillStyle = '#10B981'
        ctx.beginPath()
        ctx.arc(size * 0.5, size * 0.5, size * 0.4, 0, Math.PI * 2)
        ctx.fill()
        // Inner glow
        ctx.fillStyle = '#34D399'
        ctx.beginPath()
        ctx.arc(size * 0.5, size * 0.5, size * 0.25, 0, Math.PI * 2)
        ctx.fill()
        break

      case 'voice':
        // Premium Purple Microphone - Nadir tasarım
        const micGradient = ctx.createLinearGradient(size * 0.35, size * 0.3, size * 0.65, size * 0.7)
        micGradient.addColorStop(0, '#C4B5FD')
        micGradient.addColorStop(0.5, '#A78BFA')
        micGradient.addColorStop(1, '#8B5CF6')
        ctx.fillStyle = micGradient
        // Mic body
        ctx.fillRect(size * 0.35, size * 0.3, size * 0.3, size * 0.4)
        // Mic top highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.fillRect(size * 0.35, size * 0.3, size * 0.3, size * 0.1)
        // Mic grill
        ctx.strokeStyle = '#7C3AED'
        ctx.lineWidth = 1.5
        for (let i = 0; i < 3; i++) {
          ctx.beginPath()
          ctx.moveTo(size * 0.4, size * 0.4 + i * size * 0.1)
          ctx.lineTo(size * 0.6, size * 0.4 + i * size * 0.1)
          ctx.stroke()
        }
        // Mic stand
        ctx.fillStyle = '#8B5CF6'
        ctx.fillRect(size * 0.4, size * 0.7, size * 0.2, size * 0.15)
        // Stand base
        ctx.fillRect(size * 0.35, size * 0.85, size * 0.3, size * 0.05)
        break

      case 'text':
        // Premium Purple Speech Bubble - Nadir tasarım
        const bubbleGradient = ctx.createRadialGradient(size * 0.5, size * 0.4, 0, size * 0.5, size * 0.4, size * 0.3)
        bubbleGradient.addColorStop(0, '#C4B5FD')
        bubbleGradient.addColorStop(1, '#8B5CF6')
        ctx.fillStyle = bubbleGradient
        // Main bubble
        ctx.beginPath()
        ctx.arc(size * 0.5, size * 0.4, size * 0.3, 0, Math.PI * 2)
        ctx.fill()
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.beginPath()
        ctx.arc(size * 0.45, size * 0.35, size * 0.15, 0, Math.PI * 2)
        ctx.fill()
        // Speech bubble tail
        ctx.fillStyle = '#8B5CF6'
        ctx.beginPath()
        ctx.moveTo(size * 0.4, size * 0.7)
        ctx.lineTo(size * 0.3, size * 0.85)
        ctx.lineTo(size * 0.5, size * 0.75)
        ctx.closePath()
        ctx.fill()
        // Text lines
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(size * 0.4, size * 0.35, size * 0.2, size * 0.04)
        ctx.fillRect(size * 0.4, size * 0.43, size * 0.15, size * 0.04)
        ctx.fillRect(size * 0.4, size * 0.51, size * 0.18, size * 0.04)
        break

      case 'camera':
        // Premium Orange Camera - Nadir tasarım
        const cameraGradient = ctx.createLinearGradient(size * 0.2, size * 0.3, size * 0.8, size * 0.7)
        cameraGradient.addColorStop(0, '#FB923C')
        cameraGradient.addColorStop(0.5, '#F97316')
        cameraGradient.addColorStop(1, '#EA580C')
        ctx.fillStyle = cameraGradient
        // Camera body
        ctx.fillRect(size * 0.2, size * 0.3, size * 0.6, size * 0.4)
        // Top highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.fillRect(size * 0.2, size * 0.3, size * 0.6, size * 0.1)
        // Lens outer ring
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.arc(size * 0.5, size * 0.5, size * 0.22, 0, Math.PI * 2)
        ctx.fill()
        // Lens inner
        const lensGradient = ctx.createRadialGradient(size * 0.45, size * 0.45, 0, size * 0.5, size * 0.5, size * 0.15)
        lensGradient.addColorStop(0, '#1F2937')
        lensGradient.addColorStop(1, '#111827')
        ctx.fillStyle = lensGradient
        ctx.beginPath()
        ctx.arc(size * 0.5, size * 0.5, size * 0.15, 0, Math.PI * 2)
        ctx.fill()
        // Lens highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.beginPath()
        ctx.arc(size * 0.48, size * 0.48, size * 0.05, 0, Math.PI * 2)
        ctx.fill()
        break

      case 'files':
        // Premium Orange Document - Nadir tasarım
        const docGradient = ctx.createLinearGradient(size * 0.2, size * 0.2, size * 0.8, size * 0.8)
        docGradient.addColorStop(0, '#FB923C')
        docGradient.addColorStop(0.5, '#F97316')
        docGradient.addColorStop(1, '#EA580C')
        ctx.fillStyle = docGradient
        // Document body
        ctx.beginPath()
        ctx.moveTo(size * 0.2, size * 0.2)
        ctx.lineTo(size * 0.5, size * 0.2)
        ctx.lineTo(size * 0.6, size * 0.35)
        ctx.lineTo(size * 0.8, size * 0.35)
        ctx.lineTo(size * 0.8, size * 0.8)
        ctx.lineTo(size * 0.2, size * 0.8)
        ctx.closePath()
        ctx.fill()
        // Fold corner shadow
        ctx.fillStyle = '#DC2626'
        ctx.beginPath()
        ctx.moveTo(size * 0.5, size * 0.2)
        ctx.lineTo(size * 0.6, size * 0.35)
        ctx.lineTo(size * 0.5, size * 0.35)
        ctx.closePath()
        ctx.fill()
        // Fold corner highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.beginPath()
        ctx.moveTo(size * 0.5, size * 0.2)
        ctx.lineTo(size * 0.55, size * 0.25)
        ctx.lineTo(size * 0.5, size * 0.3)
        ctx.closePath()
        ctx.fill()
        // Text lines
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(size * 0.3, size * 0.5, size * 0.4, size * 0.04)
        ctx.fillRect(size * 0.3, size * 0.58, size * 0.35, size * 0.04)
        ctx.fillRect(size * 0.3, size * 0.66, size * 0.38, size * 0.04)
        break

      default:
        break
    }
  }, [type, size])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ imageRendering: 'crisp-edges' }}
    />
  )
}

