import { useState } from "react";
import {
  Box, VStack, HStack, Text, Input, Button, Image,
} from "@chakra-ui/react";
import { ArrowRight, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";

const JERSEY = "'Jersey 25', cursive";

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
    bg: "white" as const,
    border: "2px solid" as const,
    borderColor: "#FFDDEB" as const,
    borderRadius: "16px" as const,
    color: "#4A3B52" as const,
    _placeholder: { color: "#C2AECF" },
    _focus: { borderColor: "#F9A8CB", boxShadow: "0 0 0 3px rgba(249,168,203,0.25)" },
  };

  return (
    <Box
      minH="100dvh"
      w="100vw"
      background="linear-gradient(160deg,#E7DEFB 0%,#F6E3F1 45%,#FFF1F7 100%)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
      position="relative"
      overflow="hidden"
    >
      {/* Decorative blobs */}
      <Box position="absolute" top="-140px" left="-120px" w="380px" h="380px"
        borderRadius="999px" bg="whiteAlpha.600" opacity={0.5} pointerEvents="none" />
      <Box position="absolute" bottom="-160px" right="-130px" w="340px" h="340px"
        borderRadius="999px" bg="whiteAlpha.600" opacity={0.45} pointerEvents="none" />

      {/* Twinkle stars */}
      <Box position="absolute" top="10%" left="8%" fontSize="26px" color="#F9A8CB"
        style={{ animation: "ss-twinkle 3s ease-in-out infinite" }} pointerEvents="none">✧</Box>
      <Box position="absolute" bottom="10%" right="8%" fontSize="20px" color="#CDB4F6"
        style={{ animation: "ss-twinkle 2.4s ease-in-out infinite .6s" }} pointerEvents="none">✧</Box>

      <Box
        display={{ base: "flex", lg: "grid" }}
        gridTemplateColumns={{ lg: "1fr 1fr" }}
        flexDirection={{ base: "column" }}
        w="100%" maxW="900px"
        background="rgba(255,255,255,.75)"
        border="3px solid white"
        borderRadius="28px"
        boxShadow="0 14px 0 rgba(196,87,127,.14)"
        overflow="hidden"
        zIndex={1}
      >
        {/* Left panel — branding */}
        <Box
          display={{ base: "none", lg: "flex" }}
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          p="44px 38px"
          background="rgba(255,255,255,.5)"
          borderRight="3px dotted #FFD3E4"
          position="relative"
          gap="20px"
        >
          <Box style={{ animation: "ss-float 5s ease-in-out infinite" }}>
            <Image src="/Llama1.png" alt="SoftSpace Mascot" w="150px" h="auto"
              filter="drop-shadow(0 12px 18px rgba(122,90,160,.3))" />
          </Box>
          <VStack gap="6px" textAlign="center">
            <Text fontFamily={JERSEY} fontSize="52px" lineHeight="1" color="#F27DAB">
              SoftSpace
            </Text>
            <Text fontSize="11px" fontWeight="800" letterSpacing="5px" color="#C9A6D9">
              YOUR DIGITAL SANCTUARY
            </Text>
          </VStack>
          <Box
            background="white"
            border="2px solid #FFDDEB"
            borderRadius="18px"
            px="20px" py="14px"
            textAlign="center"
          >
            <Text fontSize="12.5px" fontWeight="600" fontStyle="italic" color="#8A7690">
              "A calm space to focus, reflect, and grow — one task at a time."
            </Text>
          </Box>
        </Box>

        {/* Right panel — form */}
        <Box p={{ base: "32px 24px", lg: "40px 38px" }} display="flex" flexDirection="column" justifyContent="center">
          {/* Mobile branding */}
          <Box display={{ base: "flex", lg: "none" }} justifyContent="center" mb="24px">
            <VStack gap="4px" textAlign="center">
              <Image src="/Llama1.png" alt="SoftSpace" w="80px" style={{ animation: "ss-float 5s ease-in-out infinite" }} />
              <Text fontFamily={JERSEY} fontSize="32px" color="#F27DAB">SoftSpace</Text>
            </VStack>
          </Box>

          {/* Mode tabs */}
          <HStack
            background="#FFF0F6"
            border="2px solid #FFDDEB"
            p="5px" borderRadius="999px" mb="24px"
          >
            {(["signin", "signup"] as const).map((m) => (
              <Button key={m} flex={1} variant="plain" borderRadius="999px"
                h="auto" py="8px"
                background={mode === m ? "white" : "transparent"}
                color={mode === m ? "#C0577E" : "#C2AECF"}
                boxShadow={mode === m ? "0 2px 6px rgba(196,87,127,.15)" : "none"}
                fontWeight="800" fontSize="14px"
                transition="all 0.15s"
                onClick={() => { setMode(m); setError(""); setSuccessMsg(""); }}>
                {m === "signin" ? "Sign In" : "Sign Up"}
              </Button>
            ))}
          </HStack>

          <VStack gap="16px" align="stretch">
            <Box>
              <Text fontFamily={JERSEY} fontSize="38px" lineHeight="1.1" color="#C0577E">
                {mode === "signin" ? "Welcome back ✧" : "Join SoftSpace ✧"}
              </Text>
              <Text color="#A08B9B" fontSize="12.5px" fontWeight="600" mt="4px">
                {mode === "signin"
                  ? "Sign in to continue your journey"
                  : "Create your account to get started"}
              </Text>
            </Box>

            {mode === "signup" && (
              <Box>
                <Text color="#B79ACB" fontSize="10px" fontWeight="800"
                  letterSpacing="2px" mb="6px" textTransform="uppercase">Display Name</Text>
                <Box position="relative">
                  <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1}>
                    <User size={16} color="#C2AECF" />
                  </Box>
                  <Input pl={10} placeholder="Your name or nickname"
                    value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                    {...inputStyle} />
                </Box>
              </Box>
            )}

            <Box>
              <Text color="#B79ACB" fontSize="10px" fontWeight="800"
                letterSpacing="2px" mb="6px" textTransform="uppercase">Email</Text>
              <Box position="relative">
                <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1}>
                  <Mail size={16} color="#C2AECF" />
                </Box>
                <Input pl={10} type="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  {...inputStyle} />
              </Box>
            </Box>

            <Box>
              <Text color="#B79ACB" fontSize="10px" fontWeight="800"
                letterSpacing="2px" mb="6px" textTransform="uppercase">Password</Text>
              <Box position="relative">
                <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" zIndex={1}>
                  <Lock size={16} color="#C2AECF" />
                </Box>
                <Input pl={10} pr={10} type={showPassword ? "text" : "password"}
                  placeholder={mode === "signup" ? "Min. 6 characters" : "Your password"}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  {...inputStyle} />
                <Box position="absolute" right={3} top="50%" transform="translateY(-50%)"
                  cursor="pointer" onClick={() => setShowPassword(!showPassword)} zIndex={1}>
                  {showPassword
                    ? <EyeOff size={16} color="#C2AECF" />
                    : <Eye size={16} color="#C2AECF" />}
                </Box>
              </Box>
            </Box>

            {error && (
              <Box px="16px" py="10px" bg="#FFE4E4"
                borderRadius="14px" border="1.5px solid #FFC2C2">
                <Text color="#C0577E" fontSize="13px" fontWeight="700">⚠️ {error}</Text>
              </Box>
            )}
            {successMsg && (
              <Box px="16px" py="10px" bg="#E3F6EA"
                borderRadius="14px" border="1.5px solid #BFE8CE">
                <Text color="#3C8A5C" fontSize="13px" fontWeight="700">✅ {successMsg}</Text>
              </Box>
            )}

            <Button mt="6px"
              h="auto"
              py="12px"
              w="full"
              background="linear-gradient(135deg,#FFC2DA,#CDB4F6)"
              border="2.5px solid white"
              color="white"
              fontFamily={JERSEY}
              fontSize="28px"
              borderRadius="999px"
              boxShadow="0 6px 0 rgba(196,87,127,.2)"
              _hover={{ transform: "translateY(-2px)", boxShadow: "0 8px 0 rgba(196,87,127,.24)" }}
              _active={{ transform: "translateY(0)" }}
              transition="all 0.2s"
              onClick={handleSubmit}
              loading={loading}
            >
              {mode === "signin" ? "Sign In" : "Create Account"}
              <ArrowRight size={18} style={{ marginLeft: "8px" }} />
            </Button>

            <Box textAlign="center" pt="4px">
              <Box
                as="button"
                onClick={onGuest}
                color="#B79ACB"
                fontSize="12.5px"
                fontWeight="700"
                _hover={{ color: "#8A6BD1" }}
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
