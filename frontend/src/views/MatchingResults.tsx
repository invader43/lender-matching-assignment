/**
 * MatchingResults - Detailed results for a specific application
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Container, Grid, Flex, Heading, Text, Button,
    Spinner, Card, VStack, IconButton, Badge
} from '@chakra-ui/react';
import { FaTimes } from 'react-icons/fa';
import { MatchCard } from '../components/MatchCard';
import { ReasoningList } from '../components/ReasoningList';
import api from '../services/api';
import type { LoanApplication, MatchResult } from '../types/models';

export const MatchingResults: React.FC = () => {
    const { applicationId } = useParams<{ applicationId: string }>();
    const navigate = useNavigate();

    const [application, setApplication] = useState<LoanApplication | null>(null);
    const [matches, setMatches] = useState<MatchResult[]>([]);
    const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (applicationId) {
            loadResults();
        }
    }, [applicationId]);

    const loadResults = async () => {
        if (!applicationId) return;

        try {
            setLoading(true);

            // Load application details
            const app = await api.applications.getById(applicationId);
            setApplication(app);

            // If still processing, poll for results
            if (app.status === 'processing') {
                setTimeout(loadResults, 2000); // Poll every 2 seconds
                return;
            }

            // Load match results
            const matchResults = await api.applications.getMatches(applicationId);
            setMatches(matchResults);

            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load results');
            setLoading(false);
            console.error(err);
        }
    };

    if (loading || application?.status === 'processing') {
        return (
            <Flex justify="center" align="center" h="100vh" direction="column" gap={4}>
                <Spinner size="xl" color="blue.solid" />
                <Heading size="lg">Matching Lenders...</Heading>
                <Text color="fg.muted">This may take a few seconds</Text>
            </Flex>
        );
    }

    if (error) {
        return (
            <Container maxW="container.md" py={10}>
                <Card.Root borderColor="red.solid" borderLeftWidth={4}>
                    <Card.Body>
                        <Heading size="md" color="red.fg" mb={2}>Error Loading Results</Heading>
                        <Text mb={4}>{error}</Text>
                        <Button onClick={() => navigate('/')} variant="outline">
                            Back to Home
                        </Button>
                    </Card.Body>
                </Card.Root>
            </Container>
        );
    }

    if (!application) {
        return (
            <Container maxW="container.md" py={10}>
                <Card.Root>
                    <Card.Body>
                        <Heading size="md" mb={4}>Application Not Found</Heading>
                        <Button onClick={() => navigate('/')}>Back to Home</Button>
                    </Card.Body>
                </Card.Root>
            </Container>
        );
    }

    const eligibleMatches = matches.filter(m => m.eligible);
    const ineligibleMatches = matches.filter(m => !m.eligible);

    return (
        <Container maxW="full" p={5}>
            <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
                <Box>
                    <Heading size="xl" mb={1}>Matching Results</Heading>
                    <Box>
                        <Text as="span" fontWeight="bold" fontSize="lg">{application.applicant_name}</Text>
                        <Text as="span" color="fg.muted" ml={2}>
                            Submitted: {new Date(application.created_at).toLocaleDateString()}
                        </Text>
                    </Box>
                </Box>
                <Button onClick={() => navigate('/')} variant="outline">
                    Submit Another Application
                </Button>
            </Flex>

            {/* Summary Cards */}
            <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap={4} mb={8} maxW="container.sm">
                <Card.Root bg="bg.panel" variant="elevated">
                    <Card.Body textAlign="center">
                        <Text fontSize="4xl" fontWeight="bold" color="green.solid">{eligibleMatches.length}</Text>
                        <Text color="fg.muted">Approved Lenders</Text>
                    </Card.Body>
                </Card.Root>
                <Card.Root bg="bg.panel" variant="elevated">
                    <Card.Body textAlign="center">
                        <Text fontSize="4xl" fontWeight="bold" color="blue.solid">{matches.length}</Text>
                        <Text color="fg.muted">Total Evaluated</Text>
                    </Card.Body>
                </Card.Root>
            </Grid>

            {/* Main Layout */}
            <Grid templateColumns={{ base: "1fr", lg: selectedMatch ? "1fr 400px" : "1fr" }} gap={6} alignItems="start">

                {/* Matches Column */}
                <VStack gap={8} align="stretch" w="full">

                    {eligibleMatches.length > 0 && (
                        <Box>
                            <Heading size="lg" color="green.solid" mb={4}>✓ Approved Lenders</Heading>
                            <Grid templateColumns={{ base: "1fr", md: "repeat(auto-fill, minmax(300px, 1fr))" }} gap={4}>
                                {eligibleMatches.map((match) => (
                                    <MatchCard
                                        key={match.id}
                                        match={match}
                                        onClick={() => setSelectedMatch(match)}
                                    />
                                ))}
                            </Grid>
                        </Box>
                    )}

                    {ineligibleMatches.length > 0 && (
                        <Box>
                            <Heading size="lg" color="red.solid" mb={4}>✗ Declined Lenders</Heading>
                            <Grid templateColumns={{ base: "1fr", md: "repeat(auto-fill, minmax(300px, 1fr))" }} gap={4}>
                                {ineligibleMatches.map((match) => (
                                    <MatchCard
                                        key={match.id}
                                        match={match}
                                        onClick={() => setSelectedMatch(match)}
                                    />
                                ))}
                            </Grid>
                        </Box>
                    )}

                    {matches.length === 0 && (
                        <Card.Root>
                            <Card.Body>
                                <Text textAlign="center" color="fg.muted">No lenders evaluated yet. Please check back later.</Text>
                            </Card.Body>
                        </Card.Root>
                    )}
                </VStack>

                {/* Details Panel */}
                {selectedMatch && (
                    <Card.Root
                        position={{ lg: "sticky" }}
                        top={{ lg: "20px" }}
                        h={{ lg: "calc(100vh - 40px)" }}
                        overflowY="auto"
                        shadow="lg"
                        borderLeftWidth={4}
                        borderLeftColor={selectedMatch.eligible ? "green.solid" : "red.solid"}
                    >
                        <Card.Body>
                            <Flex justify="space-between" align="start" mb={4}>
                                <Box>
                                    <Heading size="md">{selectedMatch.lender_name}</Heading>
                                    <Text color="fg.muted" fontSize="sm">{selectedMatch.program_name}</Text>
                                </Box>
                                <IconButton
                                    aria-label="Close"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedMatch(null)}
                                >
                                    <FaTimes />
                                </IconButton>
                            </Flex>

                            <Flex gap={2} mb={6}>
                                <Badge size="lg" colorPalette={selectedMatch.eligible ? "green" : "red"}>
                                    {selectedMatch.eligible ? "Approved" : "Declined"}
                                </Badge>
                                <Badge size="lg" variant="outline" colorPalette="blue">
                                    Fit Score: {selectedMatch.fit_score}%
                                </Badge>
                            </Flex>

                            <Box>
                                <Heading size="sm" mb={3} borderBottomWidth="1px" pb={2}>Evaluation Details</Heading>
                                <ReasoningList evaluations={selectedMatch.evaluations} />
                            </Box>
                        </Card.Body>
                    </Card.Root>
                )}
            </Grid>
        </Container>
    );
};
