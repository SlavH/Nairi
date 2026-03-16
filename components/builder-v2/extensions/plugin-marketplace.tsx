'use client';

import React, { useState } from 'react';
import { 
  Package, Search, Star, Download, Check, ExternalLink, 
  Filter, Grid, List, Zap, Shield, Code, Palette,
  ShoppingCart, BarChart3, Mail, MessageSquare, Globe,
  CreditCard, Lock, Puzzle, Settings, Plus
} from 'lucide-react';

interface Plugin {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  category: string;
  icon: React.ReactNode;
  rating: number;
  downloads: number;
  installed: boolean;
  verified: boolean;
  price: 'free' | number;
  features: string[];
}

const PLUGIN_CATEGORIES = [
  { id: 'all', name: 'All Plugins', icon: <Package className="w-4 h-4" /> },
  { id: 'analytics', name: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'ecommerce', name: 'Ecommerce', icon: <ShoppingCart className="w-4 h-4" /> },
  { id: 'marketing', name: 'Marketing', icon: <Mail className="w-4 h-4" /> },
  { id: 'social', name: 'Social', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'seo', name: 'SEO', icon: <Globe className="w-4 h-4" /> },
  { id: 'payments', name: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'security', name: 'Security', icon: <Lock className="w-4 h-4" /> },
  { id: 'design', name: 'Design', icon: <Palette className="w-4 h-4" /> },
  { id: 'developer', name: 'Developer', icon: <Code className="w-4 h-4" /> },
];

const SAMPLE_PLUGINS: Plugin[] = [
  {
    id: 'google-analytics',
    name: 'Google Analytics 4',
    description: 'Track website traffic, user behavior, and conversions with Google Analytics 4 integration.',
    author: 'Nairi Team',
    version: '2.1.0',
    category: 'analytics',
    icon: <BarChart3 className="w-6 h-6 text-orange-400" />,
    rating: 4.9,
    downloads: 125000,
    installed: true,
    verified: true,
    price: 'free',
    features: ['Real-time tracking', 'Custom events', 'E-commerce tracking', 'Goal conversions']
  },
  {
    id: 'stripe-payments',
    name: 'Stripe Payments',
    description: 'Accept credit cards, Apple Pay, Google Pay, and more with Stripe integration.',
    author: 'Nairi Team',
    version: '3.0.2',
    category: 'payments',
    icon: <CreditCard className="w-6 h-6 text-purple-400" />,
    rating: 4.8,
    downloads: 98000,
    installed: false,
    verified: true,
    price: 'free',
    features: ['Credit cards', 'Digital wallets', 'Subscriptions', 'Invoicing']
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp Integration',
    description: 'Connect your forms to Mailchimp for email marketing automation.',
    author: 'Nairi Team',
    version: '1.5.0',
    category: 'marketing',
    icon: <Mail className="w-6 h-6 text-yellow-400" />,
    rating: 4.7,
    downloads: 67000,
    installed: false,
    verified: true,
    price: 'free',
    features: ['Form integration', 'Audience sync', 'Campaign triggers', 'Tags & segments']
  },
  {
    id: 'seo-optimizer',
    name: 'SEO Optimizer Pro',
    description: 'Advanced SEO tools including keyword analysis, content optimization, and rank tracking.',
    author: 'SEO Masters',
    version: '4.2.1',
    category: 'seo',
    icon: <Globe className="w-6 h-6 text-green-400" />,
    rating: 4.6,
    downloads: 45000,
    installed: false,
    verified: true,
    price: 29,
    features: ['Keyword research', 'Content scoring', 'Rank tracking', 'Competitor analysis']
  },
  {
    id: 'social-share',
    name: 'Social Share Buttons',
    description: 'Beautiful, customizable social sharing buttons for all major platforms.',
    author: 'Social Tools',
    version: '2.0.0',
    category: 'social',
    icon: <MessageSquare className="w-6 h-6 text-blue-400" />,
    rating: 4.5,
    downloads: 89000,
    installed: true,
    verified: true,
    price: 'free',
    features: ['20+ networks', 'Custom styling', 'Share counts', 'Click tracking']
  },
  {
    id: 'security-suite',
    name: 'Security Suite',
    description: 'Comprehensive security with firewall, malware scanning, and DDoS protection.',
    author: 'SecureWeb',
    version: '5.1.0',
    category: 'security',
    icon: <Shield className="w-6 h-6 text-red-400" />,
    rating: 4.9,
    downloads: 34000,
    installed: false,
    verified: true,
    price: 49,
    features: ['Firewall', 'Malware scan', 'DDoS protection', '2FA support']
  },
  {
    id: 'animation-library',
    name: 'Animation Library',
    description: 'Pre-built animations and micro-interactions for stunning visual effects.',
    author: 'Motion Design Co',
    version: '3.0.0',
    category: 'design',
    icon: <Zap className="w-6 h-6 text-cyan-400" />,
    rating: 4.8,
    downloads: 56000,
    installed: false,
    verified: true,
    price: 19,
    features: ['100+ animations', 'Scroll effects', 'Hover states', 'Page transitions']
  },
  {
    id: 'custom-code',
    name: 'Custom Code Injector',
    description: 'Safely inject custom HTML, CSS, and JavaScript with sandboxing.',
    author: 'Nairi Team',
    version: '1.2.0',
    category: 'developer',
    icon: <Code className="w-6 h-6 text-emerald-400" />,
    rating: 4.7,
    downloads: 42000,
    installed: true,
    verified: true,
    price: 'free',
    features: ['HTML injection', 'CSS overrides', 'JS scripts', 'Safe sandboxing']
  },
];

export function PluginMarketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [plugins, setPlugins] = useState<Plugin[]>(SAMPLE_PLUGINS);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInstall = (pluginId: string) => {
    setPlugins(prev => prev.map(p => 
      p.id === pluginId ? { ...p, installed: true } : p
    ));
  };

  const handleUninstall = (pluginId: string) => {
    setPlugins(prev => prev.map(p => 
      p.id === pluginId ? { ...p, installed: false } : p
    ));
  };

  const formatDownloads = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  return (
    <div className="h-full flex bg-[#0a0a0f]">
      {/* Sidebar */}
      <div className="w-64 border-r border-white/10 p-4 flex flex-col">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Puzzle className="w-5 h-5 text-purple-400" />
          Plugin Marketplace
        </h2>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50"
          />
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            {PLUGIN_CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                {category.icon}
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Installed count */}
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <div className="text-sm text-white/60">Installed Plugins</div>
          <div className="text-2xl font-bold text-white">
            {plugins.filter(p => p.installed).length}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="text-sm text-white/60">
            {filteredPlugins.length} plugins found
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Plugin Grid/List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-3'
          }>
            {filteredPlugins.map(plugin => (
              <div
                key={plugin.id}
                className={`bg-white/5 border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition-all cursor-pointer ${
                  viewMode === 'list' ? 'flex items-center gap-4' : ''
                }`}
                onClick={() => setSelectedPlugin(plugin)}
              >
                <div className={`flex items-start gap-3 ${viewMode === 'list' ? 'flex-1' : 'mb-3'}`}>
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    {plugin.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white truncate">{plugin.name}</h3>
                      {plugin.verified && (
                        <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-white/60 line-clamp-2 mt-1">{plugin.description}</p>
                  </div>
                </div>

                <div className={`flex items-center justify-between ${viewMode === 'list' ? '' : 'mt-3 pt-3 border-t border-white/10'}`}>
                  <div className="flex items-center gap-3 text-sm text-white/40">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      {plugin.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {formatDownloads(plugin.downloads)}
                    </span>
                  </div>
                  
                  {plugin.installed ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUninstall(plugin.id);
                      }}
                      className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm flex items-center gap-1.5 hover:bg-green-500/30 transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      Installed
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInstall(plugin.id);
                      }}
                      className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm flex items-center gap-1.5 hover:bg-purple-500/30 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      {plugin.price === 'free' ? 'Install' : `$${plugin.price}`}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Plugin Detail Modal */}
      {selectedPlugin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedPlugin(null)}>
          <div className="bg-[#12121a] border border-white/10 rounded-2xl w-full max-w-lg p-6 m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center">
                {selectedPlugin.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-white">{selectedPlugin.name}</h2>
                  {selectedPlugin.verified && <Shield className="w-5 h-5 text-blue-400" />}
                </div>
                <div className="text-sm text-white/60">by {selectedPlugin.author} • v{selectedPlugin.version}</div>
              </div>
            </div>

            <p className="text-white/70 mb-4">{selectedPlugin.description}</p>

            <div className="flex items-center gap-4 mb-4 text-sm">
              <span className="flex items-center gap-1 text-white/60">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                {selectedPlugin.rating} rating
              </span>
              <span className="flex items-center gap-1 text-white/60">
                <Download className="w-4 h-4" />
                {formatDownloads(selectedPlugin.downloads)} downloads
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-white mb-2">Features</h3>
              <div className="grid grid-cols-2 gap-2">
                {selectedPlugin.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-white/60">
                    <Check className="w-3 h-3 text-green-400" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {selectedPlugin.installed ? (
                <>
                  <button
                    onClick={() => handleUninstall(selectedPlugin.id)}
                    className="flex-1 py-2.5 bg-red-500/20 text-red-400 rounded-lg font-medium hover:bg-red-500/30 transition-colors"
                  >
                    Uninstall
                  </button>
                  <button className="flex-1 py-2.5 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
                    <Settings className="w-4 h-4" />
                    Configure
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleInstall(selectedPlugin.id)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  {selectedPlugin.price === 'free' ? 'Install Plugin' : `Purchase for $${selectedPlugin.price}`}
                </button>
              )}
              <button className="p-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors">
                <ExternalLink className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PluginMarketplace;
