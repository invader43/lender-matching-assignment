import React, { useState } from 'react';
import {
    Box, Grid, Input, Flex, Button, Heading, IconButton,
    chakra
} from '@chakra-ui/react';
import { FaPlus, FaTimes } from 'react-icons/fa';
import type { PolicyRule, ParameterDefinition, RuleOperator, RuleType } from '../types/models';

interface Props {
    parameters: ParameterDefinition[];
    onAdd: (rule: Omit<PolicyRule, 'id' | 'policy_id'>) => void;
}

const DEFAULT_RULE: Omit<PolicyRule, 'id' | 'policy_id'> = {
    parameter_key: '',
    operator: 'gte' as RuleOperator,
    value_comparison: '',
    rule_type: 'eligibility' as RuleType,
    weight: 0,
    failure_reason: '',
};

const OPERATORS: { value: RuleOperator; label: string }[] = [
    { value: 'gt', label: '>' },
    { value: 'gte', label: '>=' },
    { value: 'lt', label: '<' },
    { value: 'lte', label: '<=' },
    { value: 'eq', label: '=' },
    { value: 'neq', label: '≠' },
    { value: 'in', label: 'in' },
    { value: 'contains', label: 'contains' },
];

export const RuleBuilder: React.FC<Props> = ({ parameters, onAdd }) => {
    const [newRule, setNewRule] = useState(DEFAULT_RULE);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleChange = (field: string, value: any) => {
        setNewRule(prev => ({ ...prev, [field]: value }));
    };

    const handleAdd = () => {
        if (!newRule.parameter_key) {
            return; // Don't add invalid rules
        }
        onAdd(newRule);
        setNewRule(DEFAULT_RULE);
        setIsExpanded(false);
    };

    const selectedParam = parameters.find(p => p.key_name === newRule.parameter_key);

    const renderValueInput = () => {
        if (!selectedParam) {
            return <Input placeholder="Select parameter first" disabled />;
        }

        switch (selectedParam.data_type) {
            case 'number':
            case 'currency':
                return (
                    <Input
                        type="number"
                        value={newRule.value_comparison ?? ''}
                        onChange={(e) => handleChange('value_comparison', parseFloat(e.target.value) || 0)}
                        placeholder="Value"
                    />
                );
            case 'boolean':
                return (
                    <chakra.select
                        value={String(newRule.value_comparison)}
                        onChange={(e) => handleChange('value_comparison', e.target.value === 'true')}
                        width="full"
                        p={2}
                        borderRadius="md"
                        borderColor="border.muted"
                        borderWidth="1px"
                        bg="bg.panel"
                        _dark={{ bg: "gray.800" }}
                    >
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </chakra.select>
                );
            case 'select':
                return (
                    <chakra.select
                        value={newRule.value_comparison ?? ''}
                        onChange={(e) => handleChange('value_comparison', e.target.value)}
                        width="full"
                        p={2}
                        borderRadius="md"
                        borderColor="border.muted"
                        borderWidth="1px"
                        bg="bg.panel"
                        _dark={{ bg: "gray.800" }}
                    >
                        <option value="">Select...</option>
                        {selectedParam.options?.values?.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </chakra.select>
                );
            default:
                return (
                    <Input
                        value={newRule.value_comparison ?? ''}
                        onChange={(e) => handleChange('value_comparison', e.target.value)}
                        placeholder="Value"
                    />
                );
        }
    };

    if (!isExpanded) {
        return (
            <Button
                onClick={() => setIsExpanded(true)}
                width="full"
                borderStyle="dashed"
                variant="outline"
                colorPalette="blue"
            >
                <FaPlus /> Add New Rule
            </Button>
        );
    }

    return (
        <Box borderWidth="1px" borderRadius="lg" p={5} bg="bg.panel" shadow="sm" mt={4}>
            <Flex justify="space-between" align="center" mb={4}>
                <Heading size="sm">Add New Rule</Heading>
                <IconButton
                    aria-label="Close"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                >
                    <FaTimes />
                </IconButton>
            </Flex>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr 1fr" }} gap={4} mb={4}>
                <Box>
                    <Box as="label" fontSize="sm" fontWeight="medium" mb={1} display="block">Parameter</Box>
                    <chakra.select
                        value={newRule.parameter_key}
                        onChange={(e) => handleChange('parameter_key', e.target.value)}
                        width="full"
                        p={2}
                        borderRadius="md"
                        borderColor="border.muted"
                        borderWidth="1px"
                        bg="bg.panel"
                        _dark={{ bg: "gray.800" }}
                    >
                        <option value="">Select parameter...</option>
                        {parameters.map((param) => (
                            <option key={param.key_name} value={param.key_name}>
                                {param.display_label}
                            </option>
                        ))}
                    </chakra.select>
                </Box>

                <Box>
                    <Box as="label" fontSize="sm" fontWeight="medium" mb={1} display="block">Operator</Box>
                    <chakra.select
                        value={newRule.operator}
                        onChange={(e) => handleChange('operator', e.target.value)}
                        width="full"
                        p={2}
                        borderRadius="md"
                        borderColor="border.muted"
                        borderWidth="1px"
                        bg="bg.panel"
                        _dark={{ bg: "gray.800" }}
                    >
                        {OPERATORS.map((op) => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                    </chakra.select>
                </Box>

                <Box>
                    <Box as="label" fontSize="sm" fontWeight="medium" mb={1} display="block">Value</Box>
                    {renderValueInput()}
                </Box>

                <Box>
                    <Box as="label" fontSize="sm" fontWeight="medium" mb={1} display="block">Type</Box>
                    <chakra.select
                        value={newRule.rule_type}
                        onChange={(e) => handleChange('rule_type', e.target.value)}
                        width="full"
                        p={2}
                        borderRadius="md"
                        borderColor="border.muted"
                        borderWidth="1px"
                        bg="bg.panel"
                        _dark={{ bg: "gray.800" }}
                    >
                        <option value="eligibility">Eligibility</option>
                        <option value="scoring">Scoring</option>
                    </chakra.select>
                </Box>
            </Grid>

            <Box mb={6}>
                <Box as="label" fontSize="sm" fontWeight="medium" mb={1} display="block">Failure Reason</Box>
                <Input
                    value={newRule.failure_reason ?? ''}
                    onChange={(e) => handleChange('failure_reason', e.target.value)}
                    placeholder="Message when rule fails"
                />
            </Box>

            <Flex justify="flex-end" gap={3}>
                <Button
                    variant="ghost"
                    onClick={() => setIsExpanded(false)}
                    size="sm"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleAdd}
                    disabled={!newRule.parameter_key}
                    colorPalette="blue"
                    size="sm"
                >
                    Add Rule
                </Button>
            </Flex>
        </Box>
    );
};
