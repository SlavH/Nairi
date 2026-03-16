"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Github,
  GitBranch,
  GitCommit,
  GitPullRequest,
  GitMerge,
  Star,
  Eye,
  GitFork,
  Code,
  FileCode,
  Folder,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  Check,
  X,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Settings,
  Link,
  Unlink
} from "lucide-react";

interface Repository {
  id: string;
  name: string;
  fullName: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  isPrivate: boolean;
  defaultBranch: string;
  updatedAt: Date;
  isConnected: boolean;
}

interface PullRequest {
  id: string;
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  author: string;
  createdAt: Date;
  labels: string[];
}

interface Commit {
  id: string;
  sha: string;
  message: string;
  author: string;
  date: Date;
}

const SAMPLE_REPOS: Repository[] = [
  {
    id: '1',
    name: 'nairi-ai',
    fullName: 'user/nairi-ai',
    description: 'Advanced AI Assistant Platform',
    language: 'TypeScript',
    stars: 245,
    forks: 32,
    isPrivate: false,
    defaultBranch: 'main',
    updatedAt: new Date(),
    isConnected: true
  },
  {
    id: '2',
    name: 'react-components',
    fullName: 'user/react-components',
    description: 'Reusable React component library',
    language: 'TypeScript',
    stars: 128,
    forks: 18,
    isPrivate: false,
    defaultBranch: 'main',
    updatedAt: new Date(),
    isConnected: false
  },
  {
    id: '3',
    name: 'api-server',
    fullName: 'user/api-server',
    description: 'Backend API server',
    language: 'Python',
    stars: 56,
    forks: 8,
    isPrivate: true,
    defaultBranch: 'develop',
    updatedAt: new Date(),
    isConnected: true
  }
];

const SAMPLE_PRS: PullRequest[] = [
  { id: '1', number: 42, title: 'Add voice mode feature', state: 'open', author: 'developer1', createdAt: new Date(), labels: ['feature', 'enhancement'] },
  { id: '2', number: 41, title: 'Fix authentication bug', state: 'merged', author: 'developer2', createdAt: new Date(), labels: ['bug', 'priority'] },
  { id: '3', number: 40, title: 'Update dependencies', state: 'closed', author: 'dependabot', createdAt: new Date(), labels: ['dependencies'] },
];

const SAMPLE_COMMITS: Commit[] = [
  { id: '1', sha: 'abc1234', message: 'feat: add new chat components', author: 'developer1', date: new Date() },
  { id: '2', sha: 'def5678', message: 'fix: resolve memory leak in voice mode', author: 'developer2', date: new Date() },
  { id: '3', sha: 'ghi9012', message: 'docs: update README', author: 'developer1', date: new Date() },
  { id: '4', sha: 'jkl3456', message: 'refactor: improve code structure', author: 'developer3', date: new Date() },
];

export function GitHubIntegration() {
  const [isConnected, setIsConnected] = useState(true);
  const [repositories, setRepositories] = useState<Repository[]>(SAMPLE_REPOS);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(SAMPLE_REPOS[0]);
  const [pullRequests] = useState<PullRequest[]>(SAMPLE_PRS);
  const [commits] = useState<Commit[]>(SAMPLE_COMMITS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [aiCodeReview, setAiCodeReview] = useState(true);

  const filteredRepos = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const connectRepo = (repoId: string) => {
    setRepositories(repos => repos.map(r =>
      r.id === repoId ? { ...r, isConnected: true } : r
    ));
  };

  const disconnectRepo = (repoId: string) => {
    setRepositories(repos => repos.map(r =>
      r.id === repoId ? { ...r, isConnected: false } : r
    ));
  };

  const syncRepositories = async () => {
    setIsLoading(true);
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      'TypeScript': 'bg-blue-500',
      'JavaScript': 'bg-yellow-500',
      'Python': 'bg-green-500',
      'Rust': 'bg-orange-500',
      'Go': 'bg-cyan-500',
    };
    return colors[language] || 'bg-gray-500';
  };

  const getPRStateColor = (state: PullRequest['state']) => {
    switch (state) {
      case 'open': return 'text-green-500';
      case 'merged': return 'text-purple-500';
      case 'closed': return 'text-red-500';
    }
  };

  const getPRStateIcon = (state: PullRequest['state']) => {
    switch (state) {
      case 'open': return GitPullRequest;
      case 'merged': return GitMerge;
      case 'closed': return X;
    }
  };

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Github className="h-5 w-5" />
              GitHub
            </h2>
            {isConnected ? (
              <Badge variant="default" className="bg-green-500">
                <Check className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">
                Disconnected
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your repositories
          </p>
        </div>

        {!isConnected ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <Card className="w-full">
              <CardContent className="pt-6 text-center">
                <Github className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">Connect to GitHub</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Link your GitHub account to access repositories
                </p>
                <Button onClick={() => setIsConnected(true)}>
                  <Github className="h-4 w-4 mr-2" />
                  Connect GitHub
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search repositories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={syncRepositories}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sync Repositories
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredRepos.map(repo => (
                  <Card
                    key={repo.id}
                    className={`mb-2 cursor-pointer transition-colors ${
                      selectedRepo?.id === repo.id ? 'border-primary' : ''
                    }`}
                    onClick={() => setSelectedRepo(repo)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm truncate">{repo.name}</h3>
                            {repo.isPrivate && (
                              <Badge variant="outline" className="text-xs">Private</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {repo.description}
                          </p>
                        </div>
                        {repo.isConnected ? (
                          <Badge variant="secondary" className="text-xs">
                            <Link className="h-3 w-3 mr-1" />
                            Linked
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${getLanguageColor(repo.language)}`} />
                          {repo.language}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {repo.stars}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitFork className="h-3 w-3" />
                          {repo.forks}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </div>

      {/* Main Content */}
      {selectedRepo && isConnected ? (
        <div className="flex-1 flex flex-col">
          {/* Repo Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{selectedRepo.fullName}</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{selectedRepo.description}</p>
              </div>
              <div className="flex gap-2">
                {selectedRepo.isConnected ? (
                  <Button
                    variant="outline"
                    onClick={() => disconnectRepo(selectedRepo.id)}
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                ) : (
                  <Button onClick={() => connectRepo(selectedRepo.id)}>
                    <Link className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-3">
              <Badge variant="outline">
                <GitBranch className="h-3 w-3 mr-1" />
                {selectedRepo.defaultBranch}
              </Badge>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${getLanguageColor(selectedRepo.language)}`} />
                {selectedRepo.language}
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-4 w-4" />
                {selectedRepo.stars}
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <GitFork className="h-4 w-4" />
                {selectedRepo.forks}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="prs" className="flex-1 flex flex-col">
            <div className="border-b px-4">
              <TabsList className="mt-2">
                <TabsTrigger value="prs">Pull Requests</TabsTrigger>
                <TabsTrigger value="commits">Commits</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="prs" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {pullRequests.map(pr => {
                    const StateIcon = getPRStateIcon(pr.state);
                    return (
                      <Card key={pr.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <StateIcon className={`h-5 w-5 mt-0.5 ${getPRStateColor(pr.state)}`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{pr.title}</h4>
                                <span className="text-sm text-muted-foreground">#{pr.number}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {pr.labels.map(label => (
                                  <Badge key={label} variant="secondary" className="text-xs">
                                    {label}
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-sm text-muted-foreground mt-2">
                                Opened by {pr.author} • {pr.createdAt.toLocaleDateString()}
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="commits" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {commits.map(commit => (
                    <Card key={commit.id}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <GitCommit className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{commit.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {commit.author} • {commit.date.toLocaleDateString()}
                          </p>
                        </div>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {commit.sha.substring(0, 7)}
                        </code>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="settings" className="flex-1 mt-0 p-4">
              <div className="max-w-xl space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Sync Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto Sync</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically sync changes from GitHub
                        </p>
                      </div>
                      <Switch checked={autoSync} onCheckedChange={setAutoSync} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>AI Code Review</Label>
                        <p className="text-sm text-muted-foreground">
                          Get AI-powered code review suggestions
                        </p>
                      </div>
                      <Switch checked={aiCodeReview} onCheckedChange={setAiCodeReview} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="destructive"
                      onClick={() => disconnectRepo(selectedRepo.id)}
                    >
                      <Unlink className="h-4 w-4 mr-2" />
                      Disconnect Repository
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Github className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{isConnected ? 'Select a repository' : 'Connect to GitHub to get started'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default GitHubIntegration;
