"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Plus,
  Send,
  MoreVertical,
  UserPlus,
  Settings,
  LogOut,
  Crown,
  Bot,
  Mic,
  Paperclip,
  Smile,
  AtSign,
  Hash,
  Search,
  Bell,
  BellOff,
  Pin,
  Trash2,
  Edit,
  Reply,
  Forward,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  role: "owner" | "admin" | "member";
  isOnline: boolean;
  isAI?: boolean;
}

export interface GroupMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isAI?: boolean;
  replyTo?: string;
  reactions?: { emoji: string; userIds: string[] }[];
  attachments?: { type: string; url: string; name: string }[];
  isPinned?: boolean;
}

export interface GroupChat {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  members: GroupMember[];
  messages: GroupMessage[];
  createdAt: Date;
  isMuted: boolean;
  pinnedMessages: string[];
}

interface GroupChatProps {
  groups: GroupChat[];
  activeGroupId?: string;
  currentUserId: string;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (group: Omit<GroupChat, "id" | "createdAt" | "messages" | "pinnedMessages">) => void;
  onSendMessage: (groupId: string, message: Omit<GroupMessage, "id" | "timestamp">) => void;
  onInviteAI: (groupId: string, aiType: string) => void;
  onLeaveGroup: (groupId: string) => void;
}

const AI_ASSISTANTS = [
  { id: "nairi", name: "Nairi", avatar: "🤖", description: "Основной ассистент" },
  { id: "coder", name: "Кодер", avatar: "💻", description: "Помощь с кодом" },
  { id: "writer", name: "Писатель", avatar: "✍️", description: "Творческие тексты" },
  { id: "analyst", name: "Аналитик", avatar: "📊", description: "Анализ данных" },
  { id: "translator", name: "Переводчик", avatar: "🌐", description: "Перевод текстов" },
];

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "🔥"];

export function GroupChatComponent({
  groups,
  activeGroupId,
  currentUserId,
  onSelectGroup,
  onCreateGroup,
  onSendMessage,
  onInviteAI,
  onLeaveGroup,
}: GroupChatProps) {
  const [message, setMessage] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInviteAIDialogOpen, setIsInviteAIDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyingTo, setReplyingTo] = useState<GroupMessage | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    members: [] as GroupMember[],
    isMuted: false,
  });

  const activeGroup = groups.find((g) => g.id === activeGroupId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeGroup?.messages]);

  const handleSendMessage = () => {
    if (!message.trim() || !activeGroupId) return;

    onSendMessage(activeGroupId, {
      senderId: currentUserId,
      content: message,
      replyTo: replyingTo?.id,
    });

    setMessage("");
    setReplyingTo(null);
  };

  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) return;
    onCreateGroup(newGroup);
    setNewGroup({ name: "", description: "", members: [], isMuted: false });
    setIsCreateDialogOpen(false);
  };

  const getMemberById = (memberId: string) => {
    return activeGroup?.members.find((m) => m.id === memberId);
  };

  const getRoleIcon = (role: GroupMember["role"]) => {
    if (role === "owner") return <Crown className="h-3 w-3 text-yellow-500" />;
    if (role === "admin") return <Settings className="h-3 w-3 text-blue-500" />;
    return null;
  };

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full">
      {/* Groups sidebar */}
      <div className="w-72 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Группы
            </h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Plus className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать группу</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Название</label>
                    <Input
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                      placeholder="Название группы"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Описание</label>
                    <Input
                      value={newGroup.description}
                      onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                      placeholder="Описание группы"
                    />
                  </div>
                  <Button onClick={handleCreateGroup} className="w-full">
                    Создать группу
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск групп..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className={cn(
                "p-3 cursor-pointer hover:bg-gray-800 transition-colors border-b border-gray-800",
                activeGroupId === group.id && "bg-gray-800"
              )}
              onClick={() => onSelectGroup(group.id)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={group.avatar} />
                  <AvatarFallback>
                    {group.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{group.name}</p>
                    {group.isMuted && <BellOff className="h-3 w-3 text-gray-500" />}
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {group.members.length} участников
                  </p>
                </div>
              </div>
            </div>
          ))}

          {filteredGroups.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Групп не найдено</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      {activeGroup ? (
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={activeGroup.avatar} />
                <AvatarFallback>
                  {activeGroup.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">{activeGroup.name}</h3>
                <p className="text-sm text-gray-400">
                  {activeGroup.members.filter((m) => m.isOnline).length} онлайн
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Dialog open={isInviteAIDialogOpen} onOpenChange={setIsInviteAIDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Bot className="h-4 w-4 mr-2" />
                    Пригласить AI
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Пригласить AI-ассистента</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    {AI_ASSISTANTS.map((ai) => (
                      <Card
                        key={ai.id}
                        className="p-3 cursor-pointer hover:bg-gray-800 transition-colors"
                        onClick={() => {
                          onInviteAI(activeGroup.id, ai.id);
                          setIsInviteAIDialogOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{ai.avatar}</span>
                          <div>
                            <p className="font-medium">{ai.name}</p>
                            <p className="text-sm text-gray-400">{ai.description}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMembers(!showMembers)}
              >
                <Users className="h-5 w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Пригласить
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Pin className="h-4 w-4 mr-2" />
                    Закреплённые
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Настройки
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-500"
                    onClick={() => onLeaveGroup(activeGroup.id)}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Покинуть
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeGroup.messages.map((msg) => {
                const sender = getMemberById(msg.senderId);
                const isOwn = msg.senderId === currentUserId;
                const replyMessage = msg.replyTo
                  ? activeGroup.messages.find((m) => m.id === msg.replyTo)
                  : null;

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3",
                      isOwn && "flex-row-reverse"
                    )}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={sender?.avatar} />
                      <AvatarFallback>
                        {sender?.isAI ? "🤖" : sender?.name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className={cn("max-w-[70%]", isOwn && "items-end")}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {sender?.name || "Неизвестный"}
                        </span>
                        {sender?.isAI && (
                          <Badge variant="secondary" className="text-xs">
                            AI
                          </Badge>
                        )}
                        {sender && getRoleIcon(sender.role)}
                        <span className="text-xs text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      {replyMessage && (
                        <div className="text-xs text-gray-400 bg-gray-800 p-2 rounded mb-1 border-l-2 border-purple-500">
                          <span className="font-medium">
                            {getMemberById(replyMessage.senderId)?.name}:
                          </span>{" "}
                          {replyMessage.content.slice(0, 50)}...
                        </div>
                      )}

                      <Card
                        className={cn(
                          "p-3",
                          isOwn
                            ? "bg-purple-600 border-purple-600"
                            : msg.isAI
                            ? "bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/30"
                            : "bg-gray-800"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </Card>

                      {/* Reactions */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {msg.reactions.map((reaction, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs cursor-pointer"
                            >
                              {reaction.emoji} {reaction.userIds.length}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Message actions */}
                      <div className="flex gap-1 mt-1 opacity-0 hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setReplyingTo(msg)}
                        >
                          <Reply className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Smile className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Members sidebar */}
            {showMembers && (
              <div className="w-64 border-l border-gray-800 p-4 overflow-y-auto">
                <h4 className="font-medium mb-4">
                  Участники ({activeGroup.members.length})
                </h4>
                <div className="space-y-2">
                  {activeGroup.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-gray-800"
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>
                            {member.isAI ? "🤖" : member.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {member.isOnline && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-900" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium truncate">
                            {member.name}
                          </span>
                          {member.isAI && (
                            <Badge variant="secondary" className="text-xs">
                              AI
                            </Badge>
                          )}
                          {getRoleIcon(member.role)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reply indicator */}
          {replyingTo && (
            <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Reply className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-gray-400">
                  Ответ на: {getMemberById(replyingTo.senderId)?.name}
                </span>
                <span className="text-sm text-gray-500 truncate max-w-xs">
                  {replyingTo.content.slice(0, 50)}...
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setReplyingTo(null)}
              >
                ×
              </Button>
            </div>
          )}

          {/* Message input */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Напишите сообщение..."
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1"
              />
              <Button variant="ghost" size="icon">
                <AtSign className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Smile className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Mic className="h-5 w-5" />
              </Button>
              <Button onClick={handleSendMessage} disabled={!message.trim()}>
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Выберите группу</h3>
            <p className="text-sm">Или создайте новую для общения</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupChatComponent;
