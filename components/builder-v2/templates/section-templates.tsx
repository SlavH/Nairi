'use client';

import React, { useState } from 'react';
import { Layout, Type, Image, Grid, Users, Mail, ShoppingBag, Star, ChevronRight, Sparkles, Zap, Globe, Heart, Award, TrendingUp } from 'lucide-react';

interface SectionTemplate {
  id: string;
  name: string;
  category: string;
  preview: string;
  code: string;
  tags: string[];
}

const sectionTemplates: SectionTemplate[] = [
  // Hero Sections
  {
    id: 'hero-gradient',
    name: 'Gradient Hero',
    category: 'Hero',
    preview: '🌈',
    tags: ['hero', 'gradient', 'animated'],
    code: `<section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-black">
  <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
  <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
  <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
  <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
    <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 animate-fade-in-up">
      Build Something <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Amazing</span>
    </h1>
    <p className="text-xl md:text-2xl text-gray-300 mb-8 animate-fade-in-up delay-200">Create stunning websites with our AI-powered builder</p>
    <div className="flex gap-4 justify-center animate-fade-in-up delay-300">
      <button className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:scale-105 transition-transform">Get Started</button>
      <button className="px-8 py-4 border border-white/30 text-white rounded-full font-semibold hover:bg-white/10 transition-colors">Learn More</button>
    </div>
  </div>
</section>`
  },
  {
    id: 'hero-glassmorphism',
    name: 'Glassmorphism Hero',
    category: 'Hero',
    preview: '✨',
    tags: ['hero', 'glass', 'modern'],
    code: `<section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
    <div className="absolute top-40 left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
  </div>
  <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-12 max-w-2xl mx-4 shadow-2xl">
    <h1 className="text-5xl font-bold text-white mb-4 text-center">Welcome to the Future</h1>
    <p className="text-white/80 text-center text-lg mb-8">Experience the next generation of web design</p>
    <div className="flex justify-center">
      <button className="px-8 py-3 bg-white text-purple-600 rounded-full font-semibold hover:scale-105 transition-transform shadow-lg">Start Building</button>
    </div>
  </div>
</section>`
  },
  // Viral / Ad-style sections
  {
    id: 'viral-hero',
    name: 'Viral Hero',
    category: 'Hero',
    preview: '🔥',
    tags: ['viral', 'hero', 'gradient', 'cta', 'full-bleed'],
    code: `<section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-violet-950 via-fuchsia-950 to-black">
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-fuchsia-500/20 rounded-full blur-3xl animate-[blob_8s_ease-in-out_infinite]"></div>
  <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
    <h1 className="text-5xl md:text-7xl font-bold font-['Syne'] text-white mb-6">
      The only tool you <span className="bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">need</span>
    </h1>
    <p className="text-xl text-white/80 mb-10">Get results in 30 seconds. No setup, no code.</p>
    <button className="px-10 py-4 bg-white text-black rounded-full font-semibold hover:scale-105 transition-transform shadow-xl">Get started free</button>
  </div>
</section>`
  },
  {
    id: 'social-proof-bar',
    name: 'Social Proof Bar',
    category: 'Hero',
    preview: '✓',
    tags: ['viral', 'social-proof', 'trust', 'logos'],
    code: `<section className="py-8 px-4 border-y border-white/10 bg-black/50">
  <div className="max-w-5xl mx-auto text-center">
    <p className="text-sm text-white/60 mb-6">Trusted by 10,000+ creators</p>
    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-80">
      {['Company A', 'Company B', 'Company C', 'Company D'].map((name, i) => (
        <span key={i} className="text-white/70 font-semibold text-lg">{name}</span>
      ))}
    </div>
  </div>
</section>`
  },
  {
    id: 'urgency-strip',
    name: 'Urgency Strip',
    category: 'CTA',
    preview: '⏰',
    tags: ['viral', 'urgency', 'cta', 'bar'],
    code: `<section className="py-3 px-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-y border-amber-500/30">
  <div className="max-w-4xl mx-auto text-center">
    <p className="text-sm font-medium text-amber-200">Limited time — Join 10k+ users. Start free today.</p>
  </div>
</section>`
  },
  // Feature Sections
  {
    id: 'features-bento',
    name: 'Bento Grid Features',
    category: 'Features',
    preview: '📦',
    tags: ['features', 'bento', 'grid'],
    code: `<section className="py-24 px-4 bg-black">
  <div className="max-w-7xl mx-auto">
    <h2 className="text-4xl font-bold text-white text-center mb-16">Powerful Features</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2 bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-3xl p-8 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4"><Zap className="w-6 h-6 text-purple-400" /></div>
        <h3 className="text-2xl font-bold text-white mb-2">Lightning Fast</h3>
        <p className="text-gray-400">Optimized for speed with Core Web Vitals in mind</p>
      </div>
      <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-3xl p-8 border border-blue-500/20 hover:border-blue-500/40 transition-colors">
        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4"><Globe className="w-6 h-6 text-blue-400" /></div>
        <h3 className="text-xl font-bold text-white mb-2">Global CDN</h3>
        <p className="text-gray-400">Deploy worldwide instantly</p>
      </div>
      <div className="bg-gradient-to-br from-pink-900/50 to-pink-800/30 rounded-3xl p-8 border border-pink-500/20 hover:border-pink-500/40 transition-colors">
        <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4"><Heart className="w-6 h-6 text-pink-400" /></div>
        <h3 className="text-xl font-bold text-white mb-2">User Friendly</h3>
        <p className="text-gray-400">Intuitive drag-and-drop interface</p>
      </div>
      <div className="md:col-span-2 bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-3xl p-8 border border-green-500/20 hover:border-green-500/40 transition-colors">
        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4"><Award className="w-6 h-6 text-green-400" /></div>
        <h3 className="text-2xl font-bold text-white mb-2">Award Winning Design</h3>
        <p className="text-gray-400">Create stunning websites that stand out from the crowd</p>
      </div>
    </div>
  </div>
</section>`
  },
  // Testimonials
  {
    id: 'testimonials-cards',
    name: 'Testimonial Cards',
    category: 'Testimonials',
    preview: '💬',
    tags: ['testimonials', 'cards', 'social-proof'],
    code: `<section className="py-24 px-4 bg-gradient-to-b from-gray-900 to-black">
  <div className="max-w-7xl mx-auto">
    <h2 className="text-4xl font-bold text-white text-center mb-4">Loved by Thousands</h2>
    <p className="text-gray-400 text-center mb-16">See what our customers are saying</p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[
        { name: 'Sarah Johnson', role: 'CEO, TechStart', quote: 'This builder transformed how we create websites. Absolutely incredible!', avatar: '👩‍💼' },
        { name: 'Mike Chen', role: 'Designer', quote: 'The AI suggestions are mind-blowing. It understands exactly what I need.', avatar: '👨‍🎨' },
        { name: 'Emily Davis', role: 'Founder', quote: 'We launched our site in hours instead of weeks. Game changer!', avatar: '👩‍🚀' }
      ].map((testimonial, i) => (
        <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all hover:-translate-y-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">{testimonial.avatar}</div>
            <div>
              <h4 className="text-white font-semibold">{testimonial.name}</h4>
              <p className="text-gray-400 text-sm">{testimonial.role}</p>
            </div>
          </div>
          <p className="text-gray-300 italic">"{testimonial.quote}"</p>
          <div className="flex gap-1 mt-4">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}</div>
        </div>
      ))}
    </div>
  </div>
</section>`
  },
  // Pricing
  {
    id: 'pricing-gradient',
    name: 'Gradient Pricing',
    category: 'Pricing',
    preview: '💰',
    tags: ['pricing', 'gradient', 'cards'],
    code: `<section className="py-24 px-4 bg-black">
  <div className="max-w-6xl mx-auto">
    <h2 className="text-4xl font-bold text-white text-center mb-4">Simple Pricing</h2>
    <p className="text-gray-400 text-center mb-16">Choose the plan that works for you</p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[
        { name: 'Starter', price: '$9', features: ['5 Projects', 'Basic Analytics', 'Email Support'] },
        { name: 'Pro', price: '$29', features: ['Unlimited Projects', 'Advanced Analytics', 'Priority Support', 'Custom Domain'], popular: true },
        { name: 'Enterprise', price: '$99', features: ['Everything in Pro', 'Team Collaboration', 'API Access', 'SLA'] }
      ].map((plan, i) => (
        <div key={i} className={\`relative rounded-3xl p-8 \${plan.popular ? 'bg-gradient-to-br from-purple-600 to-pink-600 scale-105' : 'bg-white/5 border border-white/10'}\`}>
          {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-black text-sm font-semibold rounded-full">Most Popular</div>}
          <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
          <div className="text-4xl font-bold text-white mb-6">{plan.price}<span className="text-lg font-normal text-white/60">/mo</span></div>
          <ul className="space-y-3 mb-8">{plan.features.map((f, j) => <li key={j} className="text-white/80 flex items-center gap-2"><ChevronRight className="w-4 h-4" />{f}</li>)}</ul>
          <button className={\`w-full py-3 rounded-full font-semibold transition-all \${plan.popular ? 'bg-white text-purple-600 hover:scale-105' : 'bg-white/10 text-white hover:bg-white/20'}\`}>Get Started</button>
        </div>
      ))}
    </div>
  </div>
</section>`
  },
  // CTA
  {
    id: 'cta-gradient',
    name: 'Gradient CTA',
    category: 'CTA',
    preview: '🚀',
    tags: ['cta', 'gradient', 'action'],
    code: `<section className="py-24 px-4">
  <div className="max-w-4xl mx-auto relative">
    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-xl opacity-50"></div>
    <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-center">
      <h2 className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
      <p className="text-white/80 text-lg mb-8">Join thousands of creators building amazing websites</p>
      <div className="flex gap-4 justify-center flex-wrap">
        <button className="px-8 py-4 bg-white text-purple-600 rounded-full font-semibold hover:scale-105 transition-transform shadow-lg">Start Free Trial</button>
        <button className="px-8 py-4 border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-colors">Contact Sales</button>
      </div>
    </div>
  </div>
</section>`
  },
  // Footer
  {
    id: 'footer-modern',
    name: 'Modern Footer',
    category: 'Footer',
    preview: '📍',
    tags: ['footer', 'links', 'modern'],
    code: `<footer className="bg-black border-t border-white/10 py-16 px-4">
  <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8">
    <div className="col-span-2">
      <h3 className="text-2xl font-bold text-white mb-4">YourBrand</h3>
      <p className="text-gray-400 mb-6">Building the future of web design, one pixel at a time.</p>
      <div className="flex gap-4">{['Twitter', 'GitHub', 'Discord'].map(s => <a key={s} href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors">{s[0]}</a>)}</div>
    </div>
    {[
      { title: 'Product', links: ['Features', 'Pricing', 'Templates', 'Integrations'] },
      { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
      { title: 'Support', links: ['Help Center', 'Contact', 'Status', 'API Docs'] }
    ].map((col, i) => (
      <div key={i}>
        <h4 className="text-white font-semibold mb-4">{col.title}</h4>
        <ul className="space-y-2">{col.links.map(link => <li key={link}><a href="#" className="text-gray-400 hover:text-white transition-colors">{link}</a></li>)}</ul>
      </div>
    ))}
  </div>
  <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 text-center text-gray-400">© 2024 YourBrand. All rights reserved.</div>
</footer>`
  },
  // Contact
  {
    id: 'contact-split',
    name: 'Split Contact',
    category: 'Contact',
    preview: '📧',
    tags: ['contact', 'form', 'split'],
    code: `<section className="py-24 px-4 bg-gradient-to-br from-gray-900 to-black">
  <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
    <div>
      <h2 className="text-4xl font-bold text-white mb-4">Get in Touch</h2>
      <p className="text-gray-400 mb-8">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
      <div className="space-y-6">
        {[
          { icon: '📍', title: 'Address', value: '123 Design Street, Creative City' },
          { icon: '📧', title: 'Email', value: 'hello@yourbrand.com' },
          { icon: '📞', title: 'Phone', value: '+1 (555) 123-4567' }
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-2xl">{item.icon}</div>
            <div><p className="text-gray-400 text-sm">{item.title}</p><p className="text-white">{item.value}</p></div>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
      <form className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <input type="text" placeholder="First Name" className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500" />
          <input type="text" placeholder="Last Name" className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500" />
        </div>
        <input type="email" placeholder="Email" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500" />
        <textarea placeholder="Message" rows={4} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"></textarea>
        <button type="submit" className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:scale-[1.02] transition-transform">Send Message</button>
      </form>
    </div>
  </div>
</section>`
  }
];

const categories = ['All', 'Hero', 'Features', 'Testimonials', 'Pricing', 'CTA', 'Footer', 'Contact', 'Navigation', 'Gallery'];

interface SectionTemplatesProps {
  onInsert?: (code: string) => void;
}

export function SectionTemplates({ onInsert }: SectionTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = sectionTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Layout className="w-5 h-5 text-purple-400" />
          Section Templates
        </h3>
        <input
          type="text"
          placeholder="Search sections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500"
        />
      </div>

      <div className="p-2 border-b border-white/10 flex gap-2 overflow-x-auto custom-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-purple-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <div className="grid grid-cols-2 gap-3">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-purple-500/50 transition-all cursor-pointer group"
              onClick={() => onInsert?.(template.code)}
            >
              <div className="text-4xl mb-3 text-center">{template.preview}</div>
              <h4 className="text-white text-sm font-medium text-center mb-1">{template.name}</h4>
              <p className="text-gray-500 text-xs text-center">{template.category}</p>
              <button className="w-full mt-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Insert Section
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SectionTemplates;
