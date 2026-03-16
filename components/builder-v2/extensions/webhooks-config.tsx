'use client';

import React, { useState } from 'react';
import { 
  Webhook, Plus, Trash2, Edit2, Check, X, Copy, 
  Eye, EyeOff, RefreshCw, Clock, CheckCircle, XCircle,
  AlertTriangle, Code, Send, Settings, ChevronDown
} from 'lucide-react';

interface WebhookEvent {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  createdAt: Date;
  lastTriggered?: Date;
  successCount: number;
  failureCount: number;
}

interface WebhookLog {
  id: string;
  webhookId: string;
  event: string;
  status: 'success' | 'failure' | 'pending';
  statusCode?: number;
  timestamp: Date;
  payload: string;
  response?: string;
}

const WEBHOOK_EVENTS: WebhookEvent[] = [
  // Form events
  { id: 'form.submitted', name: 'Form Submitted', description: 'When a visitor submits any form', category: 'Forms' },
  { id: 'form.created', name: 'Form Created', description: 'When a new form is created', category: 'Forms' },
  
  // Page events
  { id: 'page.published', name: 'Page Published', description: 'When a page is published', category: 'Pages' },
  { id: 'page.updated', name: 'Page Updated', description: 'When a page is updated', category: 'Pages' },
  { id: 'page.deleted', name: 'Page Deleted', description: 'When a page is deleted', category: 'Pages' },
  
  // Ecommerce events
  { id: 'order.created', name: 'Order Created', description: 'When a new order is placed', category: 'Ecommerce' },
  { id: 'order.completed', name: 'Order Completed', description: 'When an order is fulfilled', category: 'Ecommerce' },
  { id: 'order.cancelled', name: 'Order Cancelled', description: 'When an order is cancelled', category: 'Ecommerce' },
  { id: 'product.created', name: 'Product Created', description: 'When a new product is added', category: 'Ecommerce' },
  { id: 'product.updated', name: 'Product Updated', description: 'When a product is modified', category: 'Ecommerce' },
  { id: 'cart.abandoned', name: 'Cart Abandoned', description: 'When a cart is abandoned', category: 'Ecommerce' },
  
  // User events
  { id: 'user.registered', name: 'User Registered', description: 'When a new user signs up', category: 'Users' },
  { id: 'user.login', name: 'User Login', description: 'When a user logs in', category: 'Users' },
  
  // Site events
  { id: 'site.deployed', name: 'Site Deployed', description: 'When the site is deployed', category: 'Site' },
  { id: 'backup.created', name: 'Backup Created', description: 'When a backup is created', category: 'Site' },
];

/** Example/demo webhook configs only — not real credentials. */
const SAMPLE_WEBHOOKS: WebhookConfig[] = [
  {
    id: '1',
    name: 'Slack Notifications',
    url: 'https://hooks.slack.com/services/xxx/yyy/zzz',
    secret: 'whsec_abc123def456',
    events: ['form.submitted', 'order.created'],
    active: true,
    createdAt: new Date('2024-01-15'),
    lastTriggered: new Date('2024-02-03'),
    successCount: 156,
    failureCount: 2
  },
  {
    id: '2',
    name: 'CRM Integration',
    url: 'https://api.mycrm.com/webhooks/nairi',
    secret: 'whsec_xyz789abc012',
    events: ['user.registered', 'form.submitted'],
    active: true,
    createdAt: new Date('2024-01-20'),
    lastTriggered: new Date('2024-02-02'),
    successCount: 89,
    failureCount: 0
  },
  {
    id: '3',
    name: 'Inventory Sync',
    url: 'https://inventory.example.com/webhook',
    secret: 'whsec_inv456def789',
    events: ['order.created', 'order.completed', 'product.updated'],
    active: false,
    createdAt: new Date('2024-01-25'),
    successCount: 45,
    failureCount: 12
  }
];

const SAMPLE_LOGS: WebhookLog[] = [
  {
    id: '1',
    webhookId: '1',
    event: 'form.submitted',
    status: 'success',
    statusCode: 200,
    timestamp: new Date('2024-02-03T14:30:00'),
    payload: '{"form_id": "contact", "email": "user@example.com", "message": "Hello!"}',
    response: '{"ok": true}'
  },
  {
    id: '2',
    webhookId: '1',
    event: 'order.created',
    status: 'success',
    statusCode: 200,
    timestamp: new Date('2024-02-03T12:15:00'),
    payload: '{"order_id": "ORD-001", "total": 99.99, "items": 3}',
    response: '{"received": true}'
  },
  {
    id: '3',
    webhookId: '2',
    event: 'user.registered',
    status: 'failure',
    statusCode: 500,
    timestamp: new Date('2024-02-02T18:45:00'),
    payload: '{"user_id": "usr_123", "email": "new@user.com"}',
    response: '{"error": "Internal server error"}'
  }
];

export function WebhooksConfig() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(SAMPLE_WEBHOOKS);
  const [logs] = useState<WebhookLog[]>(SAMPLE_LOGS);
  const [activeTab, setActiveTab] = useState<'webhooks' | 'logs' | 'events'>('webhooks');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[]
  });

  const handleCreateWebhook = () => {
    const newWebhook: WebhookConfig = {
      id: Date.now().toString(),
      name: formData.name,
      url: formData.url,
      secret: `whsec_${Math.random().toString(36).substring(2, 15)}`,
      events: formData.events,
      active: true,
      createdAt: new Date(),
      successCount: 0,
      failureCount: 0
    };
    setWebhooks([...webhooks, newWebhook]);
    setShowCreateModal(false);
    setFormData({ name: '', url: '', events: [] });
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setWebhooks(webhooks.map(w => 
      w.id === id ? { ...w, active: !w.active } : w
    ));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const groupedEvents = WEBHOOK_EVENTS.reduce((acc, event) => {
    if (!acc[event.category]) acc[event.category] = [];
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, WebhookEvent[]>);

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f]">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Webhook className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Webhooks</h1>
              <p className="text-sm text-white/60">Send real-time notifications to external services</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Create Webhook
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-lg w-fit">
          {(['webhooks', 'logs', 'events'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {activeTab === 'webhooks' && (
          <div className="space-y-4">
            {webhooks.length === 0 ? (
              <div className="text-center py-12">
                <Webhook className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No webhooks configured</h3>
                <p className="text-white/60 mb-4">Create your first webhook to start receiving notifications</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg font-medium hover:bg-blue-500/30 transition-colors"
                >
                  Create Webhook
                </button>
              </div>
            ) : (
              webhooks.map(webhook => (
                <div
                  key={webhook.id}
                  className={`bg-white/5 border rounded-xl p-4 ${
                    webhook.active ? 'border-white/10' : 'border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${webhook.active ? 'bg-green-400' : 'bg-white/20'}`} />
                      <div>
                        <h3 className="font-medium text-white">{webhook.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">
                            {webhook.url.length > 50 ? webhook.url.substring(0, 50) + '...' : webhook.url}
                          </code>
                          <button
                            onClick={() => copyToClipboard(webhook.url)}
                            className="text-white/40 hover:text-white transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(webhook.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          webhook.active
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {webhook.active ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => setEditingWebhook(webhook)}
                        className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Secret */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-white/40">Secret:</span>
                    <code className="text-xs text-white/60 bg-white/5 px-2 py-0.5 rounded font-mono">
                      {showSecrets[webhook.id] ? webhook.secret : '••••••••••••••••'}
                    </code>
                    <button
                      onClick={() => setShowSecrets({ ...showSecrets, [webhook.id]: !showSecrets[webhook.id] })}
                      className="text-white/40 hover:text-white transition-colors"
                    >
                      {showSecrets[webhook.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(webhook.secret)}
                      className="text-white/40 hover:text-white transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Events */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {webhook.events.map(eventId => {
                      const event = WEBHOOK_EVENTS.find(e => e.id === eventId);
                      return (
                        <span
                          key={eventId}
                          className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs"
                        >
                          {event?.name || eventId}
                        </span>
                      );
                    })}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-400" />
                      {webhook.successCount} successful
                    </span>
                    <span className="flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-red-400" />
                      {webhook.failureCount} failed
                    </span>
                    {webhook.lastTriggered && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last triggered: {webhook.lastTriggered.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-2">
            {logs.map(log => (
              <div
                key={log.id}
                className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
              >
                <div
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                >
                  <div className="flex items-center gap-3">
                    {log.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : log.status === 'failure' ? (
                      <XCircle className="w-4 h-4 text-red-400" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />
                    )}
                    <span className="text-sm text-white">{log.event}</span>
                    {log.statusCode && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        log.statusCode >= 200 && log.statusCode < 300
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {log.statusCode}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/40">
                      {log.timestamp.toLocaleString()}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${
                      expandedLog === log.id ? 'rotate-180' : ''
                    }`} />
                  </div>
                </div>
                
                {expandedLog === log.id && (
                  <div className="border-t border-white/10 p-3 space-y-3">
                    <div>
                      <div className="text-xs text-white/40 mb-1">Payload</div>
                      <pre className="text-xs text-white/70 bg-black/30 p-2 rounded overflow-x-auto">
                        {JSON.stringify(JSON.parse(log.payload), null, 2)}
                      </pre>
                    </div>
                    {log.response && (
                      <div>
                        <div className="text-xs text-white/40 mb-1">Response</div>
                        <pre className="text-xs text-white/70 bg-black/30 p-2 rounded overflow-x-auto">
                          {JSON.stringify(JSON.parse(log.response), null, 2)}
                        </pre>
                      </div>
                    )}
                    <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />
                      Retry
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([category, events]) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-white/60 mb-3">{category}</h3>
                <div className="space-y-2">
                  {events.map(event => (
                    <div
                      key={event.id}
                      className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm text-white">{event.name}</div>
                        <div className="text-xs text-white/40">{event.description}</div>
                      </div>
                      <code className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">
                        {event.id}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#12121a] border border-white/10 rounded-2xl w-full max-w-lg p-6 m-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-semibold text-white mb-4">Create Webhook</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Webhook"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Endpoint URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://example.com/webhook"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Events</label>
                <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                  {Object.entries(groupedEvents).map(([category, events]) => (
                    <div key={category}>
                      <div className="text-xs text-white/40 mb-2">{category}</div>
                      <div className="space-y-1">
                        {events.map(event => (
                          <label
                            key={event.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.events.includes(event.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({ ...formData, events: [...formData.events, event.id] });
                                } else {
                                  setFormData({ ...formData, events: formData.events.filter(id => id !== event.id) });
                                }
                              }}
                              className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                            />
                            <span className="text-sm text-white">{event.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ name: '', url: '', events: [] });
                }}
                className="flex-1 py-2.5 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWebhook}
                disabled={!formData.name || !formData.url || formData.events.length === 0}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Webhook
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WebhooksConfig;
