import { HStack, Box, Image, Text } from "@chakra-ui/react";

interface Props {
  currentView: string;
  setView: (view: string) => void;
}

const NavigationBar = ({ currentView, setView }: Props) => {
  const navItems = [
    { id: "dashboard",    label: "Dashboard",  icon: "/icons/Dashboard.png" },
    { id: "journal",      label: "Journal",    icon: "/icons/Notebook.png"  },
    { id: "achievements", label: "Badges",     icon: "/icons/Badge.png"     },
    { id: "companions",   label: "Friends",    icon: "/icons/Friend.png"    },
    { id: "mood",         label: "Mood",       icon: "/icons/mood.png"      },
    { id: "games",        label: "Games",      icon: "/icons/Games.png"     },
    { id: "finance",      label: "Finance",    icon: "/icons/Finance.png"   },
    { id: "learning",     label: "Learning",   icon: "/icons/Learning.png"  },
    { id: "reminders",    label: "Reminders",  icon: "/icons/Clock.png"     },
  ];

  return (
    <Box
      bg="white"
      py={3}
      px={5}
      borderRadius="full"
      boxShadow="sm"
      mb={8}
      mx="auto"
      w="fit-content"
      border="1px solid"
      borderColor="gray.100"
    >
      <HStack gap={1}>
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <Box
              key={item.id}
              position="relative"
              className="nav-item"
              onClick={() => setView(item.id)}
              cursor="pointer"
              px={3}
              py={2}
              borderRadius="full"
              bg={isActive ? "purple.500" : "transparent"}
              transition="all 0.2s ease"
              _hover={{ bg: isActive ? "purple.500" : "purple.50", transform: "translateY(-2px)" }}
            >
              <Image
                src={item.icon}
                alt={item.label}
                boxSize="22px"
                objectFit="contain"
                filter={isActive ? "none" : "grayscale(70%) opacity(0.55)"}
                transition="filter 0.2s ease"
              />
              {/* Tooltip label */}
              <Box
                position="absolute"
                bottom="-32px"
                left="50%"
                transform="translateX(-50%)"
                bg="gray.800"
                color="white"
                px={2}
                py={1}
                borderRadius="lg"
                pointerEvents="none"
                whiteSpace="nowrap"
                opacity={0}
                transition="opacity 0.15s ease"
                zIndex={100}
                className="nav-tooltip"
              >
                <Text fontSize="11px" fontWeight="700">{item.label}</Text>
              </Box>
            </Box>
          );
        })}
      </HStack>

      <style>{`
        .nav-item:hover .nav-tooltip { opacity: 1; }
      `}</style>
    </Box>
  );
};

export default NavigationBar;
