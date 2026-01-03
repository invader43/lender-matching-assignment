/**
 * ParameterManager - Admin component for managing global parameters
 */

import React, { useState, useEffect } from 'react';
import {
    Box, Input, Text, Heading, Badge, Flex, HStack, VStack,
    Spinner, IconButton, Grid, chakra
} from '@chakra-ui/react';
import { Button } from '@/components/ui/button';
import { FaFont, FaHashtag, FaCheckSquare, FaList, FaDollarSign, FaEdit, FaBan, FaCheck, FaTimes, FaPlus } from 'react-icons/fa';
import api from '../services/api';
import type { ParameterDefinition, DataType } from '../types/models';

interface Props {
    onClose?: () => void;
}

const DATA_TYPES: { value: DataType; label: string }[] = [
    { value: 'string', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Yes/No' },
    { value: 'select', label: 'Dropdown' },
    { value: 'currency', label: 'Currency' },
];

export const ParameterManager: React.FC<Props> = ({ onClose }) => {
    const [parameters, setParameters] = useState<ParameterDefinition[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<ParameterDefinition>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showInactive, setShowInactive] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newParam, setNewParam] = useState({
        key_name: '',
        display_label: '',
        data_type: 'string' as DataType,
        description: '',
        options: { values: [] as string[] },
    });
    const [newOptionValue, setNewOptionValue] = useState('');

    useEffect(() => {
        loadParameters();
    }, [showInactive]);

    const loadParameters = async () => {
        try {
            setLoading(true);
            const data = await api.parameters.getAll(!showInactive);
            setParameters(data);
        } catch (err) {
            setError('Failed to load parameters');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (param: ParameterDefinition) => {
        setEditingId(param.id);
        setEditForm({
            display_label: param.display_label,
            description: param.description || '',
            data_type: param.data_type,
            options: param.options || { values: [] },
            is_active: param.is_active,
        });
        setError('');
        setSuccess('');
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleEditChange = (field: string, value: any) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
    };

    const saveEdit = async (keyName: string) => {
        setSaving(true);
        setError('');
        try {
            await api.parameters.update(keyName, editForm);
            setSuccess('Parameter updated successfully!');
            await loadParameters();
            setEditingId(null);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update parameter');
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (param: ParameterDefinition) => {
        try {
            await api.parameters.update(param.key_name, { is_active: !param.is_active });
            await loadParameters();
            setSuccess(`Parameter ${param.is_active ? 'deactivated' : 'activated'}`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update parameter');
        }
    };

    const handleCreateParam = async () => {
        if (!newParam.key_name || !newParam.display_label) {
            setError('Key name and display label are required');
            return;
        }

        setSaving(true);
        setError('');
        try {
            await api.parameters.create({
                key_name: newParam.key_name,
                display_label: newParam.display_label,
                data_type: newParam.data_type,
                description: newParam.description || undefined,
                options: newParam.data_type === 'select' ? newParam.options : undefined,
            });
            setSuccess('Parameter created successfully!');
            setIsCreating(false);
            setNewParam({
                key_name: '',
                display_label: '',
                data_type: 'string',
                description: '',
                options: { values: [] },
            });
            await loadParameters();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to create parameter');
        } finally {
            setSaving(false);
        }
    };

    const addOptionToNew = () => {
        if (newOptionValue.trim()) {
            setNewParam(prev => ({
                ...prev,
                options: { values: [...(prev.options?.values || []), newOptionValue.trim()] }
            }));
            setNewOptionValue('');
        }
    };

    const removeOptionFromNew = (index: number) => {
        setNewParam(prev => ({
            ...prev,
            options: { values: prev.options?.values?.filter((_, i) => i !== index) || [] }
        }));
    };

    const getTypeIcon = (type: DataType) => {
        switch (type) {
            case 'number': return <FaHashtag />;
            case 'currency': return <FaDollarSign />;
            case 'boolean': return <FaCheckSquare />;
            case 'select': return <FaList />;
            default: return <FaFont />;
        }
    };

    if (loading) {
        return (
            <Flex justify="center" align="center" h="200px">
                <Spinner size="xl" color="blue.500" />
                <Text ml={4} color="gray.500">Loading parameters...</Text>
            </Flex>
        );
    }

    return (
        <Box p={4} bg="bg.subtle" rounded="md" h="100%">
            <Flex justify="space-between" align="center" mb={6}>
                <Heading size="md" color="fg.default">📊 Parameter Registry</Heading>
                <HStack gap={4}>
                    <Box as="label" display="flex" alignItems="center" gap={2} cursor="pointer">
                        <chakra.input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e: any) => setShowInactive(e.target.checked)}
                            width="16px"
                            height="16px"
                        />
                        <Text fontSize="sm">Show inactive</Text>
                    </Box>
                    <Button
                        size="sm"
                        onClick={() => setIsCreating(true)}
                        disabled={isCreating}
                    >
                        <FaPlus style={{ marginRight: '8px' }} /> Add Parameter
                    </Button>
                    {onClose && (
                        <Button variant="outline" size="sm" onClick={onClose}>
                            Close
                        </Button>
                    )}
                </HStack>
            </Flex>

            {error && <Box bg="red.subtle" color="red.fg" p={2} rounded="md" mb={4}>{error}</Box>}
            {success && <Box bg="green.subtle" color="green.fg" p={2} rounded="md" mb={4}>{success}</Box>}

            {/* Create new parameter form */}
            {isCreating && (
                <Box mb={6} shadow="md" borderColor="blue.solid" borderTopWidth={4} bg="bg.panel" rounded="md" p={4}>
                    <Heading size="sm" mb={4}>Create New Parameter</Heading>
                    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4} mb={4}>
                        <Box>
                            <Text fontWeight="bold" fontSize="sm" mb={1}>Key Name</Text>
                            <Input
                                value={newParam.key_name}
                                onChange={(e) => setNewParam(prev => ({ ...prev, key_name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                                placeholder="e.g., annual_revenue"
                                bg="bg.surface"
                            />
                        </Box>
                        <Box>
                            <Text fontWeight="bold" fontSize="sm" mb={1}>Display Label</Text>
                            <Input
                                value={newParam.display_label}
                                onChange={(e) => setNewParam(prev => ({ ...prev, display_label: e.target.value }))}
                                placeholder="e.g., Annual Revenue"
                                bg="bg.surface"
                            />
                        </Box>
                        <Box>
                            <Text fontWeight="bold" fontSize="sm" mb={1}>Data Type</Text>
                            <chakra.select
                                width="100%"
                                p={2}
                                borderWidth="1px"
                                borderRadius="md"
                                bg="bg.surface"
                                value={newParam.data_type}
                                onChange={(e: any) => setNewParam(prev => ({ ...prev, data_type: e.target.value as DataType }))}
                            >
                                {DATA_TYPES.map(dt => (
                                    <option key={dt.value} value={dt.value}>{dt.label}</option>
                                ))}
                            </chakra.select>
                        </Box>
                        <Box>
                            <Text fontWeight="bold" fontSize="sm" mb={1}>Description</Text>
                            <Input
                                value={newParam.description}
                                onChange={(e) => setNewParam(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Help text for this field"
                                bg="bg.surface"
                            />
                        </Box>
                    </Grid>

                    {newParam.data_type === 'select' && (
                        <Box mb={4} p={3} bg="bg.subtle" rounded="md" border="1px" borderColor="border.muted">
                            <Text fontWeight="bold" fontSize="sm" mb={2}>Options</Text>
                            <Flex wrap="wrap" gap={2} mb={2}>
                                {newParam.options?.values?.map((opt, idx) => (
                                    <Badge key={idx} colorPalette="blue" display="flex" alignItems="center" px={2} py={1} rounded="full">
                                        {opt}
                                        <IconButton
                                            aria-label="Remove option"
                                            size="xs"
                                            variant="ghost"
                                            ml={1}
                                            h="auto"
                                            minW="auto"
                                            onClick={() => removeOptionFromNew(idx)}
                                        >
                                            <FaTimes />
                                        </IconButton>
                                    </Badge>
                                ))}
                            </Flex>
                            <HStack>
                                <Input
                                    size="sm"
                                    value={newOptionValue}
                                    onChange={(e) => setNewOptionValue(e.target.value)}
                                    placeholder="Add option..."
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOptionToNew())}
                                    bg="bg.surface"
                                />
                                <Button size="sm" onClick={addOptionToNew}>Add</Button>
                            </HStack>
                        </Box>
                    )}

                    <HStack justify="flex-end" mt={4}>
                        <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                        <Button onClick={handleCreateParam} loading={saving}>Create Parameter</Button>
                    </HStack>
                </Box>
            )}

            {/* Parameters list */}
            <VStack gap={4} align="stretch" pb={10}>
                {parameters.length === 0 ? (
                    <Text color="fg.muted" textAlign="center" py={8}>No parameters found.</Text>
                ) : (
                    parameters.map((param) => (
                        <Box
                            key={param.id}
                            shadow="sm"
                            borderLeftWidth={4}
                            borderColor={!param.is_active ? 'border.muted' : 'blue.solid'}
                            opacity={!param.is_active ? 0.8 : 1}
                            bg="bg.panel"
                            rounded="md"
                            p={4}
                        >
                            {editingId === param.id ? (
                                // Edit mode
                                <Box>
                                    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3} mb={3}>
                                        <Box>
                                            <Text fontSize="xs" fontWeight="bold">Label</Text>
                                            <Input
                                                size="sm"
                                                value={editForm.display_label || ''}
                                                onChange={(e) => handleEditChange('display_label', e.target.value)}
                                            />
                                        </Box>
                                        <Box>
                                            <Text fontSize="xs" fontWeight="bold">Type</Text>
                                            <chakra.select
                                                width="100%"
                                                p={1}
                                                fontSize="sm"
                                                borderWidth="1px"
                                                borderRadius="md"
                                                value={editForm.data_type || param.data_type}
                                                onChange={(e: any) => handleEditChange('data_type', e.target.value)}
                                            >
                                                {DATA_TYPES.map(dt => (
                                                    <option key={dt.value} value={dt.value}>{dt.label}</option>
                                                ))}
                                            </chakra.select>
                                        </Box>
                                        <Box gridColumn={{ md: "span 2" }}>
                                            <Text fontSize="xs" fontWeight="bold">Description</Text>
                                            <Input
                                                size="sm"
                                                value={editForm.description || ''}
                                                onChange={(e) => handleEditChange('description', e.target.value)}
                                            />
                                        </Box>
                                    </Grid>
                                    <HStack justify="flex-end">
                                        <Button size="sm" variant="ghost" onClick={cancelEditing}>Cancel</Button>
                                        <Button size="sm" onClick={() => saveEdit(param.key_name)} loading={saving}>Save</Button>
                                    </HStack>
                                </Box>
                            ) : (
                                // View mode
                                <Flex justify="space-between" align="center">
                                    <Box flex="1">
                                        <HStack mb={1}>
                                            <Box color="fg.muted" fontSize="sm">{getTypeIcon(param.data_type)}</Box>
                                            <Text fontWeight="bold" fontSize="sm">{param.key_name}</Text>
                                            {!param.is_active && <Badge colorPalette="gray">Inactive</Badge>}
                                        </HStack>
                                        <Text fontSize="md">{param.display_label}</Text>
                                        {param.description && <Text fontSize="xs" color="fg.muted">{param.description}</Text>}
                                        {param.data_type === 'select' && param.options?.values && (
                                            <Text fontSize="xs" color="fg.muted" mt={1}>
                                                Options: {param.options.values.join(', ')}
                                            </Text>
                                        )}
                                    </Box>
                                    <HStack>
                                        <IconButton
                                            aria-label="Edit"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => startEditing(param)}
                                        >
                                            <FaEdit />
                                        </IconButton>
                                        <IconButton
                                            aria-label={param.is_active ? 'Deactivate' : 'Activate'}
                                            size="sm"
                                            colorPalette={param.is_active ? 'red' : 'green'}
                                            variant="ghost"
                                            onClick={() => toggleActive(param)}
                                        >
                                            {param.is_active ? <FaBan /> : <FaCheck />}
                                        </IconButton>
                                    </HStack>
                                </Flex>
                            )}
                        </Box>
                    ))
                )}
            </VStack>
        </Box>
    );
};
