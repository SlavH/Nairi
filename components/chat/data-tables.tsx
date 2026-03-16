"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Table,
  Plus,
  Trash2,
  Edit,
  Download,
  Upload,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  MoreVertical,
  Copy,
  Sparkles,
  Wand2,
  FileSpreadsheet,
  Database,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings,
  Eye,
  EyeOff
} from "lucide-react";

interface Column {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'url' | 'email';
  width?: number;
  visible: boolean;
}

interface TableData {
  id: string;
  name: string;
  description: string;
  columns: Column[];
  rows: Record<string, any>[];
  createdAt: Date;
  updatedAt: Date;
}

const SAMPLE_TABLES: TableData[] = [
  {
    id: '1',
    name: 'Customer Database',
    description: 'List of all customers',
    columns: [
      { id: 'name', name: 'Name', type: 'text', visible: true },
      { id: 'email', name: 'Email', type: 'email', visible: true },
      { id: 'company', name: 'Company', type: 'text', visible: true },
      { id: 'status', name: 'Status', type: 'select', visible: true },
      { id: 'value', name: 'Value', type: 'number', visible: true },
      { id: 'created', name: 'Created', type: 'date', visible: true },
    ],
    rows: [
      { id: '1', name: 'John Doe', email: 'john@example.com', company: 'Acme Inc', status: 'Active', value: 5000, created: '2024-01-15' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', company: 'Tech Corp', status: 'Active', value: 12000, created: '2024-02-20' },
      { id: '3', name: 'Bob Wilson', email: 'bob@example.com', company: 'StartupXYZ', status: 'Pending', value: 3500, created: '2024-03-10' },
      { id: '4', name: 'Alice Brown', email: 'alice@example.com', company: 'BigCo', status: 'Active', value: 25000, created: '2024-01-05' },
      { id: '5', name: 'Charlie Davis', email: 'charlie@example.com', company: 'SmallBiz', status: 'Inactive', value: 1500, created: '2024-04-01' },
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Product Inventory',
    description: 'Product stock levels',
    columns: [
      { id: 'sku', name: 'SKU', type: 'text', visible: true },
      { id: 'product', name: 'Product', type: 'text', visible: true },
      { id: 'category', name: 'Category', type: 'select', visible: true },
      { id: 'stock', name: 'Stock', type: 'number', visible: true },
      { id: 'price', name: 'Price', type: 'number', visible: true },
    ],
    rows: [
      { id: '1', sku: 'PRD-001', product: 'Widget A', category: 'Electronics', stock: 150, price: 29.99 },
      { id: '2', sku: 'PRD-002', product: 'Gadget B', category: 'Electronics', stock: 75, price: 49.99 },
      { id: '3', sku: 'PRD-003', product: 'Tool C', category: 'Hardware', stock: 200, price: 19.99 },
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export function DataTables() {
  const [tables, setTables] = useState<TableData[]>(SAMPLE_TABLES);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(SAMPLE_TABLES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const rowsPerPage = 10;

  const filteredRows = selectedTable?.rows.filter(row => {
    if (!searchQuery) return true;
    return Object.values(row).some(value => 
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) || [];

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (!sortColumn) return 0;
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    const direction = sortDirection === 'asc' ? 1 : -1;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal - bVal) * direction;
    }
    return String(aVal).localeCompare(String(bVal)) * direction;
  });

  const paginatedRows = sortedRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(sortedRows.length / rowsPerPage);

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const startEditing = (rowId: string, columnId: string, value: any) => {
    setEditingCell({ rowId, columnId });
    setEditValue(String(value));
  };

  const saveEdit = () => {
    if (!editingCell || !selectedTable) return;
    
    const updatedRows = selectedTable.rows.map(row => {
      if (row.id === editingCell.rowId) {
        return { ...row, [editingCell.columnId]: editValue };
      }
      return row;
    });
    
    const updatedTable = { ...selectedTable, rows: updatedRows, updatedAt: new Date() };
    setTables(tables.map(t => t.id === selectedTable.id ? updatedTable : t));
    setSelectedTable(updatedTable);
    setEditingCell(null);
  };

  const addRow = () => {
    if (!selectedTable) return;
    
    const newRow: Record<string, any> = { id: Date.now().toString() };
    selectedTable.columns.forEach(col => {
      newRow[col.id] = col.type === 'number' ? 0 : '';
    });
    
    const updatedTable = {
      ...selectedTable,
      rows: [...selectedTable.rows, newRow],
      updatedAt: new Date()
    };
    setTables(tables.map(t => t.id === selectedTable.id ? updatedTable : t));
    setSelectedTable(updatedTable);
  };

  const deleteRow = (rowId: string) => {
    if (!selectedTable) return;
    
    const updatedTable = {
      ...selectedTable,
      rows: selectedTable.rows.filter(r => r.id !== rowId),
      updatedAt: new Date()
    };
    setTables(tables.map(t => t.id === selectedTable.id ? updatedTable : t));
    setSelectedTable(updatedTable);
  };

  const toggleColumnVisibility = (columnId: string) => {
    if (!selectedTable) return;
    
    const updatedTable = {
      ...selectedTable,
      columns: selectedTable.columns.map(col =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    };
    setTables(tables.map(t => t.id === selectedTable.id ? updatedTable : t));
    setSelectedTable(updatedTable);
  };

  const createNewTable = () => {
    const newTable: TableData = {
      id: Date.now().toString(),
      name: 'New Table',
      description: '',
      columns: [
        { id: 'col1', name: 'Column 1', type: 'text', visible: true },
        { id: 'col2', name: 'Column 2', type: 'text', visible: true },
      ],
      rows: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setTables([...tables, newTable]);
    setSelectedTable(newTable);
  };

  const aiAutofill = () => {
    // Simulate AI autofill
    alert('AI Autofill would analyze patterns and fill empty cells');
  };

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Tables
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your data
          </p>
        </div>

        <div className="p-4 border-b">
          <Button className="w-full" onClick={createNewTable}>
            <Plus className="h-4 w-4 mr-2" />
            New Table
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {tables.map(table => (
              <Button
                key={table.id}
                variant={selectedTable?.id === table.id ? 'secondary' : 'ghost'}
                className="w-full justify-start mb-1"
                onClick={() => setSelectedTable(table)}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                <span className="truncate">{table.name}</span>
                <Badge variant="outline" className="ml-auto">
                  {table.rows.length}
                </Badge>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      {selectedTable ? (
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b flex items-center gap-4">
            <div className="flex-1">
              <h3 className="font-semibold">{selectedTable.name}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedTable.rows.length} rows • {selectedTable.columns.length} columns
              </p>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {selectedTable.columns.map(col => (
                  <DropdownMenuItem
                    key={col.id}
                    onClick={() => toggleColumnVisibility(col.id)}
                  >
                    {col.visible ? (
                      <Eye className="h-4 w-4 mr-2" />
                    ) : (
                      <EyeOff className="h-4 w-4 mr-2" />
                    )}
                    {col.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="sm" onClick={aiAutofill}>
              <Wand2 className="h-4 w-4 mr-2" />
              AI Autofill
            </Button>

            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <Button size="sm" onClick={addRow}>
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  {selectedTable.columns.filter(c => c.visible).map(column => (
                    <th
                      key={column.id}
                      className="text-left p-3 border-b font-medium text-sm cursor-pointer hover:bg-muted/80"
                      onClick={() => handleSort(column.id)}
                    >
                      <div className="flex items-center gap-2">
                        {column.name}
                        {sortColumn === column.id && (
                          sortDirection === 'asc' 
                            ? <SortAsc className="h-4 w-4" />
                            : <SortDesc className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="w-10 p-3 border-b"></th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map(row => (
                  <tr key={row.id} className="hover:bg-muted/50">
                    {selectedTable.columns.filter(c => c.visible).map(column => (
                      <td
                        key={column.id}
                        className="p-3 border-b text-sm"
                        onDoubleClick={() => startEditing(row.id, column.id, row[column.id])}
                      >
                        {editingCell?.rowId === row.id && editingCell?.columnId === column.id ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                            autoFocus
                            className="h-8"
                          />
                        ) : (
                          <span>
                            {column.type === 'number' && typeof row[column.id] === 'number'
                              ? row[column.id].toLocaleString()
                              : row[column.id]}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="p-3 border-b">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteRow(row.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, sortedRows.length)} of {sortedRows.length} rows
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2">
                Page {currentPage} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a table or create a new one</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTables;
