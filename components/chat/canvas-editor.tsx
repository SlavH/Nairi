"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pencil,
  Type,
  Image,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Undo,
  Redo,
  Download,
  Upload,
  Trash2,
  ZoomIn,
  ZoomOut,
  Move,
  Palette,
  Layers,
  Save,
  Share2,
  Sparkles,
  Wand2,
  Copy,
  Scissors,
  Grid,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CanvasElement {
  id: string;
  type: "text" | "image" | "shape" | "line" | "arrow";
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  src?: string;
  shapeType?: "rectangle" | "circle" | "triangle";
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  textAlign?: string;
  rotation?: number;
  opacity?: number;
  zIndex: number;
}

interface CanvasEditorProps {
  initialContent?: string;
  onSave?: (content: string, elements: CanvasElement[]) => void;
  onAiEdit?: (prompt: string, elements: CanvasElement[]) => Promise<CanvasElement[]>;
}

const COLORS = [
  "#FFFFFF", "#000000", "#EF4444", "#F97316", "#EAB308",
  "#22C55E", "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899",
];

const TOOLS = [
  { id: "select", icon: Move, label: "Выбор" },
  { id: "text", icon: Type, label: "Текст" },
  { id: "pencil", icon: Pencil, label: "Карандаш" },
  { id: "rectangle", icon: Square, label: "Прямоугольник" },
  { id: "circle", icon: Circle, label: "Круг" },
  { id: "line", icon: Minus, label: "Линия" },
  { id: "arrow", icon: ArrowRight, label: "Стрелка" },
  { id: "image", icon: Image, label: "Изображение" },
];

export function CanvasEditor({ initialContent, onSave, onAiEdit }: CanvasEditorProps) {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedTool, setSelectedTool] = useState("select");
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState("#FFFFFF");
  const [selectedBgColor, setSelectedBgColor] = useState("transparent");
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Save to history
  const saveToHistory = (newElements: CanvasElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newElements]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(history[historyIndex - 1]);
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(history[historyIndex + 1]);
    }
  };

  // Add element
  const addElement = (type: CanvasElement["type"], x: number, y: number) => {
    const newElement: CanvasElement = {
      id: `element-${Date.now()}`,
      type,
      x,
      y,
      width: type === "text" ? 200 : 100,
      height: type === "text" ? 40 : 100,
      content: type === "text" ? "Текст" : undefined,
      color: selectedColor,
      backgroundColor: selectedBgColor,
      fontSize: 16,
      fontWeight: "normal",
      textAlign: "left",
      rotation: 0,
      opacity: 1,
      zIndex: elements.length,
      shapeType: type === "shape" ? "rectangle" : undefined,
    };

    const newElements = [...elements, newElement];
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedElement(newElement.id);
  };

  // Update element
  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    const newElements = elements.map((el) =>
      el.id === id ? { ...el, ...updates } : el
    );
    setElements(newElements);
    saveToHistory(newElements);
  };

  // Delete element
  const deleteElement = (id: string) => {
    const newElements = elements.filter((el) => el.id !== id);
    setElements(newElements);
    saveToHistory(newElements);
    setSelectedElement(null);
  };

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (100 / zoom);
    const y = (e.clientY - rect.top) * (100 / zoom);

    if (selectedTool === "text") {
      addElement("text", x, y);
    } else if (selectedTool === "rectangle" || selectedTool === "circle") {
      addElement("shape", x, y);
    } else if (selectedTool === "line" || selectedTool === "arrow") {
      addElement("line", x, y);
    } else if (selectedTool === "select") {
      setSelectedElement(null);
    }
  };

  // AI Edit
  const handleAiEdit = async () => {
    if (!aiPrompt.trim() || !onAiEdit) return;

    setIsAiProcessing(true);
    try {
      const newElements = await onAiEdit(aiPrompt, elements);
      setElements(newElements);
      saveToHistory(newElements);
      setAiPrompt("");
    } catch (error) {
      console.error("AI edit error:", error);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Export canvas
  const handleExport = () => {
    // In real implementation, use html2canvas or similar
    const data = JSON.stringify(elements, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "canvas-export.json";
    link.click();
  };

  // Save
  const handleSave = () => {
    if (onSave) {
      onSave(JSON.stringify(elements), elements);
    }
  };

  const selectedEl = elements.find((el) => el.id === selectedElement);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-1">
          {/* Tools */}
          {TOOLS.map((tool) => (
            <Button
              key={tool.id}
              variant={selectedTool === tool.id ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setSelectedTool(tool.id)}
              title={tool.label}
            >
              <tool.icon className="h-4 w-4" />
            </Button>
          ))}

          <div className="w-px h-6 bg-gray-700 mx-2" />

          {/* Colors */}
          <div className="flex items-center gap-1">
            {COLORS.slice(0, 6).map((color) => (
              <button
                key={color}
                className={cn(
                  "w-6 h-6 rounded border-2 transition-transform hover:scale-110",
                  selectedColor === color ? "border-white" : "border-transparent"
                )}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>

          <div className="w-px h-6 bg-gray-700 mx-2" />

          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom(Math.max(25, zoom - 25))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-400 w-12 text-center">{zoom}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom(Math.min(200, zoom + 25))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-700 mx-2" />

          {/* Grid toggle */}
          <Button
            variant={showGrid ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid className="h-4 w-4" />
          </Button>

          {/* AI Edit */}
          <Button
            variant={showAiPanel ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAiPanel(!showAiPanel)}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            AI
          </Button>

          {/* Save/Export */}
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Экспорт
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" />
            Сохранить
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 overflow-auto p-4 bg-gray-800">
          <div
            ref={canvasRef}
            className={cn(
              "relative bg-white mx-auto transition-transform",
              showGrid && "bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:20px_20px]"
            )}
            style={{
              width: 800 * (zoom / 100),
              height: 600 * (zoom / 100),
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top left",
            }}
            onClick={handleCanvasClick}
          >
            {elements.map((element) => (
              <div
                key={element.id}
                className={cn(
                  "absolute cursor-move transition-shadow",
                  selectedElement === element.id && "ring-2 ring-blue-500"
                )}
                style={{
                  left: element.x,
                  top: element.y,
                  width: element.width,
                  height: element.height,
                  transform: `rotate(${element.rotation || 0}deg)`,
                  opacity: element.opacity,
                  zIndex: element.zIndex,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElement(element.id);
                }}
              >
                {element.type === "text" && (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    className="w-full h-full outline-none"
                    style={{
                      color: element.color,
                      backgroundColor: element.backgroundColor,
                      fontSize: element.fontSize,
                      fontWeight: element.fontWeight,
                      fontStyle: element.fontStyle,
                      textDecoration: element.textDecoration,
                      textAlign: element.textAlign as any,
                    }}
                    onBlur={(e) =>
                      updateElement(element.id, { content: e.currentTarget.textContent || "" })
                    }
                  >
                    {element.content}
                  </div>
                )}

                {element.type === "shape" && element.shapeType === "rectangle" && (
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundColor: element.backgroundColor || element.color,
                      border: `2px solid ${element.color}`,
                    }}
                  />
                )}

                {element.type === "shape" && element.shapeType === "circle" && (
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      backgroundColor: element.backgroundColor || element.color,
                      border: `2px solid ${element.color}`,
                    }}
                  />
                )}

                {element.type === "image" && element.src && (
                  <img
                    src={element.src}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Properties panel */}
        {selectedEl && (
          <div className="w-64 border-l border-gray-800 p-4 space-y-4 overflow-y-auto">
            <h3 className="font-medium">Свойства</h3>

            {selectedEl.type === "text" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Размер шрифта</label>
                  <Input
                    type="number"
                    value={selectedEl.fontSize}
                    onChange={(e) =>
                      updateElement(selectedEl.id, { fontSize: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div className="flex gap-1">
                  <Button
                    variant={selectedEl.fontWeight === "bold" ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      updateElement(selectedEl.id, {
                        fontWeight: selectedEl.fontWeight === "bold" ? "normal" : "bold",
                      })
                    }
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={selectedEl.fontStyle === "italic" ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      updateElement(selectedEl.id, {
                        fontStyle: selectedEl.fontStyle === "italic" ? "normal" : "italic",
                      })
                    }
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={selectedEl.textDecoration === "underline" ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      updateElement(selectedEl.id, {
                        textDecoration:
                          selectedEl.textDecoration === "underline" ? "none" : "underline",
                      })
                    }
                  >
                    <Underline className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant={selectedEl.textAlign === "left" ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateElement(selectedEl.id, { textAlign: "left" })}
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={selectedEl.textAlign === "center" ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateElement(selectedEl.id, { textAlign: "center" })}
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={selectedEl.textAlign === "right" ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateElement(selectedEl.id, { textAlign: "right" })}
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Цвет</label>
              <div className="flex flex-wrap gap-1">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded border-2",
                      selectedEl.color === color ? "border-white" : "border-gray-600"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => updateElement(selectedEl.id, { color })}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Прозрачность</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={selectedEl.opacity}
                onChange={(e) =>
                  updateElement(selectedEl.id, { opacity: parseFloat(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Поворот</label>
              <input
                type="range"
                min="0"
                max="360"
                value={selectedEl.rotation}
                onChange={(e) =>
                  updateElement(selectedEl.id, { rotation: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => deleteElement(selectedEl.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить
            </Button>
          </div>
        )}

        {/* AI Panel */}
        {showAiPanel && (
          <div className="w-80 border-l border-gray-800 p-4 space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              AI редактирование
            </h3>

            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Опишите изменения... Например: 'Добавь заголовок вверху' или 'Сделай фон синим'"
              rows={4}
            />

            <Button
              onClick={handleAiEdit}
              disabled={!aiPrompt.trim() || isAiProcessing}
              className="w-full"
            >
              {isAiProcessing ? (
                <>Обработка...</>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Применить
                </>
              )}
            </Button>

            <div className="space-y-2">
              <p className="text-sm text-gray-400">Быстрые команды:</p>
              <div className="flex flex-wrap gap-1">
                {[
                  "Добавь заголовок",
                  "Создай диаграмму",
                  "Добавь иконки",
                  "Сделай красивее",
                  "Добавь тени",
                ].map((cmd) => (
                  <Badge
                    key={cmd}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-700"
                    onClick={() => setAiPrompt(cmd)}
                  >
                    {cmd}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CanvasEditor;
