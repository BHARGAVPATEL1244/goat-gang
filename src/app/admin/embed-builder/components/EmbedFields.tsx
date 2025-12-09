import React from 'react';
import { Plus, X, Type } from 'lucide-react';

interface Field {
    name: string;
    value: string;
    inline: boolean;
}

interface EmbedFieldsProps {
    fields: Field[];
    onChange: (fields: Field[]) => void;
}

export default function EmbedFields({ fields, onChange }: EmbedFieldsProps) {
    const addField = () => {
        onChange([...fields, { name: 'Field Name', value: 'Field Value', inline: false }]);
    };

    const updateField = (index: number, key: keyof Field, value: any) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], [key]: value };
        onChange(newFields);
    };

    const removeField = (index: number) => {
        onChange(fields.filter((_, i) => i !== index));
    };

    return (
        <div className="border-t border-gray-700 pt-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <Type className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-gray-200">Fields</h3>
                </div>
                <button
                    onClick={addField}
                    className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 border border-blue-500/20"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Add Field
                </button>
            </div>

            <div className="space-y-3">
                {fields.map((field, i) => (
                    <div key={i} className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/50 flex gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex-1 space-y-3">
                            <input
                                type="text"
                                placeholder="Field Name"
                                className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 w-full text-sm font-medium focus:border-blue-500 focus:outline-none transition-colors"
                                value={field.name}
                                onChange={e => updateField(i, 'name', e.target.value)}
                            />
                            <textarea
                                placeholder="Field Value"
                                className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 w-full text-sm h-20 resize-none focus:border-blue-500 focus:outline-none transition-colors"
                                value={field.value}
                                onChange={e => updateField(i, 'value', e.target.value)}
                            />
                            <label className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 cursor-pointer w-fit">
                                <input
                                    type="checkbox"
                                    checked={field.inline}
                                    onChange={e => updateField(i, 'inline', e.target.checked)}
                                    className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500/20"
                                />
                                Inline Field
                            </label>
                        </div>
                        <button
                            onClick={() => removeField(i)}
                            className="text-gray-500 hover:text-red-400 transition-colors self-start p-1"
                            title="Remove Field"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {fields.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-800 rounded-xl text-gray-600 text-sm">
                        No fields added yet. Click "Add Field" to start.
                    </div>
                )}
            </div>
        </div>
    );
}
