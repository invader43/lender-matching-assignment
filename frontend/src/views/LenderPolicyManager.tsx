/**
 * LenderPolicyManager - Admin view for PDF upload and rule management
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Grid, Flex, Heading, Text, Button, Input,
    VStack, HStack, Badge, Card, Spinner, Alert,
    Container
} from '@chakra-ui/react';
import { FaPlus, FaUpload, FaEdit, FaFilePdf, FaRobot } from 'react-icons/fa';
import api from '../services/api';
import { PolicyRuleEditor } from '../components/PolicyRuleEditor';
import { RuleBuilder } from '../components/RuleBuilder';
import { ParameterManager } from '../components/ParameterManager';
import type { Lender, LenderPolicy, PolicyRule, ParameterDefinition } from '../types/models';

export const LenderPolicyManager: React.FC = () => {
    const [lenders, setLenders] = useState<Lender[]>([]);
    const [selectedLender, setSelectedLender] = useState<Lender | null>(null);
    const [policies, setPolicies] = useState<LenderPolicy[]>([]);
    const [parameters, setParameters] = useState<ParameterDefinition[]>([]);
    const [newLenderName, setNewLenderName] = useState('');
    const [newLenderDesc, setNewLenderDesc] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Notification state
    const [notification, setNotification] = useState<{ title: string, status: 'success' | 'error' | 'info' } | null>(null);

    // Editing state
    const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
    const [editedRules, setEditedRules] = useState<PolicyRule[]>([]);
    const [saving, setSaving] = useState(false);

    // Parameter manager visibility
    const [showParamManager, setShowParamManager] = useState(false);

    useEffect(() => {
        loadLenders();
        loadParameters();
    }, []);

    useEffect(() => {
        if (selectedLender) {
            loadPolicies(selectedLender.id);
        }
    }, [selectedLender]);

    // Clear notification after 5s
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Polling for ingestion status
    useEffect(() => {
        let interval: any;
        if (selectedLender?.ingestion_status === 'processing') {
            interval = setInterval(async () => {
                try {
                    const updatedLender = await api.lenders.getById(selectedLender.id);

                    // Update lenders list
                    setLenders(prev => prev.map(l => l.id === updatedLender.id ? updatedLender : l));

                    if (selectedLender.id === updatedLender.id) {
                        // Only update selected if it's the same lender

                        if (updatedLender.ingestion_status !== selectedLender.ingestion_status) {
                            setSelectedLender(updatedLender);

                            if (updatedLender.ingestion_status === 'completed') {
                                loadPolicies(updatedLender.id);
                                setNotification({ title: "Processing Complete: Rules extracted.", status: 'success' });
                            } else if (updatedLender.ingestion_status === 'failed') {
                                setNotification({ title: `Processing Failed: ${updatedLender.ingestion_error}`, status: 'error' });
                            }
                        }
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [selectedLender]);

    const loadLenders = async () => {
        try {
            const data = await api.lenders.getAll();
            setLenders(data);
        } catch (err) {
            console.error('Failed to load lenders:', err);
            setNotification({ title: 'Failed to load lenders', status: 'error' });
        }
    };

    const loadParameters = async () => {
        try {
            const data = await api.parameters.getAll(false); // Get all parameters
            setParameters(data);
        } catch (err) {
            console.error('Failed to load parameters:', err);
        }
    };

    const loadPolicies = async (lenderId: string) => {
        try {
            const data = await api.lenders.getPolicies(lenderId);
            setPolicies(data);
        } catch (err) {
            console.error('Failed to load policies:', err);
        }
    };

    const handleCreateLender = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLenderName.trim()) return;

        try {
            const lender = await api.lenders.create({
                name: newLenderName,
                description: newLenderDesc
            });
            setLenders([...lenders, lender]);
            setNewLenderName('');
            setNewLenderDesc('');
            setSelectedLender(lender);
            setNotification({ title: 'Lender created', status: 'success' });
        } catch (err: any) {
            setNotification({ title: err.response?.data?.detail || 'Error creating lender', status: 'error' });
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedLender) return;

        if (!file.name.endsWith('.pdf')) {
            setNotification({ title: 'Only PDF files are supported', status: 'error' });
            return;
        }

        setUploading(true);

        try {
            await api.lenders.uploadPDF(selectedLender.id, file);
            setNotification({ title: 'Upload successful. Processing...', status: 'info' });

            // Immediately fetch updated status
            const updated = await api.lenders.getById(selectedLender.id);
            setSelectedLender(updated);
            setLenders(prev => prev.map(l => l.id === updated.id ? updated : l));

        } catch (err: any) {
            console.error(err);
            setNotification({ title: err.response?.data?.detail || 'Failed to upload PDF', status: 'error' });
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Editing handlers
    const startEditing = (policy: LenderPolicy) => {
        setEditingPolicyId(policy.id);
        setEditedRules([...policy.rules]);
    };

    const cancelEditing = () => {
        setEditingPolicyId(null);
        setEditedRules([]);
    };

    const handleRuleChange = (updatedRule: PolicyRule) => {
        setEditedRules(prev =>
            prev.map(r => r.id === updatedRule.id ? updatedRule : r)
        );
    };

    const handleRuleDelete = (ruleId: string) => {
        setEditedRules(prev => prev.filter(r => r.id !== ruleId));
    };

    const handleAddRule = (newRule: Omit<PolicyRule, 'id' | 'policy_id'>) => {
        // Generate a temporary ID for UI purposes
        const tempRule: PolicyRule = {
            ...newRule,
            id: `temp-${Date.now()}`,
            policy_id: editingPolicyId!,
        };
        setEditedRules(prev => [...prev, tempRule]);
    };

    const saveRules = async () => {
        if (!editingPolicyId) return;

        setSaving(true);
        try {
            // Map rules to the format expected by the API (without id and policy_id)
            const rulesToSave = editedRules.map(({ id, policy_id, ...rule }) => rule);
            await api.policies.updateRules(editingPolicyId, rulesToSave);

            setNotification({ title: 'Rules saved successfully', status: 'success' });

            // Refresh policies
            if (selectedLender) {
                await loadPolicies(selectedLender.id);
            }

            setEditingPolicyId(null);
            setEditedRules([]);
        } catch (err: any) {
            setNotification({ title: err.response?.data?.detail || 'Failed to save rules', status: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Container maxW="full" p={5}>
            {notification && (
                <Box mb={4} p={3} borderRadius="md" bg={
                    notification.status === 'success' ? 'green.100' :
                        notification.status === 'error' ? 'red.100' : 'blue.100'
                } color={
                    notification.status === 'success' ? 'green.800' :
                        notification.status === 'error' ? 'red.800' : 'blue.800'
                }>
                    <Text fontWeight="bold">{notification.title}</Text>
                </Box>
            )}

            <Flex justify="space-between" align="center" mb={6}>
                <Box>
                    <Heading size="lg" mb={2}>Lender Policy Manager</Heading>
                    <Text color="gray.600">Upload lender guidelines PDFs and manage extracted rules</Text>
                </Box>
                <Button
                    onClick={() => setShowParamManager(!showParamManager)}
                    colorPalette={showParamManager ? "gray" : "blue"}
                    variant={showParamManager ? "outline" : "solid"}
                >
                    {showParamManager ? 'Hide Parameters' : 'Manage Parameters'}
                </Button>
            </Flex>

            {/* Parameter Manager */}
            {showParamManager && (
                <Box mb={6} borderWidth="1px" borderRadius="lg" overflow="hidden">
                    <ParameterManager onClose={() => setShowParamManager(false)} />
                </Box>
            )}

            <Grid templateColumns={{ base: "1fr", lg: "350px 1fr" }} gap={6} alignItems="start">
                {/* Lender List */}
                <VStack gap={4} align="stretch" as={Box} h="full">
                    <Card.Root variant="outline">
                        <Card.Header pb={2}>
                            <Heading size="md">Lenders</Heading>
                        </Card.Header>
                        <Card.Body>
                            <form onSubmit={handleCreateLender}>
                                <VStack gap={3}>
                                    <Input
                                        placeholder="Lender name"
                                        value={newLenderName}
                                        onChange={(e) => setNewLenderName(e.target.value)}
                                    />
                                    <Input
                                        placeholder="Description (optional)"
                                        value={newLenderDesc}
                                        onChange={(e) => setNewLenderDesc(e.target.value)}
                                    />
                                    <Button type="submit" width="full" size="sm">
                                        <FaPlus /> Add Lender
                                    </Button>
                                </VStack>
                            </form>
                        </Card.Body>
                    </Card.Root>

                    <Card.Root variant="outline" flex="1" overflow="hidden">
                        <Card.Body p={0} overflowY="auto" maxH="calc(100vh - 300px)">
                            <VStack gap={0} align="stretch">
                                {lenders.map((lender) => (
                                    <Box
                                        key={lender.id}
                                        p={4}
                                        cursor="pointer"
                                        bg={selectedLender?.id === lender.id ? 'colorPalette.subtle' : 'transparent'}
                                        _hover={{ bg: selectedLender?.id === lender.id ? 'colorPalette.subtle' : 'bg.subtle' }}
                                        borderLeftWidth={selectedLender?.id === lender.id ? "4px" : "0"}
                                        borderColor="colorPalette.solid"
                                        onClick={() => setSelectedLender(lender)}
                                        transition="all 0.2s"
                                        borderBottomWidth="1px"
                                        borderBottomColor="border.muted"
                                    >
                                        <Flex justify="space-between" align="start">
                                            <Box>
                                                <Text fontWeight="bold">{lender.name}</Text>
                                                {lender.description && <Text fontSize="xs" color="fg.muted" lineClamp={1}>{lender.description}</Text>}
                                            </Box>
                                            {lender.ingestion_status === 'processing' && (
                                                <Spinner size="xs" color="colorPalette.solid" />
                                            )}
                                        </Flex>
                                    </Box>
                                ))}
                                {lenders.length === 0 && (
                                    <Text p={4} color="fg.muted" textAlign="center">No lenders yet.</Text>
                                )}
                            </VStack>
                        </Card.Body>
                    </Card.Root>
                </VStack>

                {/* Policy Manager */}
                <Box>
                    {selectedLender ? (
                        <VStack gap={6} align="stretch">
                            <Card.Root>
                                <Card.Header pb={0}>
                                    <Flex justify="space-between" align="center">
                                        <Heading size="md">{selectedLender.name}</Heading>
                                        <Badge colorPalette={
                                            selectedLender.ingestion_status === 'completed' ? 'green' :
                                                selectedLender.ingestion_status === 'processing' ? 'blue' :
                                                    selectedLender.ingestion_status === 'failed' ? 'red' : 'gray'
                                        }>
                                            Status: {selectedLender.ingestion_status || 'Ready'}
                                        </Badge>
                                    </Flex>
                                </Card.Header>
                                <Card.Body>
                                    {/* Upload Section */}
                                    <Box borderWidth="2px" borderStyle="dashed" borderColor="border.muted" borderRadius="md" p={6} textAlign="center">
                                        <VStack gap={3}>
                                            <Box color="colorPalette.solid" fontSize="3xl"><FaFilePdf /></Box>
                                            <Heading size="sm">Upload Guidelines PDF</Heading>
                                            <Text fontSize="sm" color="fg.muted">Upload a lender's underwriting guidelines PDF. Our AI will extract the rules automatically.</Text>

                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".pdf"
                                                onChange={handleFileUpload}
                                                style={{ display: 'none' }}
                                                id="pdf-upload"
                                            />
                                            <label
                                                htmlFor="pdf-upload"
                                                style={{ display: 'inline-block', cursor: 'pointer' }}
                                            >
                                                <Button
                                                    as="span"
                                                    pointerEvents="none"
                                                    loading={uploading}
                                                    loadingText="Uploading..."
                                                    colorPalette="blue"
                                                    disabled={selectedLender.ingestion_status === 'processing'}
                                                >
                                                    <FaUpload /> Select PDF to Upload
                                                </Button>
                                            </label>

                                            {selectedLender.ingestion_status === 'processing' && (
                                                <Alert.Root status="info" mt={2} borderRadius="md">
                                                    <Alert.Indicator />
                                                    <Box>
                                                        <Alert.Title>Processing PDF...</Alert.Title>
                                                        <Alert.Description fontSize="sm">This may take 10-30 seconds. Status will update automatically.</Alert.Description>
                                                    </Box>
                                                </Alert.Root>
                                            )}

                                            {selectedLender.ingestion_status === 'failed' && (
                                                <Alert.Root status="error" mt={2} borderRadius="md">
                                                    <Alert.Indicator />
                                                    <Box>
                                                        <Alert.Title>Processing Failed</Alert.Title>
                                                        <Alert.Description fontSize="sm">{selectedLender.ingestion_error}</Alert.Description>
                                                    </Box>
                                                </Alert.Root>
                                            )}
                                        </VStack>
                                    </Box>
                                </Card.Body>
                            </Card.Root>

                            {/* Policies List */}
                            <Box>
                                <Heading size="md" mb={4}>Extracted Policies ({policies.length})</Heading>
                                {policies.length === 0 ? (
                                    <Alert.Root status="info">
                                        <Alert.Indicator />
                                        <Alert.Title>No policies found.</Alert.Title>
                                        <Alert.Description>Upload a PDF to get started.</Alert.Description>
                                    </Alert.Root>
                                ) : (
                                    <VStack gap={4} align="stretch">
                                        {policies.map((policy) => (
                                            <Card.Root key={policy.id} variant="outline">
                                                <Card.Header bg="bg.subtle" py={3}>
                                                    <Flex justify="space-between" align="center">
                                                        <Box>
                                                            <Heading size="sm">{policy.name}</Heading>
                                                            <Text fontSize="xs" color="fg.muted">{policy.rules.length} rules defined</Text>
                                                        </Box>
                                                        {editingPolicyId !== policy.id && (
                                                            <Button size="sm" onClick={() => startEditing(policy)}>
                                                                <FaEdit /> Edit Rules
                                                            </Button>
                                                        )}
                                                    </Flex>
                                                </Card.Header>
                                                <Card.Body>
                                                    {editingPolicyId === policy.id ? (
                                                        // Edit mode
                                                        <VStack gap={4} align="stretch">
                                                            <Box>
                                                                {editedRules.length === 0 ? (
                                                                    <Text fontStyle="italic" color="fg.muted">No rules. Add one below.</Text>
                                                                ) : (
                                                                    editedRules.map((rule) => (
                                                                        <Box key={rule.id} mb={2}>
                                                                            <PolicyRuleEditor
                                                                                rule={rule}
                                                                                parameters={parameters}
                                                                                onChange={handleRuleChange}
                                                                                onDelete={handleRuleDelete}
                                                                            />
                                                                        </Box>
                                                                    ))
                                                                )}
                                                            </Box>

                                                            <Box borderTopWidth="1px" pt={4}>
                                                                <RuleBuilder
                                                                    parameters={parameters}
                                                                    onAdd={handleAddRule}
                                                                />
                                                            </Box>

                                                            <HStack justify="flex-end" pt={4} borderTopWidth="1px">
                                                                <Button variant="ghost" onClick={cancelEditing} disabled={saving}>Cancel</Button>
                                                                <Button colorPalette="blue" onClick={saveRules} loading={saving}>Save Changes</Button>
                                                            </HStack>
                                                        </VStack>
                                                    ) : (
                                                        // View Mode usage of rules
                                                        <VStack align="start" gap={1}>
                                                            {policy.rules.slice(0, 3).map((rule) => (
                                                                <HStack key={rule.id} fontSize="sm">
                                                                    <Badge minW="100px">{rule.parameter_key}</Badge>
                                                                    <Text fontWeight="bold" color="colorPalette.solid">{rule.operator}</Text>
                                                                    <Text>{JSON.stringify(rule.value_comparison)}</Text>
                                                                </HStack>
                                                            ))}
                                                            {policy.rules.length > 3 && (
                                                                <Text fontSize="xs" color="fg.muted" pt={1}>...and {policy.rules.length - 3} more rules</Text>
                                                            )}
                                                            {policy.rules.length === 0 && <Text fontSize="sm" color="fg.muted">No rules defined.</Text>}
                                                        </VStack>
                                                    )}
                                                </Card.Body>
                                            </Card.Root>
                                        ))}
                                    </VStack>
                                )}
                            </Box>
                        </VStack>
                    ) : (
                        <Flex direction="column" align="center" justify="center" h="400px" bg="bg.subtle" borderRadius="lg" borderWidth="2px" borderStyle="dashed">
                            <Box fontSize="4xl" color="fg.subtle" mb={4}><FaRobot /></Box>
                            <Heading size="md" color="fg.subtle">Select a Lender</Heading>
                            <Text color="fg.muted">Choose a lender to manage their policies.</Text>
                        </Flex>
                    )}
                </Box>
            </Grid>
        </Container>
    );
};
