import { useEffect, useRef } from 'react'

export default function RankEmoji({ rank, size = 56 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = size
    canvas.height = size

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size)
    
    if (rank === 1) {
      // Premium Gold Crown for #1 - Nadir ve özel tasarım
      // Background glow
      const glowGradient = ctx.createRadialGradient(size * 0.5, size * 0.5, 0, size * 0.5, size * 0.5, size * 0.5)
      glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)')
      glowGradient.addColorStop(1, 'rgba(255, 140, 0, 0)')
      ctx.fillStyle = glowGradient
      ctx.fillRect(0, 0, size, size)
      
      // Crown base gradient
      gradient.addColorStop(0, '#FFD700')
      gradient.addColorStop(0.3, '#FFA500')
      gradient.addColorStop(0.7, '#FF8C00')
      gradient.addColorStop(1, '#FF6B00')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
      
      // Crown base
      ctx.fillStyle = '#FFD700'
      ctx.beginPath()
      ctx.rect(size * 0.15, size * 0.55, size * 0.7, size * 0.25)
      ctx.fill()
      
      // Crown peaks - 7 peaks for premium look
      const peaks = 7
      const peakWidth = size / peaks
      ctx.fillStyle = '#FFD700'
      for (let i = 0; i < peaks; i++) {
        const x = i * peakWidth + peakWidth * 0.5
        const peakHeight = i === Math.floor(peaks / 2) ? size * 0.35 : size * 0.28
        ctx.beginPath()
        ctx.moveTo(x, size * 0.55)
        ctx.lineTo(x - peakWidth * 0.3, peakHeight)
        ctx.lineTo(x - peakWidth * 0.1, peakHeight + size * 0.05)
        ctx.lineTo(x + peakWidth * 0.1, peakHeight + size * 0.05)
        ctx.lineTo(x + peakWidth * 0.3, peakHeight)
        ctx.closePath()
        ctx.fill()
        
        // Peak highlight
        ctx.fillStyle = '#FFF8DC'
        ctx.beginPath()
        ctx.moveTo(x, size * 0.55)
        ctx.lineTo(x - peakWidth * 0.15, peakHeight + size * 0.02)
        ctx.lineTo(x + peakWidth * 0.15, peakHeight + size * 0.02)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = '#FFD700'
      }
      
      // Center ruby gem
      const gemGradient = ctx.createRadialGradient(size * 0.5, size * 0.4, 0, size * 0.5, size * 0.4, size * 0.12)
      gemGradient.addColorStop(0, '#FF1493')
      gemGradient.addColorStop(0.5, '#DC143C')
      gemGradient.addColorStop(1, '#8B0000')
      ctx.fillStyle = gemGradient
      ctx.beginPath()
      ctx.arc(size * 0.5, size * 0.4, size * 0.12, 0, Math.PI * 2)
      ctx.fill()
      
      // Gem highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.beginPath()
      ctx.arc(size * 0.48, size * 0.38, size * 0.04, 0, Math.PI * 2)
      ctx.fill()
      
      // Side gems
      ctx.fillStyle = '#00CED1'
      ctx.beginPath()
      ctx.arc(size * 0.25, size * 0.45, size * 0.06, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(size * 0.75, size * 0.45, size * 0.06, 0, Math.PI * 2)
      ctx.fill()
    } else if (rank === 2) {
      // Premium Silver Medal for #2 - Nadir tasarım
      // Outer glow
      const glowGradient = ctx.createRadialGradient(size * 0.5, size * 0.5, 0, size * 0.5, size * 0.5, size * 0.5)
      glowGradient.addColorStop(0, 'rgba(192, 192, 192, 0.3)')
      glowGradient.addColorStop(1, 'rgba(128, 128, 128, 0)')
      ctx.fillStyle = glowGradient
      ctx.fillRect(0, 0, size, size)
      
      // Medal gradient
      gradient.addColorStop(0, '#E8E8E8')
      gradient.addColorStop(0.3, '#C0C0C0')
      gradient.addColorStop(0.7, '#A0A0A0')
      gradient.addColorStop(1, '#808080')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(size * 0.5, size * 0.5, size * 0.45, 0, Math.PI * 2)
      ctx.fill()
      
      // Inner highlight
      const innerGradient = ctx.createRadialGradient(size * 0.4, size * 0.4, 0, size * 0.5, size * 0.5, size * 0.3)
      innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)')
      innerGradient.addColorStop(1, 'rgba(192, 192, 192, 0)')
      ctx.fillStyle = innerGradient
      ctx.beginPath()
      ctx.arc(size * 0.5, size * 0.5, size * 0.35, 0, Math.PI * 2)
      ctx.fill()
      
      // Medal border
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(size * 0.5, size * 0.5, size * 0.4, 0, Math.PI * 2)
      ctx.stroke()
      
      // Number 2 with shadow
      ctx.fillStyle = '#606060'
      ctx.font = `bold ${size * 0.5}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('2', size * 0.52, size * 0.52)
      ctx.fillStyle = '#FFFFFF'
      ctx.fillText('2', size * 0.5, size * 0.5)
    } else if (rank === 3) {
      // Premium Bronze Medal for #3 - Nadir tasarım
      // Outer glow
      const glowGradient = ctx.createRadialGradient(size * 0.5, size * 0.5, 0, size * 0.5, size * 0.5, size * 0.5)
      glowGradient.addColorStop(0, 'rgba(205, 127, 50, 0.3)')
      glowGradient.addColorStop(1, 'rgba(139, 69, 19, 0)')
      ctx.fillStyle = glowGradient
      ctx.fillRect(0, 0, size, size)
      
      // Medal gradient
      gradient.addColorStop(0, '#D4A574')
      gradient.addColorStop(0.3, '#CD7F32')
      gradient.addColorStop(0.7, '#A0522D')
      gradient.addColorStop(1, '#8B4513')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(size * 0.5, size * 0.5, size * 0.45, 0, Math.PI * 2)
      ctx.fill()
      
      // Inner highlight
      const innerGradient = ctx.createRadialGradient(size * 0.4, size * 0.4, 0, size * 0.5, size * 0.5, size * 0.3)
      innerGradient.addColorStop(0, 'rgba(255, 200, 150, 0.4)')
      innerGradient.addColorStop(1, 'rgba(205, 127, 50, 0)')
      ctx.fillStyle = innerGradient
      ctx.beginPath()
      ctx.arc(size * 0.5, size * 0.5, size * 0.35, 0, Math.PI * 2)
      ctx.fill()
      
      // Medal border
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(size * 0.5, size * 0.5, size * 0.4, 0, Math.PI * 2)
      ctx.stroke()
      
      // Number 3 with shadow
      ctx.fillStyle = '#5A2A0A'
      ctx.font = `bold ${size * 0.5}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('3', size * 0.52, size * 0.52)
      ctx.fillStyle = '#FFFFFF'
      ctx.fillText('3', size * 0.5, size * 0.5)
    } else {
      // Premium Number Badge for others - Nadir ve değişik renkler
      const colorSchemes = [
        { start: '#6366F1', end: '#4F46E5', glow: '#818CF8' }, // Indigo
        { start: '#8B5CF6', end: '#7C3AED', glow: '#A78BFA' }, // Purple
        { start: '#EC4899', end: '#DB2777', glow: '#F472B6' }, // Pink
        { start: '#F59E0B', end: '#D97706', glow: '#FBBF24' }, // Amber
        { start: '#10B981', end: '#059669', glow: '#34D399' }, // Emerald
        { start: '#06B6D4', end: '#0891B2', glow: '#22D3EE' }, // Cyan
        { start: '#F97316', end: '#EA580C', glow: '#FB923C' }, // Orange
        { start: '#EF4444', end: '#DC2626', glow: '#F87171' }, // Red
      ]
      const scheme = colorSchemes[rank % colorSchemes.length]
      
      // Outer glow
      const glowGradient = ctx.createRadialGradient(size * 0.5, size * 0.5, 0, size * 0.5, size * 0.5, size * 0.5)
      glowGradient.addColorStop(0, scheme.glow + '40')
      glowGradient.addColorStop(1, scheme.glow + '00')
      ctx.fillStyle = glowGradient
      ctx.fillRect(0, 0, size, size)
      
      // Badge gradient
      gradient.addColorStop(0, scheme.start)
      gradient.addColorStop(0.5, scheme.end)
      gradient.addColorStop(1, scheme.end)
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
      
      // Inner highlight
      const innerGradient = ctx.createRadialGradient(size * 0.3, size * 0.3, 0, size * 0.5, size * 0.5, size * 0.4)
      innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)')
      innerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.fillStyle = innerGradient
      ctx.fillRect(0, 0, size, size)
      
      // Border
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2
      ctx.strokeRect(2, 2, size - 4, size - 4)
      
      // Number with shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.font = `bold ${size * 0.45}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(rank.toString(), size * 0.52, size * 0.52)
      ctx.fillStyle = '#FFFFFF'
      ctx.fillText(rank.toString(), size * 0.5, size * 0.5)
    }
  }, [rank, size])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ imageRendering: 'crisp-edges' }}
    />
  )
}

