import { Box, Image, Text } from "@chakra-ui/react";

interface Props {
  currentView: string;
  setView: (view: string) => void;
  onFocus?: () => void;
}

const NavigationBar = ({ currentView, setView, onFocus }: Props) => {
  const navItems = [
    { id: "dashboard",    label: "Dashboard",  icon: "/icons/Dashboard.png" },
    { id: "journal",      label: "Journal",    icon: "/icons/Notebook.png"  },
    { id: "achievements", label: "Badges",     icon: "/icons/Badge.png"     },
    { id: "companions",   label: "Friends",    icon: "/icons/Friend.png"    },
    { id: "mood",         label: "Mood",       icon: "/moods/Smiley.png"    },
    { id: "games",        label: "Games",      icon: "/stickers/Magical/Magical2.png"       },
    { id: "finance",      label: "Finance",    icon: "/stickers/Productivity/Productivity3.png" },
    { id: "learning",     label: "Learning",   icon: "/stickers/Productivity/Productivity1.png" },
    { id: "reminders",    label: "Reminders",  icon: "/icons/Clock.png"     },
    { id: "focus",        label: "Focus",      icon: "/icons/Brain.png"     },
  ];

  return (
    <Box display="flex" flexWrap="wrap" gap="10px" pb="20px" mb="24px" borderBottom="3px dotted #FFD3E4">
      {navItems.map((item) => {
        const isActive = item.id !== "focus" && currentView === item.id;
        return (
          <Box
            key={item.id}
            onClick={() => (item.id === "focus" ? onFocus?.() : setView(item.id))}
            cursor="pointer"
            display="flex"
            alignItems="center"
            gap="8px"
            pl="10px"
            pr="18px"
            py="9px"
            borderRadius="16px"
            border="2.5px solid"
            borderColor={isActive ? "white" : "#FFDDEB"}
            background={isActive ? "linear-gradient(135deg,#FFC2DA,#CDB4F6)" : "white"}
            boxShadow={isActive ? "0 4px 0 rgba(196,87,127,.25)" : "0 4px 0 rgba(255,199,222,.45)"}
            transition="transform 0.15s ease"
            _hover={{ transform: "translateY(-2px)" }}
          >
            <Image src={item.icon} alt="" boxSize="22px" objectFit="contain" style={{ imageRendering: "pixelated" }} />
            <Text
              fontFamily="'Jersey 25', cursive"
              fontSize="21px"
              letterSpacing=".6px"
              color={isActive ? "white" : "#B79ACB"}
            >
              {item.label}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
};

export default NavigationBar;
