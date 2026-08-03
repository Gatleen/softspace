import { Box, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  /** Right-aligned meta text, e.g. "3 entries · saved to this device" */
  meta?: ReactNode;
}

/**
 * The "˚♡ ⋅ ˚ Title ˚♡ ⋅ ˚" page-title row with the dashed divider line,
 * used at the top of every secondary page (Journal, Badges, Friends, Mood, …).
 */
const SectionHeader = ({ title, meta }: SectionHeaderProps) => {
  return (
    <Box
      display="flex"
      flexDirection={{ base: "column", md: "row" }}
      alignItems={{ base: "flex-start", md: "center" }}
      gap={{ base: "6px", md: "12px" }}
      mb="20px"
    >
      <Text
        fontFamily="'Jersey 25', cursive"
        fontSize={{ base: "22px", md: "32px" }}
        color="#C0577E"
        letterSpacing="1px"
        whiteSpace="nowrap"
      >
        ˚♡ ⋅ ˚ {title} ˚♡ ⋅ ˚
      </Text>
      <Box
        flex="1"
        h="6px"
        borderRadius="3px"
        display={{ base: "none", md: "block" }}
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg,#FFC2DA 0 13px,transparent 13px 24px)",
        }}
      />
      {meta && (
        <Box fontSize={{ base: "11px", md: "12px" }} fontWeight="700" color="#B79ACB">
          {meta}
        </Box>
      )}
    </Box>
  );
};

export default SectionHeader;
