import React, { useState, useEffect, useRef } from 'react'
import { Brain, Sparkles, Target, Clock, BookOpen } from 'lucide-react'

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [fadeIn, setFadeIn] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const [pulse, setPulse] = useState(false)
  const [floatingIcons] = useState(() => ([
    { icon: Target, delay: 0, x: 20, y: 30 },
    { icon: Clock, delay: 200, x: 80, y: 20 },
    { icon: BookOpen, delay: 400, x: 60, y: 70 },
    { icon: Sparkles, delay: 600, x: 30, y: 60 }
  ]))
  const [particles] = useState(() => (
    Array.from({ length: 15 }).map((_, i) => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: i * 0.5,
      duration: 3 + Math.random() * 2
    }))
  ))
  const containerRef = useRef(null)

  // floatingIcons and particles are created once during mount via lazy state initializers

  // Start animations
  useEffect(() => {
    // Initial fade in
    setTimeout(() => {
      setFadeIn(true)
      setPulse(true)
    }, 100)

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          
          // Sequence of exit animations
          setTimeout(() => {
            setFadeOut(true)
            setTimeout(() => {
              setIsVisible(false)
              setTimeout(() => {
                if (typeof onComplete === 'function') onComplete()
              }, 100)
            }, 800)
          }, 500)
          
          return 100
        }
        
        // Non-linear progress for more natural feel
        const increment = prev < 30 ? 4 : prev < 70 ? 3 : 2
        const nextProgress = prev + increment + Math.random() * 2
        return nextProgress > 100 ? 100 : nextProgress
      })
    }, 80)

    return () => clearInterval(progressInterval)
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-linear-to-br from-indigo-500 via-purple-600 to-pink-500 overflow-hidden transition-all duration-700 ease-out ${
        !fadeIn ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      } ${
        fadeOut ? 'opacity-0 scale-105' : ''
      }`}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating particles */}
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`
            }}
          />
        ))}
        
        {/* Gradient orbs */}
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-pink-400/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-400/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Floating Icons Animation */}
      {floatingIcons.map(({ icon: Icon, delay, x, y }) => (
        <div
          key={delay}
          className="absolute text-white/20 animate-float"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            animationDelay: `${delay}ms`,
            animationDuration: '3s'
          }}
        >
          <Icon className="w-8 h-8" />
        </div>
      ))}

      {/* Main Content */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center max-w-xs sm:max-w-lg w-full transition-all duration-1000 ${
          !fadeIn ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'
        } ${
          fadeOut ? 'opacity-0 -translate-y-8' : ''
        }`}
      >
        {/* Logo Container with Animations */}
        <div className="relative mb-8">
          {/* Outer glow */}
          <div className={`absolute inset-0 bg-white/20 rounded-3xl blur-xl transition-all duration-1000 ${
            pulse ? 'scale-125 opacity-50' : 'scale-100 opacity-30'
          }`} />
          
          {/* Main logo container */}
          <div 
            className={`relative w-32 h-32 bg-white/20 backdrop-blur-xl rounded-3xl border-2 border-white/30 shadow-2xl flex items-center justify-center transition-all duration-500 ${
              pulse ? 'scale-110 border-white/50' : 'scale-100'
            }`}
          >
            {/* Animated brain icon */}
            <div className="relative">
              <Brain className="w-16 h-16 text-white" />
              
              {/* Sparkle effects */}
              <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-yellow-300 animate-spin-slow" />
              <Sparkles className="absolute -bottom-2 -left-2 w-4 h-4 text-cyan-300 animate-ping" style={{ animationDelay: '1s' }} />
            </div>
            
            {/* Rotating ring */}
            <div className="absolute inset-0 rounded-3xl border-2 border-transparent border-t-white/50 border-r-white/30 animate-spin-slow" />
          </div>
        </div>

        {/* App Name with Gradient Text */}
        <div className="text-center mb-2">
          <h1 className="text-5xl sm:text-6xl font-black bg-linear-to-r from-white via-cyan-100 to-pink-100 bg-clip-text text-transparent mb-2 animate-gradient">
            Learnful
          </h1>
          <p className="text-white/80 text-lg sm:text-xl font-light tracking-wider">
            Your Personal Learning Planner
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-64 sm:w-80 bg-white/20 rounded-full h-2 mb-6 overflow-hidden backdrop-blur-sm">
          <div
            className="bg-linear-to-r from-cyan-300 to-pink-300 h-2 rounded-full transition-all duration-300 ease-out shadow-lg"
            style={{ width: `${progress}%` }}
          >
            {/* Progress bar shine effect */}
            <div className="w-1/2 h-full bg-white/30 animate-shine rounded-full transform skew-x-12" />
          </div>
        </div>

        {/* Loading Text with Typing Animation */}
        <div className="flex items-center gap-3 text-white/70 mb-8">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm font-medium tracking-wide">
            {progress < 20 && 'Initializing workspace...'}
            {progress >= 20 && progress < 40 && 'Loading your goals...'}
            {progress >= 40 && progress < 60 && 'Syncing tasks...'}
            {progress >= 60 && progress < 80 && 'Preparing schedule...'}
            {progress >= 80 && progress < 100 && 'Almost ready...'}
            {progress >= 100 && 'Welcome to Learnful!'}
          </span>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-4 text-white/60 text-xs sm:text-sm text-center max-w-md">
          <div className="flex items-center gap-2 justify-center">
            <Target className="w-4 h-4" />
            <span>Goal Tracking</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <Clock className="w-4 h-4" />
            <span>Smart Scheduling</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <BookOpen className="w-4 h-4" />
            <span>Progress Analytics</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <Sparkles className="w-4 h-4" />
            <span>Productivity Tools</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className={`absolute bottom-8 text-white/40 text-sm transition-opacity duration-500 ${
          fadeOut ? 'opacity-0' : 'opacity-100'
        }`}
      >
        © 2024 Learnful - Transform Your Learning Journey
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        .animate-shine {
          animation: shine 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}