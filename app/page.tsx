import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Sticky Navigation with Glass Effect */}
      <nav className="sticky top-0 z-50 border-b border-yellow-600/20 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section */}
            <div className="flex items-center gap-6">
              <Image 
                src="https://webinar.ostaran.com/logo.jpg" 
                alt="Logo" 
                width={120} 
                height={40}
                className="h-10 w-auto"
              />
              <div className="hidden md:block h-8 w-px bg-gradient-to-b from-transparent via-yellow-600/50 to-transparent"></div>
              <Image 
                src="https://webinar.ostaran.com/oStaran.png" 
                alt="oStaran" 
                width={100} 
                height={30}
                className="h-8 w-auto hidden md:block"
              />
            </div>
            
            {/* Auth Buttons */}
            <div className="flex gap-4">
              <Link
                href="/auth/login"
                className="px-6 py-2.5 text-yellow-400 hover:text-yellow-300 font-medium transition-all duration-300 hover:scale-105"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-6 py-2.5 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 text-black rounded-xl font-semibold hover:shadow-2xl hover:shadow-yellow-600/50 transition-all duration-300 hover:scale-105 bg-[length:200%_100%] hover:bg-right animate-shimmer"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Animated Background */}
      <section className="relative overflow-hidden">
        {/* Animated Gradient Orbs */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-[500px] h-[500px] bg-yellow-600 rounded-full filter blur-[150px] animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-[600px] h-[600px] bg-yellow-500 rounded-full filter blur-[180px] animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-yellow-400 rounded-full filter blur-[200px] animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="text-center">
            {/* Main Heading with Gradient */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white mb-6 leading-tight">
              Elite AI Agent
              <span className="block mt-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent animate-gradient">
                Platform
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl sm:text-2xl lg:text-3xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Experience <span className="text-yellow-400 font-semibold">premium AI conversations</span> powered by Claude, GPT-4, and Gemini
              with intelligent personas crafted for professionals
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/auth/signup"
                className="group relative px-10 py-5 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 text-black rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-yellow-600/60 transition-all duration-300 hover:scale-110 bg-[length:200%_100%] animate-shimmer overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Free Trial
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              
              <Link
                href="/auth/login"
                className="group px-10 py-5 bg-white/5 backdrop-blur-sm border-2 border-yellow-600/40 text-yellow-400 rounded-2xl font-bold text-lg hover:bg-yellow-600/20 hover:border-yellow-500/60 transition-all duration-300 hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  Watch Demo
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar with Glass Effect */}
      <section className="border-y border-yellow-600/20 bg-black/40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '3+', label: 'AI Models', icon: '🤖' },
              { number: '6', label: 'Smart Personas', icon: '🎭' },
              { number: '99.9%', label: 'Uptime', icon: '⚡' },
              { number: '24/7', label: 'Support', icon: '💬' },
            ].map((stat, i) => (
              <div key={i} className="text-center group cursor-pointer">
                <div className="text-5xl mb-2 group-hover:scale-110 transition-transform">{stat.icon}</div>
                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent mb-2 group-hover:scale-105 transition-transform">
                  {stat.number}
                </div>
                <div className="text-gray-400 text-sm uppercase tracking-widest font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Features Grid */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Premium Features
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-yellow-600 to-yellow-400 mx-auto mb-6"></div>
            <p className="text-xl sm:text-2xl text-gray-400 max-w-3xl mx-auto">
              Everything you need for intelligent AI conversations
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🤖',
                title: 'Multiple AI Models',
                description: 'Access Claude Sonnet 4, GPT-4, and Gemini Pro. Switch between models seamlessly based on your needs.',
                gradient: 'from-blue-600/20 to-blue-400/20'
              },
              {
                icon: '🎭',
                title: 'Smart Personas',
                description: 'AI adapts to Researcher, Professor, Student, Marketing Manager, and HR Manager roles for contextual responses.',
                gradient: 'from-purple-600/20 to-purple-400/20'
              },
              {
                icon: '💬',
                title: 'Conversation Memory',
                description: 'Maintain context across multiple chat sessions with intelligent thread management and history.',
                gradient: 'from-green-600/20 to-green-400/20'
              },
              {
                icon: '🌊',
                title: 'Streaming Responses',
                description: 'Experience real-time AI responses with smooth streaming for natural conversation flow.',
                gradient: 'from-cyan-600/20 to-cyan-400/20'
              },
              {
                icon: '🎨',
                title: 'Temperature Control',
                description: 'Fine-tune creativity vs precision with adjustable temperature settings for each conversation.',
                gradient: 'from-pink-600/20 to-pink-400/20'
              },
              {
                icon: '🔐',
                title: 'Enterprise Security',
                description: 'Bank-level encryption, secure authentication, and complete data privacy for your conversations.',
                gradient: 'from-red-600/20 to-red-400/20'
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative bg-gradient-to-br from-gray-900/90 to-black/90 border border-yellow-600/20 rounded-3xl p-8 hover:border-yellow-500/50 transition-all duration-500 hover:scale-105 backdrop-blur-sm overflow-hidden"
              >
                {/* Hover Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                {/* Card Content */}
                <div className="relative z-10">
                  <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-yellow-400 transition-colors">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">{feature.description}</p>
                </div>

                {/* Corner Accent */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-600/30 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personas Showcase with Slider Effect */}
      <section className="py-24 lg:py-32 bg-gradient-to-b from-transparent via-yellow-600/10 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Intelligent Personas
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-yellow-600 to-yellow-400 mx-auto mb-6"></div>
            <p className="text-xl sm:text-2xl text-gray-400 max-w-3xl mx-auto">
              AI that adapts to your professional context
            </p>
          </div>

          {/* Persona Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🔬', title: 'Researcher', desc: 'Deep analysis & citations', color: 'from-blue-600 to-blue-400', border: 'border-blue-500' },
              { icon: '👨‍🏫', title: 'Professor', desc: 'Educational & structured', color: 'from-green-600 to-green-400', border: 'border-green-500' },
              { icon: '🎓', title: 'Student', desc: 'Learning & exploration', color: 'from-purple-600 to-purple-400', border: 'border-purple-500' },
              { icon: '📊', title: 'Marketing Manager', desc: 'Strategic & persuasive', color: 'from-orange-600 to-orange-400', border: 'border-orange-500' },
              { icon: '👥', title: 'HR Manager', desc: 'Empathetic & professional', color: 'from-pink-600 to-pink-400', border: 'border-pink-500' },
              { icon: '💬', title: 'Default', desc: 'Balanced & versatile', color: 'from-gray-600 to-gray-400', border: 'border-gray-500' },
            ].map((persona, i) => (
              <div
                key={i}
                className="group relative bg-black/60 backdrop-blur-md border-2 border-yellow-600/20 rounded-2xl p-6 hover:border-yellow-500/60 transition-all duration-300 cursor-pointer hover:scale-105 overflow-hidden"
              >
                {/* Animated Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${persona.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}></div>
                
                {/* Content */}
                <div className="relative flex items-center gap-5">
                  <div className="text-5xl group-hover:scale-125 transition-transform duration-300">{persona.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-yellow-400 transition-colors">{persona.title}</h3>
                    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{persona.desc}</p>
                  </div>
                </div>

                {/* Glow Effect */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${persona.color} rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500 -z-10`}></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium CTA Section */}
      <section className="py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-r from-yellow-600/30 via-yellow-500/30 to-yellow-600/30 border-2 border-yellow-600/40 rounded-[3rem] p-12 lg:p-16 text-center overflow-hidden backdrop-blur-sm">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 via-transparent to-yellow-600/20 animate-pulse"></div>
            
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-yellow-600/20 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-yellow-500/20 rounded-full filter blur-3xl"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                Ready to Experience
                <span className="block mt-2 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  Elite AI?
                </span>
              </h2>
              <p className="text-xl sm:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto">
                Join thousands of professionals using our premium AI platform
              </p>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-3 px-12 py-6 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 text-black rounded-2xl font-bold text-xl hover:shadow-2xl hover:shadow-yellow-600/60 transition-all duration-300 hover:scale-110 bg-[length:200%_100%] animate-shimmer"
              >
                Start Your Free Trial
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="border-t border-yellow-600/20 bg-black/60 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-4 mb-6">
                <Image 
                  src="https://webinar.ostaran.com/logo.jpg" 
                  alt="Logo" 
                  width={120} 
                  height={40}
                  className="h-12 w-auto"
                />
              </div>
              <p className="text-gray-400 max-w-md leading-relaxed text-lg mb-6">
                Premium AI Agent Platform powered by cutting-edge language models and intelligent personas.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-12 h-12 rounded-full bg-yellow-600/20 border border-yellow-600/40 flex items-center justify-center hover:bg-yellow-600/30 hover:border-yellow-600/60 transition-all hover:scale-110">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="w-12 h-12 rounded-full bg-yellow-600/20 border border-yellow-600/40 flex items-center justify-center hover:bg-yellow-600/30 hover:border-yellow-600/60 transition-all hover:scale-110">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="#" className="w-12 h-12 rounded-full bg-yellow-600/20 border border-yellow-600/40 flex items-center justify-center hover:bg-yellow-600/30 hover:border-yellow-600/60 transition-all hover:scale-110">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>
            
            {/* Product Links */}
            <div>
              <h3 className="text-white font-bold text-lg mb-6">Product</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-yellow-400 transition-colors hover:translate-x-1 inline-block">Features</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors hover:translate-x-1 inline-block">Pricing</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors hover:translate-x-1 inline-block">Documentation</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors hover:translate-x-1 inline-block">API</a></li>
              </ul>
            </div>
            
            {/* Company Links */}
            <div>
              <h3 className="text-white font-bold text-lg mb-6">Company</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="https://aiwitharijit.com" target="_blank" className="hover:text-yellow-400 transition-colors hover:translate-x-1 inline-block">AIwithArijit.com</a></li>
                <li><a href="https://ostaran.com" target="_blank" className="hover:text-yellow-400 transition-colors hover:translate-x-1 inline-block">oStaran.com</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors hover:translate-x-1 inline-block">Contact</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors hover:translate-x-1 inline-block">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="border-t border-yellow-600/20 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-center sm:text-left">
              &copy; 2025 AIwithArijit.com & oStaran. All rights reserved.
            </p>
            <div className="flex gap-6 text-gray-400 text-sm">
              <a href="#" className="hover:text-yellow-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-yellow-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-yellow-400 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Animations - Add this to globals.css */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: 0% center; }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 5s ease infinite;
        }
      `}</style>
    </div>
  )
}
