"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FolderPlus,
  Folder,
  FolderOpen,
  MoreVertical,
  Edit,
  Trash2,
  Share2,
  Lock,
  Globe,
  Users,
  MessageSquare,
  FileText,
  ImageIcon,
  Plus,
  Search,
  Star,
  StarOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Space {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  visibility: "private" | "shared" | "public";
  isFavorite: boolean;
  chatCount: number;
  fileCount: number;
  imageCount: number;
  createdAt: Date;
  updatedAt: Date;
  members?: { id: string; name: string; avatar?: string }[];
}

interface SpacesProps {
  spaces: Space[];
  activeSpaceId?: string;
  onSelectSpace: (spaceId: string) => void;
  onCreateSpace: (space: Omit<Space, "id" | "createdAt" | "updatedAt" | "chatCount" | "fileCount" | "imageCount">) => void;
  onUpdateSpace: (spaceId: string, updates: Partial<Space>) => void;
  onDeleteSpace: (spaceId: string) => void;
}

const SPACE_COLORS = [
  { name: "Синий", value: "#3B82F6" },
  { name: "Зелёный", value: "#10B981" },
  { name: "Фиолетовый", value: "#8B5CF6" },
  { name: "Розовый", value: "#EC4899" },
  { name: "Оранжевый", value: "#F97316" },
  { name: "Жёлтый", value: "#EAB308" },
  { name: "Голубой", value: "#06B6D4" },
  { name: "Красный", value: "#EF4444" },
];

const SPACE_ICONS = [
  "📁", "💼", "💡", "🚀", "🎯", "📚", "🔬", "🎨",
  "💻", "📈", "🌍", "⚙️", "📧", "📅", "🎬", "🎵",
];

export function Spaces({
  spaces,
  activeSpaceId,
  onSelectSpace,
  onCreateSpace,
  onUpdateSpace,
  onDeleteSpace,
}: SpacesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [newSpace, setNewSpace] = useState({
    name: "",
    description: "",
    icon: "📁",
    color: "#3B82F6",
    visibility: "private" as const,
    isFavorite: false,
  });

  const filteredSpaces = spaces.filter(
    (space) =>
      space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteSpaces = filteredSpaces.filter((s) => s.isFavorite);
  const regularSpaces = filteredSpaces.filter((s) => !s.isFavorite);

  const handleCreateSpace = () => {
    if (!newSpace.name.trim()) return;
    onCreateSpace(newSpace);
    setNewSpace({
      name: "",
      description: "",
      icon: "📁",
      color: "#3B82F6",
      visibility: "private",
      isFavorite: false,
    });
    setIsCreateDialogOpen(false);
  };

  const handleUpdateSpace = () => {
    if (!editingSpace) return;
    onUpdateSpace(editingSpace.id, editingSpace);
    setEditingSpace(null);
  };

  const toggleFavorite = (space: Space) => {
    onUpdateSpace(space.id, { isFavorite: !space.isFavorite });
  };

  const getVisibilityIcon = (visibility: Space["visibility"]) => {
    switch (visibility) {
      case "private":
        return <Lock className="h-3 w-3" />;
      case "shared":
        return <Users className="h-3 w-3" />;
      case "public":
        return <Globe className="h-3 w-3" />;
    }
  };

  const SpaceCard = ({ space }: { space: Space }) => (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all hover:shadow-lg border-2",
        activeSpaceId === space.id
          ? "border-primary bg-primary/5"
          : "border-transparent hover:border-gray-700"
      )}
      onClick={() => onSelectSpace(space.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
            style={{ backgroundColor: space.color + "20" }}
          >
            {space.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-white">{space.name}</h3>
              {getVisibilityIcon(space.visibility)}
            </div>
            <p className="text-sm text-gray-400 line-clamp-1">
              {space.description || "Нет описания"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(space);
            }}
          >
            {space.isFavorite ? (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            ) : (
              <StarOff className="h-4 w-4 text-gray-500" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingSpace(space);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                <Share2 className="h-4 w-4 mr-2" />
                Поделиться
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSpace(space.id);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {space.chatCount} чатов
        </span>
        <span className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          {space.fileCount} файлов
        </span>
        <span className="flex items-center gap-1">
          <ImageIcon className="h-3 w-3" />
          {space.imageCount} изобр.
        </span>
      </div>
    </Card>
  );

  const SpaceForm = ({
    space,
    setSpace,
    onSubmit,
    submitLabel,
  }: {
    space: typeof newSpace;
    setSpace: (space: typeof newSpace) => void;
    onSubmit: () => void;
    submitLabel: string;
  }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Название</label>
        <Input
          value={space.name}
          onChange={(e) => setSpace({ ...space, name: e.target.value })}
          placeholder="Мой проект"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Описание</label>
        <Textarea
          value={space.description}
          onChange={(e) => setSpace({ ...space, description: e.target.value })}
          placeholder="Опишите назначение этого пространства..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Иконка</label>
        <div className="flex flex-wrap gap-2">
          {SPACE_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              className={cn(
                "w-10 h-10 rounded-lg text-xl hover:bg-gray-700 transition-colors",
                space.icon === icon && "bg-primary/20 ring-2 ring-primary"
              )}
              onClick={() => setSpace({ ...space, icon })}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Цвет</label>
        <div className="flex flex-wrap gap-2">
          {SPACE_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              className={cn(
                "w-8 h-8 rounded-full transition-transform hover:scale-110",
                space.color === color.value && "ring-2 ring-white ring-offset-2 ring-offset-gray-900"
              )}
              style={{ backgroundColor: color.value }}
              onClick={() => setSpace({ ...space, color: color.value })}
              title={color.name}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Видимость</label>
        <div className="flex gap-2">
          {[
            { value: "private", label: "Приватное", icon: Lock },
            { value: "shared", label: "Общее", icon: Users },
            { value: "public", label: "Публичное", icon: Globe },
          ].map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={space.visibility === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const updatedSpace = { ...space, visibility: option.value as Space["visibility"] }
                setSpace(updatedSpace as typeof space)
              }}
            >
              <option.icon className="h-4 w-4 mr-1" />
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <Button onClick={onSubmit} className="w-full">
        {submitLabel}
      </Button>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Пространства
          </h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Создать
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать пространство</DialogTitle>
              </DialogHeader>
              <SpaceForm
                space={newSpace}
                setSpace={setNewSpace}
                onSubmit={handleCreateSpace}
                submitLabel="Создать пространство"
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск пространств..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Spaces list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Favorites */}
        {favoriteSpaces.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <Star className="h-4 w-4" />
              Избранные
            </h3>
            <div className="space-y-2">
              {favoriteSpaces.map((space) => (
                <SpaceCard key={space.id} space={space} />
              ))}
            </div>
          </div>
        )}

        {/* All spaces */}
        {regularSpaces.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Все пространства
            </h3>
            <div className="space-y-2">
              {regularSpaces.map((space) => (
                <SpaceCard key={space.id} space={space} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {filteredSpaces.length === 0 && (
          <div className="text-center py-12">
            <FolderPlus className="h-12 w-12 mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              Пространств нет
            </h3>
            <p className="text-gray-500 mb-4">
              Создайте пространство для организации чатов и файлов
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Создать пространство
            </Button>
          </div>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editingSpace} onOpenChange={() => setEditingSpace(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать пространство</DialogTitle>
          </DialogHeader>
          {editingSpace && (
            <SpaceForm
              space={editingSpace as typeof newSpace}
              setSpace={(s) => setEditingSpace({ ...editingSpace, ...s } as Space)}
              onSubmit={handleUpdateSpace}
              submitLabel="Сохранить изменения"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Spaces;
