'use client';

import React, { useState } from 'react';
import { Users, Shield, Plus, Trash2, Edit2, Check, X, Mail, Crown, Eye, Pencil } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  avatar: string;
  lastActive: string;
}

interface Role {
  id: string;
  name: string;
  permissions: string[];
  color: string;
}

const roles: Role[] = [
  { id: 'owner', name: 'Owner', permissions: ['all'], color: 'yellow' },
  { id: 'admin', name: 'Admin', permissions: ['manage_team', 'edit', 'publish', 'view_analytics'], color: 'purple' },
  { id: 'editor', name: 'Editor', permissions: ['edit', 'publish'], color: 'blue' },
  { id: 'viewer', name: 'Viewer', permissions: ['view'], color: 'gray' }
];

const permissions = [
  { id: 'manage_team', label: 'Manage Team', description: 'Add/remove team members' },
  { id: 'edit', label: 'Edit Content', description: 'Modify pages and components' },
  { id: 'publish', label: 'Publish', description: 'Deploy changes to production' },
  { id: 'view_analytics', label: 'View Analytics', description: 'Access analytics dashboard' },
  { id: 'manage_settings', label: 'Manage Settings', description: 'Change project settings' },
  { id: 'manage_domains', label: 'Manage Domains', description: 'Configure custom domains' },
  { id: 'manage_billing', label: 'Manage Billing', description: 'Access billing and payments' }
];

export function TeamPermissions() {
  const [members, setMembers] = useState<TeamMember[]>([
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'owner', avatar: '👨‍💼', lastActive: 'Now' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'admin', avatar: '👩‍💻', lastActive: '2h ago' },
    { id: '3', name: 'Bob Wilson', email: 'bob@example.com', role: 'editor', avatar: '👨‍🎨', lastActive: '1d ago' },
    { id: '4', name: 'Alice Brown', email: 'alice@example.com', role: 'viewer', avatar: '👩‍🔬', lastActive: '3d ago' }
  ]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [activeTab, setActiveTab] = useState<'members' | 'roles'>('members');

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'admin': return <Shield className="w-4 h-4 text-purple-400" />;
      case 'editor': return <Pencil className="w-4 h-4 text-blue-400" />;
      default: return <Eye className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'admin': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'editor': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleInvite = () => {
    if (inviteEmail) {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole as any,
        avatar: '👤',
        lastActive: 'Pending'
      };
      setMembers([...members, newMember]);
      setInviteEmail('');
      setShowInvite(false);
    }
  };

  const removeMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
  };

  const updateRole = (id: string, role: string) => {
    setMembers(members.map(m => m.id === id ? { ...m, role: role as any } : m));
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f] overflow-y-auto custom-scrollbar">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          Team & Permissions
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {['members', 'roles'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4">
        {activeTab === 'members' ? (
          <div className="space-y-4">
            {/* Invite Button */}
            <button
              onClick={() => setShowInvite(true)}
              className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:border-purple-500/50 hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Invite Team Member
            </button>

            {/* Invite Modal */}
            {showInvite && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-purple-400" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500"
                  />
                </div>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleInvite}
                    className="flex-1 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors"
                  >
                    Send Invite
                  </button>
                  <button
                    onClick={() => setShowInvite(false)}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="space-y-2">
              {members.map(member => (
                <div
                  key={member.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-white/20 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xl">
                    {member.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{member.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs border flex items-center gap-1 ${getRoleBadgeColor(member.role)}`}>
                        {getRoleIcon(member.role)}
                        {member.role}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm">{member.email}</p>
                  </div>
                  <div className="text-gray-500 text-xs">{member.lastActive}</div>
                  {member.role !== 'owner' && (
                    <div className="flex gap-2">
                      <select
                        value={member.role}
                        onChange={(e) => updateRole(member.id, e.target.value)}
                        className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-xs"
                      >
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick={() => removeMember(member.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {roles.map(role => (
              <div key={role.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  {getRoleIcon(role.id)}
                  <span className="text-white font-medium">{role.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {permissions.map(perm => (
                    <div
                      key={perm.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                        role.permissions.includes('all') || role.permissions.includes(perm.id)
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-white/5 text-gray-500'
                      }`}
                    >
                      {(role.permissions.includes('all') || role.permissions.includes(perm.id)) ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      {perm.label}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamPermissions;
