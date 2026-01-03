/**
 * ApplicationForm - Dynamic loan application form
 */



import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Container, Heading, Text, Input, Button, VStack,
    Card, Flex, Spinner
} from '@chakra-ui/react';
import { DynamicFieldRenderer } from '../components/DynamicFieldRenderer';
import api from '../services/api';
import type { ParameterDefinition } from '../types/models';

export const ApplicationForm: React.FC = () => {
    const navigate = useNavigate();
    const [parameters, setParameters] = useState<ParameterDefinition[]>([]);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [applicantName, setApplicantName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadParameters();
    }, []);

    const loadParameters = async () => {
        try {
            const params = await api.parameters.getAll();
            setParameters(params);
        } catch (err) {
            setError('Failed to load form fields. Please try again.');
            console.error(err);
        }
    };

    const handleFieldChange = (key: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!applicantName.trim()) {
            setError('Please enter applicant name');
            setLoading(false);
            return;
        }

        try {
            const application = await api.applications.create({
                applicant_name: applicantName,
                form_data: formData
            });

            setSuccess(true);

            // Navigate to results page after 1 second
            setTimeout(() => {
                navigate(`/results/${application.id}`);
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to submit application. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Container maxW="container.md" py={10}>
                <Card.Root p={8} textAlign="center" borderLeftWidth={4} borderColor="green.solid">
                    <Card.Body>
                        <Heading size="xl" color="green.fg" mb={4}>✓ Application Submitted!</Heading>
                        <Text color="fg.muted">Matching lenders... Redirecting to results...</Text>
                        <Flex justify="center" mt={6}>
                            <Spinner size="lg" color="green.solid" />
                        </Flex>
                    </Card.Body>
                </Card.Root>
            </Container>
        );
    }

    return (
        <Container maxW="container.md" py={10}>
            <VStack gap={2} align="start" mb={8}>
                <Heading size="2xl">Loan Application</Heading>
                <Text fontSize="lg" color="fg.muted">Fill out the form below to find matching lenders</Text>
            </VStack>

            <Card.Root shadow="md">
                <Card.Body>
                    <form onSubmit={handleSubmit}>
                        <VStack gap={6} align="stretch">
                            <Box>
                                <Text fontWeight="bold" mb={2}>Applicant Name *</Text>
                                <Input
                                    value={applicantName}
                                    onChange={(e) => setApplicantName(e.target.value)}
                                    placeholder="Enter your name"
                                    required
                                    size="lg"
                                />
                            </Box>

                            <Box h="1px" bg="border.muted" my={2} />

                            {parameters.length === 0 ? (
                                <Flex justify="center" p={4}>
                                    <Spinner color="blue.solid" mr={3} />
                                    <Text>Loading form fields...</Text>
                                </Flex>
                            ) : (
                                parameters.map((param) => (
                                    <DynamicFieldRenderer
                                        key={param.id}
                                        parameter={param}
                                        value={formData[param.key_name]}
                                        onChange={(value) => handleFieldChange(param.key_name, value)}
                                    />
                                ))
                            )}

                            {error && (
                                <Box bg="red.subtle" color="red.fg" p={3} borderRadius="md">
                                    {error}
                                </Box>
                            )}

                            <Button
                                type="submit"
                                size="lg"
                                colorPalette="blue"
                                loading={loading}
                                loadingText="Submitting..."
                                mt={4}
                                disabled={parameters.length === 0}
                            >
                                Submit Application
                            </Button>
                        </VStack>
                    </form>
                </Card.Body>
            </Card.Root>
        </Container>
    );
};
