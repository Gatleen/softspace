import { useState } from "react";
import {
  Box, VStack, HStack, Text, Input, Button, Image,
} from "@chakra-ui/react";
import { ArrowRight, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Props {
  onSuccess: () => void;
  onGuest: () => void;
}

const SignInPage = ({ onSuccess, onGuest }: Props) => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async () => {
    setError("");
    setSuccessMsg("");
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: displayName.trim() || email.split("@")[0] } },
        });
        if (error) throw error;
        setSuccessMsg("Account created! Check your email to verify, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    bg: "whiteAlpha.200" as const,
    border: "1.5px solid" as const,
    borderColor: "whiteAlpha.400" as const,
    borderRadius: "xl" as const,
    color: "white" as const,
    _placeholder: { color: "whiteAlpha.600" },
    _focus: { borderColor: "whiteAlpha.700", boxShadow: "0 0 0 2px rgba(255,255,255,0.15)" },
  };

  return (
    <Box
      minH="100dvh"
      w="100vw"
      bg="linear-gradient(135deg, #ABA7E3 0%, #A677CA 50%, #4525A2 100%)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
      position="relative"
      overflow="hidden"
    >
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
        @keyframes float-med {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(-3deg); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      `}</style>

      {/* Decorative background blobs */}
      <Box position="absolute" top="-100px" left="-100px" w="400px" h="400px"
        borderRadius="full" bg="whiteAlpha.100"
        style={{ animation: "glow-pulse 6s ease-in-out infinite" }} />
      <Box position="absolute" bottom="-80px" right="-80px" w="300px" h="300px"
        borderRadius="full" bg="whiteAlpha.100"
        style={{ animation: "glow-pulse 8s ease-in-out infinite 2s" }} />
      <Box position="absolute" top="30%" right="5%" w="80px" h="80px"
        borderRadius="full" bg="whiteAlpha.150"
        style={{ animation: "float-slow 7s ease-in-out infinite" }} />

      <Box
        display={{ base: "flex", lg: "grid" }}
        gridTemplateColumns={{ lg: "1fr 1fr" }}
        flexDirection={{ base: "column" }}
        w="100%" maxW="900px"
        bg="whiteAlpha.150"
        backdropFilter="blur(20px)"
        borderRadius="3xl"
        border="1.5px solid"
        borderColor="whiteAlpha.300"
        boxShadow="0 25px 80px rgba(0,0,0,0.3)"
        overflow="hidden"
      >
        {/* Left panel — branding */}
        <Box
          display={{ base: "none", lg: "flex" }}
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          p={12}
          bg="whiteAlpha.100"
          borderRight="1.5px solid"
          borderColor="whiteAlpha.200"
          position="relative"
          gap={6}
        >
          <Box style={{ animation: "float-med 5s ease-in-out infinite" }}>
            <Image src="/Llama1.png" alt="SoftSpace Mascot" w="180px" h="auto"
              filter="drop-shadow(0 10px 30px rgba(0,0,0,0.3))" />
          </Box>
          <VStack gap={2} textAlign="center">
            <Text fontSize="4xl" fontWeight="black" color="white"
              textShadow="0 4px 12px rgba(0,0,0,0.2)" lineHeight="1.1">
              SoftSpace
            </Text>
            <Text color="whiteAlpha.800" fontSize="md" fontWeight="medium"
              letterSpacing="widest" textTransform="uppercase">
              Your Digital Sanctuary
            </Text>
          </VStack>
          <Box px={8} py={4} bg="whiteAlpha.100" borderRadius="2xl"
            border="1px solid" borderColor="whiteAlpha.200" textAlign="center">
            <Text color="whiteAlpha.800" fontSize="sm" fontStyle="italic">
              "A calm space to focus, reflect, and grow — one task at a time."
            </Text>
          </Box>
        </Box>

        {/* Right panel — form */}
        <Box p={{ base: 8, lg: 12 }} display="flex" flexDirection="column" justifyContent="center">
          {/* Mobile branding */}
          <Box display={{ base: "flex", lg: "none" }} justifyContent="center" mb={6}>
            <VStack gap={1} textAlign="center">
              <Image src="/Llama1.png" alt="SoftSpace" w="80px" />
              <Text fontSize="2xl" fontWeight="black" color="white">SoftSpace</Text>
            </VStack>
          </Box>

          {/* Mode tabs */}
          <HStack
            bg="whiteAlpha.200"
            p={1} borderRadius="full" mb={8}
            border="1px solid" borderColor="whiteAlpha.300"
          >
            {(["signin", "signup"] as const).map((m) => (
              <Button key={m} flex={1} size="sm" borderRadius="full"
                bg={mode === m ? "white" : "transparent"}
                color={mode === m ? "#4525A2" : "whiteAlpha.800"}
                fontWeight="800" fontSize="sm"
                _hover={{ bg: mode === m ? "white" : "whiteAlpha.200" }}
                onClick={() => { setMode(m); setError(""); setSuccessMsg(""); }}>
                {m === "signin" ? "Sign In" : "Sign Up"}
              </Button>
            ))}
          </HStack>

          <VStack gap={4} align="stretch">
            <Text fontSize="2xl" fontWeight="900" color="white" mb={1}>
              {mode === "signin" ? "Welcome back ✨" : "Join SoftSpace 🌸"}
            </Text>
            <Text color="whiteAlpha.700" fontSize="sm" fontWeight="500" mb={2}>
              {mode === "signin"
                ? "Sign in to continue your journey"
                : "Create your account to get started"}
            </Text>

            {mode === "signup" && (
              <Box>
                <Text color="whiteAlpha.700" fontSize="xs" fontWeight="800"
                  letterSpacing="wider" mb={1.5}>DISPLAY NAME</Text>
                <Box position="relative">
                  <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1}>
                    <User size={16} color="rgba(255,255,255,0.5)" />
                  </Box>
                  <Input pl={10} placeholder="Your name or nickname"
                    value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                    {...inputStyle} />
                </Box>
              </Box>
            )}

            <Box>
              <Text color="whiteAlpha.700" fontSize="xs" fontWeight="800"
                letterSpacing="wider" mb={1.5}>EMAIL</Text>
              <Box position="relative">
                <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1}>
                  <Mail size={16} color="rgba(255,255,255,0.5)" />
                </Box>
                <Input pl={10} type="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  {...inputStyle} />
              </Box>
            </Box>

            <Box>
              <Text color="whiteAlpha.700" fontSize="xs" fontWeight="800"
                letterSpacing="wider" mb={1.5}>PASSWORD</Text>
              <Box position="relative">
                <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1}>
                  <Lock size={16} color="rgba(255,255,255,0.5)" />
                </Box>
                <Input pl={10} pr={10} type={showPassword ? "text" : "password"}
                  placeholder={mode === "signup" ? "Min. 6 characters" : "Your password"}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  {...inputStyle} />
                <Box position="absolute" right={3} top="50%" transform="translateY(-50%)"
                  cursor="pointer" onClick={() => setShowPassword(!showPassword)} zIndex={1}>
                  {showPassword
                    ? <EyeOff size={16} color="rgba(255,255,255,0.5)" />
                    : <Eye size={16} color="rgba(255,255,255,0.5)" />}
                </Box>
              </Box>
            </Box>

            {error && (
              <Box px={4} py={3} bg="rgba(239,68,68,0.25)"
                borderRadius="xl" border="1px solid rgba(239,68,68,0.4)">
                <Text color="red.200" fontSize="sm" fontWeight="700">⚠️ {error}</Text>
              </Box>
            )}
            {successMsg && (
              <Box px={4} py={3} bg="rgba(34,197,94,0.2)"
                borderRadius="xl" border="1px solid rgba(34,197,94,0.3)">
                <Text color="green.200" fontSize="sm" fontWeight="700">✅ {successMsg}</Text>
              </Box>
            )}

            <Button mt={2}
              h="50px"
              bg="white"
              color="#4525A2"
              fontWeight="900"
              fontSize="md"
              borderRadius="full"
              boxShadow="0 4px 20px rgba(0,0,0,0.2)"
              _hover={{ transform: "translateY(-2px)", boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}
              _active={{ transform: "translateY(0)" }}
              transition="all 0.2s"
              onClick={handleSubmit}
              loading={loading}
            >
              {mode === "signin" ? "Sign In" : "Create Account"}
              <ArrowRight size={18} style={{ marginLeft: "8px" }} />
            </Button>

            <Box textAlign="center" pt={2}>
              <Box
                as="button"
                onClick={onGuest}
                color="whiteAlpha.600"
                fontSize="sm"
                fontWeight="600"
                _hover={{ color: "whiteAlpha.900" }}
                transition="color 0.2s"
              >
                Continue as Guest →
              </Box>
            </Box>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

export default SignInPage;
