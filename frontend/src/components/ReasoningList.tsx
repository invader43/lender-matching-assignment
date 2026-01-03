import React from 'react';
import { Box, List, Heading, Flex, Text, Icon } from '@chakra-ui/react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import type { RuleEvaluationResult } from '../types/models';

interface ReasoningListProps {
    evaluations: RuleEvaluationResult[];
}

export const ReasoningList: React.FC<ReasoningListProps> = ({ evaluations }) => {
    const passedRules = evaluations.filter(e => e.passed);
    const failedRules = evaluations.filter(e => !e.passed);

    const formatValue = (value: any): string => {
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'number') return value.toLocaleString();
        if (Array.isArray(value)) return value.join(', ');
        return String(value);
    };

    const getOperatorSymbol = (operator: string): string => {
        const symbols: Record<string, string> = {
            'gt': '>',
            'lt': '<',
            'gte': '≥',
            'lte': '≤',
            'eq': '=',
            'neq': '≠',
            'in': 'in',
            'contains': 'contains'
        };
        return symbols[operator] || operator;
    };

    return (
        <Box>
            {passedRules.length > 0 && (
                <Box mb={6}>
                    <Flex align="center" gap={2} mb={3} color="green.solid">
                        <Icon as={FaCheck} />
                        <Heading size="sm">Criteria Met ({passedRules.length})</Heading>
                    </Flex>
                    <List.Root gap={2} variant="plain">
                        {passedRules.map((evaluation) => (
                            <List.Item key={evaluation.rule_id}>
                                <Flex gap={2} align="start">
                                    <List.Indicator asChild color="green.solid">
                                        <FaCheck />
                                    </List.Indicator>
                                    <Box fontSize="sm">
                                        <Text as="span" fontWeight="bold">{evaluation.parameter_label}:</Text>{' '}
                                        {formatValue(evaluation.actual_value)}{' '}
                                        {getOperatorSymbol(evaluation.operator)}{' '}
                                        {formatValue(evaluation.threshold_value)}
                                    </Box>
                                </Flex>
                            </List.Item>
                        ))}
                    </List.Root>
                </Box>
            )}

            {failedRules.length > 0 && (
                <Box mb={4}>
                    <Flex align="center" gap={2} mb={3} color="red.solid">
                        <Icon as={FaTimes} />
                        <Heading size="sm">Criteria Failed ({failedRules.length})</Heading>
                    </Flex>
                    <List.Root gap={2} variant="plain">
                        {failedRules.map((evaluation) => (
                            <List.Item key={evaluation.rule_id}>
                                <Flex gap={2} align="start">
                                    <List.Indicator asChild color="red.solid">
                                        <FaTimes />
                                    </List.Indicator>
                                    <Box fontSize="sm">
                                        <Text as="span" fontWeight="bold">{evaluation.parameter_label}:</Text>{' '}
                                        {evaluation.failure_reason || (
                                            <>
                                                {formatValue(evaluation.actual_value)}{' '}
                                                {getOperatorSymbol(evaluation.operator)}{' '}
                                                {formatValue(evaluation.threshold_value)}
                                            </>
                                        )}
                                    </Box>
                                </Flex>
                            </List.Item>
                        ))}
                    </List.Root>
                </Box>
            )}

            {evaluations.length === 0 && (
                <Text color="fg.muted" fontStyle="italic">
                    No evaluation criteria available
                </Text>
            )}
        </Box>
    );
};
