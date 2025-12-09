'use client';

import React, { useState, useEffect } from 'react';
import { RolePermission } from '@/lib/types';
import { getRolePermissions, createRolePermission, updateRolePermission, deleteRolePermission } from '@/app/actions/permissions';
import { Plus, Trash2, Save, X, Edit2, Loader2, Shield } from 'lucide-react';

const AVAILABLE_PERMISSIONS = [
    { key: 'VIEW_ADMIN_DASHBOARD', label: 'View Admin Dashboard', description: 'Basic access to /admin' },
    { key: 'MANAGE_FARM_DATA', label: 'Manage Farm Data', description: 'Edit/Add Data in Management Tab' },
    { key: 'MANAGE_NEIGHBORHOODS', label: 'Manage Neighborhoods', description: 'Edit/Add Neighborhoods' },
    { key: 'MANAGE_EVENTS', label: 'Manage Events', description: 'Edit/Add Events' },
    { key: 'MANAGE_FARM_NAMES', label: 'Manage Farm Names', description: 'Access Farm Name Change Tool' },
    { key: 'VIEW_BAR_LEADERBOARD', label: 'View Bar Leaderboard', description: 'Access Bar Collector Leaderboard' },
];

export default function AdminPermissionsManager() {
    const [permissions, setPermissions] = useState<RolePermission[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [newRule, setNewRule] = useState<Partial<RolePermission>>({
        role_name: '',
        role_id: '',
        permissions: [],
    });

    useEffect(() => {
        loadPermissions();
    }, []);

    const loadPermissions = async () => {
        setLoading(true);
        const data = await getRolePermissions();
        setPermissions(data);
        setLoading(false);
    };

    const handleEdit = (rule: RolePermission) => {
        setNewRule({
            role_name: rule.role_name,
            role_id: rule.role_id,
            permissions: rule.permissions,
        });
        setEditingId(rule.id);
        setIsAdding(true);
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setNewRule({
            role_name: '',
            role_id: '',
            permissions: [],
        });
    };

    const handleTogglePermission = (key: string) => {
        const current = newRule.permissions || [];
        if (current.includes(key)) {
            setNewRule({ ...newRule, permissions: current.filter(p => p !== key) });
        } else {
            setNewRule({ ...newRule, permissions: [...current, key] });
        }
    };

    const handleSave = async () => {
        if (!newRule.role_name || !newRule.role_id) {
            alert('Please fill in Role Name and Role ID');
            return;
        }

        let result;
        if (editingId) {
            result = await updateRolePermission(editingId, newRule);
        } else {
            result = await createRolePermission(newRule);
        }

        if (result && !result.success) {
            alert(`Error saving rule: ${result.error}`);
            return;
        }

        await loadPermissions();
        handleCancel();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this rule? This will revoke access for this role immediately.')) {
            await deleteRolePermission(id);
            await loadPermissions();
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield className="w-6 h-6 text-purple-500" />
                        Role Permissions
                    </h2>
                    <p className="text-sm text-gray-500">Manage which Discord roles can access specific parts of the Admin Dashboard.</p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Role Rule
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">{editingId ? 'Edit Rule' : 'New Rule'}</h3>
                        <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Role Name (Label)</label>
                            <input
                                type="text"
                                value={newRule.role_name}
                                onChange={e => setNewRule({ ...newRule, role_name: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent"
                                placeholder="e.g. Goat Leader"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Discord Role ID</label>
                            <input
                                type="text"
                                value={newRule.role_id}
                                onChange={e => setNewRule({ ...newRule, role_id: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent font-mono"
                                placeholder="123456789..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Permissions</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {AVAILABLE_PERMISSIONS.map((perm) => (
                                <div
                                    key={perm.key}
                                    onClick={() => handleTogglePermission(perm.key)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-start gap-3 ${newRule.permissions?.includes(perm.key)
                                            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 ${newRule.permissions?.includes(perm.key)
                                            ? 'bg-purple-500 border-purple-500'
                                            : 'border-gray-400'
                                        }`}>
                                        {newRule.permissions?.includes(perm.key) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">{perm.label}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{perm.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button onClick={handleCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                            <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Save'} Rule
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {permissions.map((rule) => (
                    <div key={rule.id} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-lg">{rule.role_name}</h4>
                                <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-500">{rule.role_id}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {rule.permissions.map(p => {
                                    const label = AVAILABLE_PERMISSIONS.find(ap => ap.key === p)?.label || p;
                                    return (
                                        <span key={p} className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                            {label}
                                        </span>
                                    );
                                })}
                                {rule.permissions.length === 0 && <span className="text-xs text-gray-400 italic">No permissions assigned</span>}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleEdit(rule)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                                <Edit2 className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleDelete(rule.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
                {permissions.length === 0 && !loading && (
                    <div className="text-center text-gray-500 py-12">
                        <Shield className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                        <p>No permission rules found.</p>
                        <p className="text-sm">Add a rule to grant access to specific roles.</p>
                        <p className="text-xs mt-4 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/10 inline-block px-3 py-1 rounded">
                            Note: Super Admins always have full access.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
