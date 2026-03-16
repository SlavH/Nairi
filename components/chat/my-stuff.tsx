"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Bookmark,
  Search,
  Star,
  Folder,
  FileText,
  Image,
  Code,
  Link,
  MessageSquare,
  MoreVertical,
  Trash2,
  Edit,
  Copy,
  Share2,
  Download,
  Plus,
  Filter,
  Grid,
  List,
  Clock,
  Tag,
  Heart,
  ExternalLink,
  Sparkles
} from "lucide-react";

interface SavedItem {
  id: string;
  title: string;
  content: string;
  type: 'message' | 'code' | 'image' | 'link' | 'document' | 'artifact';
  source: string;
  tags: string[];
  isFavorite: boolean;
  folder?: string;
  createdAt: Date;
  preview?: string;
}

interface Folder {
  id: string;
  name: string;
  color: string;
  count: number;
}

const DEFAULT_FOLDERS: Folder[] = [
  { id: 'all', name: 'All Items', color: 'bg-gray-500', count: 0 },
  { id: 'favorites', name: 'Favorites', color: 'bg-yellow-500', count: 0 },
  { id: 'code', name: 'Code Snippets', color: 'bg-blue-500', count: 0 },
  { id: 'images', name: 'Images', color: 'bg-purple-500', count: 0 },
  { id: 'research', name: 'Research', color: 'bg-green-500', count: 0 },
];

const SAMPLE_ITEMS: SavedItem[] = [
  {
    id: '1',
    title: 'React useEffect Best Practices',
    content: 'useEffect(() => { ... }, [dependencies])',
    type: 'code',
    source: 'Chat with Claude',
    tags: ['react', 'hooks', 'javascript'],
    isFavorite: true,
    folder: 'code',
    createdAt: new Date(),
    preview: 'useEffect(() => {\n  // Effect logic\n  return () => cleanup();\n}, [deps]);'
  },
  {
    id: '2',
    title: 'AI Market Research Summary',
    content: 'Key findings from AI industry analysis...',
    type: 'message',
    source: 'Deep Research',
    tags: ['ai', 'research', 'market'],
    isFavorite: false,
    folder: 'research',
    createdAt: new Date()
  },
  {
    id: '3',
    title: 'Product Landing Page Design',
    content: 'Generated landing page mockup',
    type: 'image',
    source: 'Image Generator',
    tags: ['design', 'landing', 'ui'],
    isFavorite: true,
    folder: 'images',
    createdAt: new Date()
  },
  {
    id: '4',
    title: 'API Documentation Template',
    content: 'REST API documentation structure',
    type: 'document',
    source: 'Artifacts',
    tags: ['api', 'docs', 'template'],
    isFavorite: false,
    createdAt: new Date()
  },
  {
    id: '5',
    title: 'Useful AI Tools List',
    content: 'https://example.com/ai-tools',
    type: 'link',
    source: 'Web Search',
    tags: ['tools', 'resources'],
    isFavorite: false,
    createdAt: new Date()
  }
];

export function MyStuff() {
  const [items, setItems] = useState<SavedItem[]>(SAMPLE_ITEMS);
  const [folders, setFolders] = useState<Folder[]>(DEFAULT_FOLDERS);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItem, setSelectedItem] = useState<SavedItem | null>(null);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFolder = selectedFolder === 'all' ||
                         (selectedFolder === 'favorites' && item.isFavorite) ||
                         item.folder === selectedFolder ||
                         (selectedFolder === 'code' && item.type === 'code') ||
                         (selectedFolder === 'images' && item.type === 'image');
    return matchesSearch && matchesFolder;
  });

  const toggleFavorite = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const getTypeIcon = (type: SavedItem['type']) => {
    switch (type) {
      case 'code': return Code;
      case 'image': return Image;
      case 'link': return Link;
      case 'document': return FileText;
      case 'artifact': return Sparkles;
      default: return MessageSquare;
    }
  };

  const getTypeColor = (type: SavedItem['type']) => {
    switch (type) {
      case 'code': return 'bg-blue-500/10 text-blue-500';
      case 'image': return 'bg-purple-500/10 text-purple-500';
      case 'link': return 'bg-green-500/10 text-green-500';
      case 'document': return 'bg-orange-500/10 text-orange-500';
      case 'artifact': return 'bg-pink-500/10 text-pink-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            My Stuff
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your saved items
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {folders.map(folder => {
              const count = folder.id === 'all' ? items.length :
                           folder.id === 'favorites' ? items.filter(i => i.isFavorite).length :
                           items.filter(i => i.folder === folder.id || 
                             (folder.id === 'code' && i.type === 'code') ||
                             (folder.id === 'images' && i.type === 'image')
                           ).length;
              
              return (
                <Button
                  key={folder.id}
                  variant={selectedFolder === folder.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start mb-1"
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  <div className={`w-3 h-3 rounded-full ${folder.color} mr-2`} />
                  {folder.name}
                  <Badge variant="outline" className="ml-auto">
                    {count}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search saved items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Items */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No saved items found</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => {
                  const TypeIcon = getTypeIcon(item.type);
                  return (
                    <Card
                      key={item.id}
                      className={`cursor-pointer transition-colors hover:border-primary ${
                        selectedItem?.id === item.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedItem(item)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                            <TypeIcon className="h-4 w-4" />
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(item.id);
                              }}
                            >
                              <Star className={`h-4 w-4 ${
                                item.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''
                              }`} />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => copyToClipboard(item.content)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copy
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => deleteItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <CardTitle className="text-sm mt-2">{item.title}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {item.content}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {item.createdAt.toLocaleDateString()}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map(item => {
                  const TypeIcon = getTypeIcon(item.type);
                  return (
                    <Card
                      key={item.id}
                      className={`cursor-pointer transition-colors hover:border-primary ${
                        selectedItem?.id === item.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedItem(item)}
                    >
                      <CardContent className="p-3 flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{item.title}</h3>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.source} • {item.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {item.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.id);
                          }}
                        >
                          <Star className={`h-4 w-4 ${
                            item.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''
                          }`} />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Detail Panel */}
      {selectedItem && (
        <div className="w-80 border-l flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Details</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedItem(null)}
            >
              <span className="sr-only">Close</span>
              ×
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <div>
                <h4 className="font-medium">{selectedItem.title}</h4>
                <Badge variant="secondary" className="mt-1">
                  {selectedItem.type}
                </Badge>
              </div>

              {selectedItem.preview && (
                <div className="bg-muted p-3 rounded-lg">
                  <pre className="text-xs overflow-auto">
                    <code>{selectedItem.preview}</code>
                  </pre>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">Content</p>
                <p className="text-sm">{selectedItem.content}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Source</p>
                <p className="text-sm">{selectedItem.source}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {selectedItem.tags.map(tag => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Saved</p>
                <p className="text-sm">{selectedItem.createdAt.toLocaleString()}</p>
              </div>
            </div>
          </ScrollArea>
          <div className="p-4 border-t space-y-2">
            <Button className="w-full" onClick={() => copyToClipboard(selectedItem.content)}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Content
            </Button>
            <Button variant="outline" className="w-full">
              <Sparkles className="h-4 w-4 mr-2" />
              Use in Chat
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyStuff;
