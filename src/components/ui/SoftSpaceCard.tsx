import { Box, Image, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface SoftSpaceCardProps {
  /** Icon shown in the gradient header's rounded icon box */
  icon?: string;
  title?: string;
  subtitle?: string;
  /** Trailing pill text on the right of the header, e.g. "1 to do" */
  badge?: string;
  /** Custom trailing header content (overrides `badge`) */
  headerRight?: ReactNode;
  borderColor?: string;
  shadowColor?: string;
  headerGradient?: string;
  /** Skip the gradient header entirely (plain white card) */
  headerless?: boolean;
  bodyPadding?: string;
  children?: ReactNode;
}

/**
 * The white card / colored-border / offset-shadow / gradient-header pattern
 * repeated across the SoftSpace mockup (dashboard widgets + most secondary pages).
 */
const SoftSpaceCard = ({
  icon,
  title,
  subtitle,
  badge,
  headerRight,
  borderColor = "#FFDDEB",
  shadowColor = "rgba(255,199,222,.45)",
  headerGradient = "linear-gradient(135deg,#FFC2DA,#D9BFF7)",
  headerless = false,
  bodyPadding = "16px 18px 20px",
  children,
}: SoftSpaceCardProps) => {
  return (
    <Box
      bg="white"
      border="2.5px solid"
      borderColor={borderColor}
      borderRadius="24px"
      boxShadow={`0 6px 0 ${shadowColor}`}
      overflow="hidden"
    >
      {!headerless && (title || icon) && (
        <Box
          px={{ base: "14px", md: "20px" }}
          py={{ base: "12px", md: "16px" }}
          background={headerGradient}
          display="flex"
          alignItems="center"
          gap={{ base: "8px", md: "12px" }}
        >
          {icon && (
            <Box
              w={{ base: "34px", md: "42px" }}
              h={{ base: "34px", md: "42px" }}
              borderRadius="14px"
              bg="rgba(255,255,255,.35)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Image src={icon} alt="" boxSize={{ base: "20px", md: "26px" }} objectFit="contain" />
            </Box>
          )}
          <Box flex="1" minW={0}>
            {title && (
              <Text
                fontFamily="'Jersey 25', cursive"
                fontSize={{ base: "19px", md: "24px" }}
                color="white"
                letterSpacing=".6px"
                textShadow="0 2px 0 rgba(196,87,127,.3)"
                lineHeight="1.1"
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text fontSize="10.5px" fontWeight="700" color="rgba(255,255,255,.9)">
                {subtitle}
              </Text>
            )}
          </Box>
          {headerRight}
          {!headerRight && badge && (
            <Box
              px="12px"
              py="5px"
              borderRadius="999px"
              bg="rgba(255,255,255,.4)"
              fontSize="11px"
              fontWeight="800"
              color="white"
              flexShrink={0}
            >
              {badge}
            </Box>
          )}
        </Box>
      )}
      <Box p={bodyPadding}>{children}</Box>
    </Box>
  );
};

export default SoftSpaceCard;
