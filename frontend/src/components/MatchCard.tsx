import React from 'react';
import { Box, Card, Badge, Text, Flex } from '@chakra-ui/react';
import type { MatchResult } from '../types/models';

interface MatchCardProps {
    match: MatchResult;
    onClick: () => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onClick }) => {
    const { lender_name, program_name, eligible, fit_score } = match;

    const strokeDasharray = `${fit_score * 2.827} 282.7`;

    return (
        <Card.Root
            variant="outline"
            cursor="pointer"
            onClick={onClick}
            _hover={{ borderColor: 'blue.solid', shadow: 'sm' }}
            transition="all 0.2s"
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
            tabIndex={0}
            borderLeftWidth={4}
            borderLeftColor={eligible ? 'green.solid' : 'red.solid'}
        >
            <Card.Body p={4}>
                <Flex justify="space-between" align="start" mb={2}>
                    <Box>
                        <Text fontWeight="bold" fontSize="lg" lineClamp={1}>{lender_name}</Text>
                        <Badge colorPalette={eligible ? 'green' : 'red'}>
                            {eligible ? 'Approved' : 'Declined'}
                        </Badge>
                    </Box>
                    <Box textAlign="center" position="relative" w="50px" h="50px">
                        <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="var(--chakra-colors-border-muted)"
                                strokeWidth="8"
                            />
                            <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke={eligible ? 'var(--chakra-colors-green-solid)' : 'var(--chakra-colors-red-solid)'}
                                strokeWidth="8"
                                strokeDasharray={strokeDasharray}
                                strokeLinecap="round"
                            />
                        </svg>
                        <Box position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)">
                            <Text fontSize="xs" fontWeight="bold">{fit_score}%</Text>
                        </Box>
                    </Box>
                </Flex>

                <Text fontSize="sm" color="fg.muted" lineClamp={1} mb={3}>
                    {program_name}
                </Text>

                <Text fontSize="xs" color="blue.fg" textAlign="right">
                    View Details →
                </Text>
            </Card.Body>
        </Card.Root>
    );
};
