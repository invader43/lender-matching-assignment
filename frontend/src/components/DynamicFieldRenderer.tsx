import React from 'react';
import { Box, Text, Input, chakra, Flex } from '@chakra-ui/react';
import type { ParameterDefinition } from '../types/models';

interface DynamicFieldRendererProps {
    parameter: ParameterDefinition;
    value: any;
    onChange: (value: any) => void;
    error?: string;
}

export const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
    parameter,
    value,
    onChange,
    error
}) => {
    const { key_name, display_label, data_type, options, description } = parameter;

    const renderInput = () => {
        switch (data_type) {
            case 'string':
                return (
                    <Input
                        id={key_name}
                        name={key_name}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={description}
                        bg="bg.surface"
                    />
                );

            case 'number':
            case 'currency':
                return (
                    <Input
                        type="number"
                        id={key_name}
                        name={key_name}
                        value={value || ''}
                        onChange={(e) => onChange(parseFloat(e.target.value))}
                        placeholder={description}
                        step={data_type === 'currency' ? '0.01' : 'any'}
                        bg="bg.surface"
                    />
                );

            case 'boolean':
                return (
                    <Flex align="center" gap={2}>
                        <chakra.input
                            type="checkbox"
                            id={key_name}
                            name={key_name}
                            checked={value || false}
                            onChange={(e: any) => onChange(e.target.checked)}
                            w={4} h={4}
                            accentColor="blue.500"
                        />
                        <label htmlFor={key_name} style={{ cursor: 'pointer' }}>
                            {description || 'Yes'}
                        </label>
                    </Flex>
                );

            case 'select':
                const selectOptions = options?.values || [];
                return (
                    <chakra.select
                        id={key_name}
                        name={key_name}
                        value={value || ''}
                        onChange={(e: any) => onChange(e.target.value)}
                        w="full"
                        p={2}
                        borderWidth="1px"
                        borderRadius="md"
                        borderColor="border.muted"
                        bg="bg.surface"
                    >
                        <option value="">-- Select --</option>
                        {selectOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </chakra.select>
                );

            default:
                return (
                    <Input
                        id={key_name}
                        name={key_name}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        bg="bg.surface"
                    />
                );
        }
    };

    return (
        <Box mb={4}>
            <label htmlFor={key_name} style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                {display_label}
            </label>
            {description && data_type !== 'boolean' && (
                <Text fontSize="xs" color="fg.muted" mb={2}>{description}</Text>
            )}

            {renderInput()}

            {error && <Text color="red.fg" fontSize="sm" mt={1}>{error}</Text>}
        </Box>
    );
};
