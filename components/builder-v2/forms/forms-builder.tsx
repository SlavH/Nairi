'use client';

import React, { useState } from 'react';
import { FormInput, Plus, Trash2, GripVertical, Mail, Phone, User, MessageSquare, Calendar, CheckSquare, List, Upload, Star } from 'lucide-react';

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

const fieldTypes = [
  { type: 'text', label: 'Text Input', icon: FormInput },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Phone', icon: Phone },
  { type: 'name', label: 'Name', icon: User },
  { type: 'textarea', label: 'Text Area', icon: MessageSquare },
  { type: 'date', label: 'Date Picker', icon: Calendar },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'select', label: 'Dropdown', icon: List },
  { type: 'file', label: 'File Upload', icon: Upload },
  { type: 'rating', label: 'Rating', icon: Star }
];

export function FormsBuilder() {
  const [formName, setFormName] = useState('Contact Form');
  const [fields, setFields] = useState<FormField[]>([
    { id: '1', type: 'name', label: 'Full Name', placeholder: 'Enter your name', required: true },
    { id: '2', type: 'email', label: 'Email Address', placeholder: 'you@example.com', required: true },
    { id: '3', type: 'textarea', label: 'Message', placeholder: 'Your message...', required: false }
  ]);
  const [selectedField, setSelectedField] = useState<string | null>(null);

  const addField = (type: string) => {
    const fieldType = fieldTypes.find(f => f.type === type);
    const newField: FormField = {
      id: Date.now().toString(),
      type,
      label: fieldType?.label || 'New Field',
      placeholder: '',
      required: false,
      options: type === 'select' ? ['Option 1', 'Option 2', 'Option 3'] : undefined
    };
    setFields([...fields, newField]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    if (selectedField === id) setSelectedField(null);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const selectedFieldData = fields.find(f => f.id === selectedField);

  return (
    <div className="h-full flex bg-[#0a0a0f]">
      {/* Field Types Sidebar */}
      <div className="w-48 border-r border-white/10 p-3 overflow-y-auto custom-scrollbar">
        <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Add Fields</h4>
        <div className="space-y-2">
          {fieldTypes.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => addField(type)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-left transition-colors"
            >
              <Icon className="w-4 h-4 text-purple-400" />
              <span className="text-white text-sm">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form Preview */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        <div className="max-w-lg mx-auto">
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            aria-label="Form name"
            className="text-2xl font-bold text-white bg-transparent border-none outline-none mb-6 w-full"
          />
          <div className="space-y-4">
            {fields.map((field) => (
              <div
                key={field.id}
                onClick={() => setSelectedField(field.id)}
                className={`group relative bg-white/5 border rounded-xl p-4 cursor-pointer transition-all ${
                  selectedField === field.id ? 'border-purple-500' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab">
                  <GripVertical className="w-4 h-4 text-gray-500" />
                </div>
                <div className="ml-4">
                  <label className="text-white text-sm font-medium flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-red-400">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      placeholder={field.placeholder}
                      className="w-full mt-2 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm resize-none"
                      rows={3}
                      disabled
                    />
                  ) : field.type === 'select' ? (
                    <select className="w-full mt-2 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-gray-400 text-sm" disabled>
                      <option>Select an option</option>
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-5 h-5 border border-white/20 rounded" />
                      <span className="text-gray-400 text-sm">Checkbox label</span>
                    </div>
                  ) : field.type === 'rating' ? (
                    <div className="flex gap-1 mt-2">
                      {[1,2,3,4,5].map(i => <Star key={i} className="w-6 h-6 text-gray-500" />)}
                    </div>
                  ) : (
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      className="w-full mt-2 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm"
                      disabled
                    />
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                  className="absolute right-2 top-2 p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold">
            Submit
          </button>
        </div>
      </div>

      {/* Field Properties */}
      {selectedFieldData && (
        <div className="w-64 border-l border-white/10 p-4 overflow-y-auto custom-scrollbar">
          <h4 className="text-white font-semibold mb-4">Field Properties</h4>
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs block mb-1">Label</label>
              <input
                type="text"
                value={selectedFieldData.label}
                onChange={(e) => updateField(selectedFieldData.id, { label: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1">Placeholder</label>
              <input
                type="text"
                value={selectedFieldData.placeholder || ''}
                onChange={(e) => updateField(selectedFieldData.id, { placeholder: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedFieldData.required}
                onChange={(e) => updateField(selectedFieldData.id, { required: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <label className="text-white text-sm">Required field</label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FormsBuilder;
