import React from 'react';
import {
    Box, Grid, Input, Flex, IconButton,
    chakra
} from '@chakra-ui/react';
import { FaTrash } from 'react-icons/fa';
import type { PolicyRule, ParameterDefinition, RuleOperator, RuleType } from '../types/models';

interface Props {
    rule: PolicyRule;
    parameters: ParameterDefinition[];
    onChange: (updatedRule: PolicyRule) => void;
    onDelete: (ruleId: string) => void;
}

const OPERATORS: { value: RuleOperator; label: string }[] = [
    { value: 'gt', label: '> Greater than' },
    { value: 'gte', label: '>= Greater or equal' },
    { value: 'lt', label: '< Less than' },
    { value: 'lte', label: '<= Less or equal' },
    { value: 'eq', label: '= Equal to' },
    { value: 'neq', label: '≠ Not equal' },
    { value: 'in', label: '∈ In list' },
    { value: 'contains', label: '⊃ Contains' },
];

const RULE_TYPES: { value: RuleType; label: string }[] = [
    { value: 'eligibility', label: 'Eligibility (knockout)' },
    { value: 'scoring', label: 'Scoring (points)' },
];

export const PolicyRuleEditor: React.FC<Props> = ({
    rule,
    parameters,
    onChange,
    onDelete,
}) => {
    const selectedParam = parameters.find(p => p.key_name === rule.parameter_key);

    const handleChange = (field: keyof PolicyRule, value: any) => {
        onChange({ ...rule, [field]: value });
    };

    const renderValueInput = () => {
        if (!selectedParam) {
            return (
                <Input
                    value={JSON.stringify(rule.value_comparison) || ''}
                    onChange={(e) => handleChange('value_comparison', e.target.value)}
                    placeholder="Value"
                />
            );
        }

        switch (selectedParam.data_type) {
            case 'number':
            case 'currency':
                return (
                    <Input
                        type="number"
                        value={rule.value_comparison ?? ''}
                        onChange={(e) => handleChange('value_comparison', parseFloat(e.target.value) || 0)}
                        placeholder="Numeric value"
                    />
                );
            case 'boolean':
                return (
                    <chakra.select
                        value={String(rule.value_comparison)}
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
                        value={rule.value_comparison ?? ''}
                        onChange={(e) => handleChange('value_comparison', e.target.value)}
                        width="full"
                        p={2}
                        borderRadius="md"
                        borderColor="border.muted"
                        borderWidth="1px"
                        bg="bg.panel"
                        _dark={{ bg: "gray.800" }}
                    >
                        <option value="">Select value...</option>
                        {selectedParam.options?.values?.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </chakra.select>
                );
            default:
                return (
                    <Input
                        value={rule.value_comparison ?? ''}
                        onChange={(e) => handleChange('value_comparison', e.target.value)}
                        placeholder="Text value"
                    />
                );
        }
    };

    return (
        <Box borderWidth="1px" borderRadius="md" p={4} bg="bg.panel" position="relative" mt={4}>
            <Grid templateColumns={{ base: "1fr", md: "1.5fr 1fr 1fr 1fr 40px" }} gap={4} alignItems="end" mb={4}>
                {/* Parameter selector */}
                <Box>
                    <Box as="label" fontSize="sm" fontWeight="medium" mb={1} display="block">Parameter</Box>
                    <chakra.select
                        value={rule.parameter_key}
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

                {/* Operator selector */}
                <Box>
                    <Box as="label" fontSize="sm" fontWeight="medium" mb={1} display="block">Operator</Box>
                    <chakra.select
                        value={rule.operator}
                        onChange={(e) => handleChange('operator', e.target.value as RuleOperator)}
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

                {/* Value input */}
                <Box>
                    <Box as="label" fontSize="sm" fontWeight="medium" mb={1} display="block">Value</Box>
                    {renderValueInput()}
                </Box>

                {/* Rule type */}
                <Box>
                    <Box as="label" fontSize="sm" fontWeight="medium" mb={1} display="block">Type</Box>
                    <chakra.select
                        value={rule.rule_type}
                        onChange={(e) => handleChange('rule_type', e.target.value as RuleType)}
                        width="full"
                        p={2}
                        borderRadius="md"
                        borderColor="border.muted"
                        borderWidth="1px"
                        bg="bg.panel"
                        _dark={{ bg: "gray.800" }}
                    >
                        {RULE_TYPES.map((rt) => (
                            <option key={rt.value} value={rt.value}>{rt.label}</option>
                        ))}
                    </chakra.select>
                </Box>

                {/* Delete button */}
                <IconButton
                    aria-label="Delete rule"
                    colorPalette="red"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(rule.id)}
                >
                    <FaTrash />
                </IconButton>
            </Grid>

            {/* Failure reason */}
            <Box>
                <Box as="label" fontSize="sm" fontWeight="medium" mb={1} display="block">Failure Reason</Box>
                <Input
                    value={rule.failure_reason ?? ''}
                    onChange={(e) => handleChange('failure_reason', e.target.value)}
                    placeholder="Message shown when rule fails (e.g., 'Credit score below minimum 650')"
                />
            </Box>
        </Box>
    );
};
