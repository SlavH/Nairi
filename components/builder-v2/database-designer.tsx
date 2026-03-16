"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Database,
  Plus,
  Trash2,
  Copy,
  Check,
  Key,
  Link2,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  List,
  FileJson,
  Code,
  Sparkles,
  Table,
  ArrowRight,
  Settings2,
  Download,
  Wand2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Field {
  id: string
  name: string
  type: FieldType
  isPrimaryKey: boolean
  isRequired: boolean
  isUnique: boolean
  defaultValue?: string
  relation?: {
    table: string
    field: string
    type: "one-to-one" | "one-to-many" | "many-to-many"
  }
}

interface TableSchema {
  id: string
  name: string
  fields: Field[]
}

type FieldType = 
  | "string"
  | "text"
  | "int"
  | "float"
  | "boolean"
  | "datetime"
  | "json"
  | "enum"
  | "uuid"

interface DatabaseDesignerProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onGenerateSchema: (schema: string, prismaSchema: string) => void
}

const FIELD_TYPES: { value: FieldType; label: string; icon: React.ElementType }[] = [
  { value: "string", label: "String", icon: Type },
  { value: "text", label: "Text", icon: Type },
  { value: "int", label: "Integer", icon: Hash },
  { value: "float", label: "Float", icon: Hash },
  { value: "boolean", label: "Boolean", icon: ToggleLeft },
  { value: "datetime", label: "DateTime", icon: Calendar },
  { value: "json", label: "JSON", icon: FileJson },
  { value: "enum", label: "Enum", icon: List },
  { value: "uuid", label: "UUID", icon: Key },
]

const COMMON_SCHEMAS = [
  {
    name: "User Authentication",
    tables: [
      {
        id: "users",
        name: "User",
        fields: [
          { id: "1", name: "id", type: "uuid" as FieldType, isPrimaryKey: true, isRequired: true, isUnique: true },
          { id: "2", name: "email", type: "string" as FieldType, isPrimaryKey: false, isRequired: true, isUnique: true },
          { id: "3", name: "password", type: "string" as FieldType, isPrimaryKey: false, isRequired: true, isUnique: false },
          { id: "4", name: "name", type: "string" as FieldType, isPrimaryKey: false, isRequired: false, isUnique: false },
          { id: "5", name: "createdAt", type: "datetime" as FieldType, isPrimaryKey: false, isRequired: true, isUnique: false },
          { id: "6", name: "updatedAt", type: "datetime" as FieldType, isPrimaryKey: false, isRequired: true, isUnique: false },
        ]
      }
    ]
  },
  {
    name: "Blog",
    tables: [
      {
        id: "posts",
        name: "Post",
        fields: [
          { id: "1", name: "id", type: "uuid" as FieldType, isPrimaryKey: true, isRequired: true, isUnique: true },
          { id: "2", name: "title", type: "string" as FieldType, isPrimaryKey: false, isRequired: true, isUnique: false },
          { id: "3", name: "content", type: "text" as FieldType, isPrimaryKey: false, isRequired: true, isUnique: false },
          { id: "4", name: "published", type: "boolean" as FieldType, isPrimaryKey: false, isRequired: true, isUnique: false, defaultValue: "false" },
          { id: "5", name: "authorId", type: "string" as FieldType, isPrimaryKey: false, isRequired: true, isUnique: false },
          { id: "6", name: "createdAt", type: "datetime" as FieldType, isPrimaryKey: false, isRequired: true, isUnique: false },
        ]
      },
      {
        id: "categories",
        name: "Category",
        fields: [
          { id: "1", name: "id", type: "uuid" as FieldType, isPrimaryKey: true, isRequired: true, isUnique: true },
          { id: "2", name: "name", type: "string" as FieldType, isPrimaryKey: false, isRequired: true, isUnique: true },
          { id: "3", name: "slug", type: "string" as FieldType, isPrimaryKey: false, isRequired: true, isUnique: true },
        ]
      }
    ]
  },
  {
    name: "E-commerce",
    tables: [
      {
        id: "products",
        name: "Product",
        fields: [
          { id: "1", name: "id", type: "uuid" as FieldType, isPrimaryKey: true, isRequired: true, isUnique: true },
          { id: "2", name: "name", type: "string" as FieldType, isPrimaryKey: false, isRequired: true, isUnique: false },
          { id: "3", name: "description", type: "text" as FieldType, isPrimaryKey: false, isRequired: false, isUnique: false },
          { id: "4", name: "price", type: "float" as FieldType, isPrimaryKey: false, isRequired: true, isUnique: false },
          { id: "5", name: "stock", type: "int" as FieldType, isPrimaryKey: false, isRequired: true, isUnique: false, defaultValue: "0" },
          { id: "6", name: "imageUrl", type: "string" as FieldType, isPrimaryKey: false, isRequired: false, isUnique: false },
        ]
      },
      {
        id: "orders",
        name: "Order",
        fields: [
          { id: "1", name: "id", type: "uuid" as FieldType, isPrimaryKey: true, isRequired: true, isUnique: true },
          { id: "2", name: "userId", type: "string" as FieldType, isPrimaryKey: false, isRequired: true, isUnique: false },
          { id: "3", name: "status", type: "enum" as FieldType, isPrimaryKey: false, isRequired: true, isUnique: false, defaultValue: "pending" },
          { id: "4", name: "total", type: "float" as FieldType, isPrimaryKey: false, isRequired: true, isUnique: false },
          { id: "5", name: "createdAt", type: "datetime" as FieldType, isPrimaryKey: false, isRequired: true, isUnique: false },
        ]
      }
    ]
  }
]

export function DatabaseDesigner({ isOpen, onOpenChange, onGenerateSchema }: DatabaseDesignerProps) {
  const [tables, setTables] = useState<TableSchema[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("design")
  const [copied, setCopied] = useState(false)

  const currentTable = tables.find(t => t.id === selectedTable)

  const addTable = useCallback(() => {
    const newTable: TableSchema = {
      id: `table-${Date.now()}`,
      name: `Table${tables.length + 1}`,
      fields: [
        {
          id: `field-${Date.now()}`,
          name: "id",
          type: "uuid",
          isPrimaryKey: true,
          isRequired: true,
          isUnique: true
        }
      ]
    }
    setTables(prev => [...prev, newTable])
    setSelectedTable(newTable.id)
  }, [tables.length])

  const deleteTable = useCallback((tableId: string) => {
    setTables(prev => prev.filter(t => t.id !== tableId))
    if (selectedTable === tableId) {
      setSelectedTable(null)
    }
    toast.success("Table deleted")
  }, [selectedTable])

  const updateTableName = useCallback((tableId: string, name: string) => {
    setTables(prev => prev.map(t => 
      t.id === tableId ? { ...t, name } : t
    ))
  }, [])

  const addField = useCallback((tableId: string) => {
    const newField: Field = {
      id: `field-${Date.now()}`,
      name: "newField",
      type: "string",
      isPrimaryKey: false,
      isRequired: false,
      isUnique: false
    }
    setTables(prev => prev.map(t => 
      t.id === tableId 
        ? { ...t, fields: [...t.fields, newField] }
        : t
    ))
  }, [])

  const updateField = useCallback((tableId: string, fieldId: string, updates: Partial<Field>) => {
    setTables(prev => prev.map(t => 
      t.id === tableId 
        ? { 
            ...t, 
            fields: t.fields.map(f => 
              f.id === fieldId ? { ...f, ...updates } : f
            )
          }
        : t
    ))
  }, [])

  const deleteField = useCallback((tableId: string, fieldId: string) => {
    setTables(prev => prev.map(t => 
      t.id === tableId 
        ? { ...t, fields: t.fields.filter(f => f.id !== fieldId) }
        : t
    ))
  }, [])

  const loadTemplate = useCallback((template: typeof COMMON_SCHEMAS[0]) => {
    setTables(template.tables)
    setSelectedTable(template.tables[0]?.id || null)
    toast.success(`Loaded ${template.name} template`)
  }, [])

  const generatePrismaSchema = useCallback(() => {
    let schema = `// Prisma Schema\n// Generated by Nairi Builder\n\ngenerator client {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\n`

    tables.forEach(table => {
      schema += `model ${table.name} {\n`
      table.fields.forEach(field => {
        let fieldType = ""
        switch (field.type) {
          case "string": fieldType = "String"; break
          case "text": fieldType = "String"; break
          case "int": fieldType = "Int"; break
          case "float": fieldType = "Float"; break
          case "boolean": fieldType = "Boolean"; break
          case "datetime": fieldType = "DateTime"; break
          case "json": fieldType = "Json"; break
          case "uuid": fieldType = "String"; break
          case "enum": fieldType = "String"; break
        }

        let modifiers = ""
        if (field.isPrimaryKey) modifiers += " @id"
        if (field.type === "uuid") modifiers += " @default(uuid())"
        if (field.isUnique && !field.isPrimaryKey) modifiers += " @unique"
        if (field.defaultValue) {
          if (field.type === "boolean") {
            modifiers += ` @default(${field.defaultValue})`
          } else if (field.type === "datetime" && field.defaultValue === "now") {
            modifiers += " @default(now())"
          } else {
            modifiers += ` @default("${field.defaultValue}")`
          }
        }
        if (field.name === "createdAt") modifiers += " @default(now())"
        if (field.name === "updatedAt") modifiers += " @updatedAt"

        const optional = field.isRequired ? "" : "?"
        schema += `  ${field.name} ${fieldType}${optional}${modifiers}\n`
      })
      schema += `}\n\n`
    })

    return schema
  }, [tables])

  const generateTypeScript = useCallback(() => {
    let types = `// TypeScript Types\n// Generated by Nairi Builder\n\n`

    tables.forEach(table => {
      types += `export interface ${table.name} {\n`
      table.fields.forEach(field => {
        let tsType = ""
        switch (field.type) {
          case "string": 
          case "text": 
          case "uuid": 
          case "enum": 
            tsType = "string"; break
          case "int": 
          case "float": 
            tsType = "number"; break
          case "boolean": 
            tsType = "boolean"; break
          case "datetime": 
            tsType = "Date"; break
          case "json": 
            tsType = "Record<string, unknown>"; break
        }
        const optional = field.isRequired ? "" : "?"
        types += `  ${field.name}${optional}: ${tsType}\n`
      })
      types += `}\n\n`
    })

    return types
  }, [tables])

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }, [])

  const handleGenerate = useCallback(() => {
    const prisma = generatePrismaSchema()
    const types = generateTypeScript()
    onGenerateSchema(types, prisma)
    toast.success("Schema generated and added to project!")
    onOpenChange(false)
  }, [generatePrismaSchema, generateTypeScript, onGenerateSchema, onOpenChange])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Database className="h-4 w-4 text-white" />
            </div>
            Database Schema Designer
          </DialogTitle>
          <DialogDescription>
            Design your database schema visually and generate Prisma models
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b">
            <TabsList>
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="code">Generated Code</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="design" className="flex-1 overflow-hidden m-0">
            <div className="flex h-full">
              {/* Tables List */}
              <div className="w-64 border-r flex flex-col">
                <div className="p-4 border-b">
                  <Button onClick={addTable} className="w-full gap-2" size="sm">
                    <Plus className="h-4 w-4" />
                    Add Table
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {tables.map(table => (
                      <div
                        key={table.id}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
                          selectedTable === table.id 
                            ? "bg-violet-500/10 text-violet-500" 
                            : "hover:bg-muted"
                        )}
                        onClick={() => setSelectedTable(table.id)}
                      >
                        <div className="flex items-center gap-2">
                          <Table className="h-4 w-4" />
                          <span className="text-sm font-medium">{table.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {table.fields.length}
                        </Badge>
                      </div>
                    ))}
                    {tables.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No tables yet.<br />Click "Add Table" to start.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Table Editor */}
              <div className="flex-1 flex flex-col">
                {currentTable ? (
                  <>
                    <div className="p-4 border-b flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Input
                          value={currentTable.name}
                          onChange={(e) => updateTableName(currentTable.id, e.target.value)}
                          className="w-48 font-semibold"
                        />
                        <Badge variant="outline">
                          {currentTable.fields.length} fields
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addField(currentTable.id)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Field
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteTable(currentTable.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-3">
                        {currentTable.fields.map(field => (
                          <Card key={field.id}>
                            <CardContent className="p-3">
                              <div className="flex items-start gap-3">
                                <div className="flex-1 grid grid-cols-4 gap-3">
                                  <div>
                                    <Label className="text-xs">Name</Label>
                                    <Input
                                      value={field.name}
                                      onChange={(e) => updateField(currentTable.id, field.id, { name: e.target.value })}
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Type</Label>
                                    <Select
                                      value={field.type}
                                      onValueChange={(value: FieldType) => updateField(currentTable.id, field.id, { type: value })}
                                    >
                                      <SelectTrigger className="h-8 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {FIELD_TYPES.map(type => (
                                          <SelectItem key={type.value} value={type.value}>
                                            <div className="flex items-center gap-2">
                                              <type.icon className="h-3 w-3" />
                                              {type.label}
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Default</Label>
                                    <Input
                                      value={field.defaultValue || ""}
                                      onChange={(e) => updateField(currentTable.id, field.id, { defaultValue: e.target.value })}
                                      placeholder="Optional"
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                  <div className="flex items-end gap-2">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant={field.isPrimaryKey ? "default" : "outline"}
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => updateField(currentTable.id, field.id, { isPrimaryKey: !field.isPrimaryKey })}
                                          >
                                            <Key className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Primary Key</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>

                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant={field.isRequired ? "default" : "outline"}
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => updateField(currentTable.id, field.id, { isRequired: !field.isRequired })}
                                          >
                                            !
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Required</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>

                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant={field.isUnique ? "default" : "outline"}
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => updateField(currentTable.id, field.id, { isUnique: !field.isUnique })}
                                          >
                                            U
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Unique</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>

                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-destructive"
                                      onClick={() => deleteField(currentTable.id, field.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-8">
                    <div>
                      <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold">No table selected</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Select a table from the list or create a new one
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full p-6">
              <div className="grid grid-cols-3 gap-4">
                {COMMON_SCHEMAS.map((template, i) => (
                  <Card
                    key={i}
                    className="cursor-pointer hover:border-violet-500/50 transition-colors"
                    onClick={() => loadTemplate(template)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-violet-500" />
                        {template.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        {template.tables.map(table => (
                          <div key={table.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Table className="h-3 w-3" />
                            {table.name}
                            <Badge variant="secondary" className="text-xs ml-auto">
                              {table.fields.length}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="code" className="flex-1 overflow-hidden m-0">
            <div className="flex h-full">
              <div className="flex-1 border-r flex flex-col">
                <div className="p-3 border-b flex items-center justify-between">
                  <Label className="font-semibold">Prisma Schema</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(generatePrismaSchema())}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <pre className="text-xs font-mono">
                    <code>{generatePrismaSchema()}</code>
                  </pre>
                </ScrollArea>
              </div>
              <div className="flex-1 flex flex-col">
                <div className="p-3 border-b flex items-center justify-between">
                  <Label className="font-semibold">TypeScript Types</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(generateTypeScript())}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <pre className="text-xs font-mono">
                    <code>{generateTypeScript()}</code>
                  </pre>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Generate Button */}
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600"
            onClick={handleGenerate}
            disabled={tables.length === 0}
          >
            <Wand2 className="h-4 w-4" />
            Generate & Add to Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Trigger button
export function DatabaseDesignerTrigger({ onClick }: { onClick: () => void }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={onClick}
          >
            <Database className="h-4 w-4" />
            Database
          </Button>
        </TooltipTrigger>
        <TooltipContent>Database Schema Designer</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
