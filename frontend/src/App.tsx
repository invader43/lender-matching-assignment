/**
 * Main App Component with Routing
 */

import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link as RouterLink } from 'react-router-dom';
import { Box, Container, HStack, IconButton, Text, VStack } from '@chakra-ui/react';
import { IoMenu, IoClose } from 'react-icons/io5';
import { ApplicationForm } from './views/ApplicationForm';
import { MatchingResults } from './views/MatchingResults';
import { LenderPolicyManager } from './views/LenderPolicyManager';
// Remove App.css to prevent conflicts
// import './App.css'; 

function App() {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => setMenuOpen(!menuOpen);
    const closeMenu = () => setMenuOpen(false);

    return (
        <BrowserRouter>
            <Box minH="100vh" display="flex" flexDirection="column" bg="bg.canvas">
                <Box as="nav" bg="bg.surface" borderBottomWidth="1px" py={4} shadow="sm">
                    <Container maxW="container.xl" display="flex" justifyContent="space-between" alignItems="center">
                        {/* Logo */}
                        <RouterLink to="/" onClick={closeMenu}>
                            <Text fontSize="xl" fontWeight="bold" bgGradient="to-r" gradientFrom="blue.400" gradientTo="purple.500" bgClip="text" _hover={{ opacity: 0.8 }}>
                                🏦 Lender Matching
                            </Text>
                        </RouterLink>

                        {/* Desktop Nav */}
                        <HStack gap={8} display={{ base: 'none', md: 'flex' }}>
                            <RouterLink to="/">
                                <Text fontWeight="medium" color="fg.muted" _hover={{ color: "fg.default" }}>New Application</Text>
                            </RouterLink>
                            <RouterLink to="/admin">
                                <Text fontWeight="medium" color="fg.muted" _hover={{ color: "fg.default" }}>Admin</Text>
                            </RouterLink>
                        </HStack>

                        {/* Mobile Hamburger */}
                        <IconButton
                            aria-label="Toggle navigation"
                            variant="ghost"
                            color="fg.muted"
                            fontSize="2xl"
                            display={{ base: 'flex', md: 'none' }}
                            onClick={toggleMenu}
                            _hover={{ bg: 'bg.subtle' }}
                        >
                            {menuOpen ? <IoClose /> : <IoMenu />}
                        </IconButton>
                    </Container>

                    {/* Mobile Nav Menu */}
                    {menuOpen && (
                        <Box display={{ base: 'block', md: 'none' }} bg="bg.surface" borderTopWidth="1px" pb={4} position="absolute" top="60px" left={0} right={0} zIndex={100} shadow="md">
                            <VStack gap={0} align="stretch">
                                <RouterLink to="/" onClick={closeMenu}>
                                    <Box py={3} px={6} _hover={{ bg: 'bg.subtle' }} color="fg.default">
                                        New Application
                                    </Box>
                                </RouterLink>
                                <RouterLink to="/admin" onClick={closeMenu}>
                                    <Box py={3} px={6} _hover={{ bg: 'bg.subtle' }} color="fg.default">
                                        Admin
                                    </Box>
                                </RouterLink>
                            </VStack>
                        </Box>
                    )}
                </Box>

                <Box as="main" flex="1" py={8}>
                    <Routes>
                        <Route path="/" element={<ApplicationForm />} />
                        <Route path="/results/:applicationId" element={<MatchingResults />} />
                        <Route path="/admin" element={<LenderPolicyManager />} />
                    </Routes>
                </Box>

                <Box as="footer" py={6} textAlign="center" color="fg.muted" borderTopWidth="1px" bg="bg.surface">
                    {/* <Text fontSize="sm">Dynamic Lender Matching System - Powered by AI</Text> */}
                </Box>
            </Box>
        </BrowserRouter>
    );
}

export default App;
