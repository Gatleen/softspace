import { useState } from "react";
import {
  Box,
  SimpleGrid,
  Text,
  IconButton,
  HStack,
  Dialog,
  Portal,
  Input,
  VStack,
  Button,
  Circle,
  Center,
  Image,
} from "@chakra-ui/react";
import { ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";

interface EventDetails {
  title: string;
  time: string;
  location: string;
}

interface CalendarEvents {
  [dateString: string]: EventDetails[];
}

const CalendarWidget = ({ currentDate }: { currentDate: Date }) => {
  const [viewDate, setViewDate] = useState(currentDate);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvents>({});
  const [newEvent, setNewEvent] = useState<EventDetails>({
    title: "",
    time: "",
    location: "",
  });

  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const formatDateKey = (day: number) => {
    const mm = String(viewDate.getMonth() + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${viewDate.getFullYear()}-${mm}-${dd}`;
  };

  const handlePrevMonth = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const handleDateClick = (day: number) => {
    setSelectedDate(formatDateKey(day));
    setNewEvent({ title: "", time: "", location: "" });
    setIsDialogOpen(true);
  };

  const saveEvent = () => {
    if (selectedDate && newEvent.title) {
      setEvents((prev) => ({
        ...prev,
        [selectedDate]: [...(prev[selectedDate] || []), newEvent],
      }));
      setIsDialogOpen(false);
    }
  };

  const daysInMonth = getDaysInMonth(viewDate);
  const startDay = getFirstDayOfMonth(viewDate);
  const emptySlots = Array.from({ length: startDay });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthName = viewDate.toLocaleString("default", { month: "long" });
  const currentDayKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Box
      bg="white"
      borderRadius="3xl"
      border="1.5px solid"
      borderColor="pink.100"
      boxShadow="0 8px 32px rgba(255, 182, 193, 0.18)"
      overflow="hidden"
    >
      {/* ── Gradient header ── */}
      <Box
        bg="linear-gradient(135deg, #f9a8d4 0%, #c084fc 100%)"
        px={6}
        pt={5}
        pb={6}
        position="relative"
        overflow="hidden"
      >
        {/* decorative blobs */}
        <Box position="absolute" top="-20px" right="-20px" w="100px" h="100px"
          borderRadius="full" bg="whiteAlpha.100" />
        <Box position="absolute" bottom="-30px" left="20px" w="80px" h="80px"
          borderRadius="full" bg="whiteAlpha.100" />

        <HStack justify="space-between" align="center" position="relative">
          <HStack gap={3}>
            <Center
              w="44px" h="44px" borderRadius="xl"
              bg="whiteAlpha.200" border="1px solid" borderColor="whiteAlpha.300"
              flexShrink={0}
            >
              <Image src="/icons/Calendar.png" alt="Calendar" boxSize="26px" objectFit="contain" />
            </Center>
            <VStack align="start" gap={0}>
              <Text fontSize="2xl" fontWeight="900" color="white"
                letterSpacing="tight" lineHeight="1" textShadow="0 2px 8px rgba(0,0,0,0.15)">
                {monthName}
              </Text>
              <Text fontSize="sm" color="whiteAlpha.800" fontWeight="bold">
                {viewDate.getFullYear()} · Sweet plans await ✨
              </Text>
            </VStack>
          </HStack>

          <HStack bg="whiteAlpha.200" p="4px" borderRadius="full" gap={1}
            border="1px solid" borderColor="whiteAlpha.300" backdropFilter="blur(8px)">
            <IconButton aria-label="Prev" size="sm" variant="ghost"
              rounded="full" color="white" onClick={handlePrevMonth}
              _hover={{ bg: "whiteAlpha.300" }}>
              <ChevronLeft size={18} />
            </IconButton>
            <IconButton aria-label="Next" size="sm" variant="ghost"
              rounded="full" color="white" onClick={handleNextMonth}
              _hover={{ bg: "whiteAlpha.300" }}>
              <ChevronRight size={18} />
            </IconButton>
          </HStack>
        </HStack>

        {/* Day-of-week row sitting on the gradient */}
        <SimpleGrid columns={7} gap={1} mt={5}>
          {DAY_LABELS.map((d, i) => (
            <Text key={d} fontSize="10px" fontWeight="800" textAlign="center"
              textTransform="uppercase" letterSpacing="wide"
              color={i === 0 || i === 6 ? "orange.100" : "whiteAlpha.800"}>
              {d}
            </Text>
          ))}
        </SimpleGrid>
      </Box>

      {/* ── Day grid ── */}
      <Box px={4} pt={3} pb={5}>
        <SimpleGrid columns={7} gap={1}>
          {emptySlots.map((_, i) => (
            <Box key={`empty-${i}`} />
          ))}

          {days.map((day) => {
            const dateKey = formatDateKey(day);
            const isToday = dateKey === currentDayKey;
            const hasEvents = events[dateKey] && events[dateKey].length > 0;
            const eventCount = events[dateKey]?.length ?? 0;
            // 0=Sun,6=Sat
            const dayOfWeek = (startDay + day - 1) % 7;
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            return (
              <Box
                key={day}
                onClick={() => handleDateClick(day)}
                position="relative"
                h="44px"
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                borderRadius="xl"
                transition="all 0.18s ease"
                bg={isToday
                  ? "transparent"
                  : hasEvents
                  ? "pink.50"
                  : "transparent"}
                _hover={{
                  bg: isToday ? "transparent" : "purple.50",
                  transform: "translateY(-2px)",
                }}
                gap="2px"
              >
                {/* Today highlight */}
                {isToday && (
                  <Box
                    position="absolute"
                    inset="2px"
                    borderRadius="lg"
                    style={{
                      background: "linear-gradient(135deg, #c084fc, #f472b6)",
                      boxShadow: "0 4px 14px rgba(192,132,252,0.45)",
                    }}
                  />
                )}

                <Text
                  fontSize="sm"
                  fontWeight={isToday || hasEvents ? "900" : "600"}
                  color={
                    isToday
                      ? "white"
                      : hasEvents
                      ? "pink.600"
                      : isWeekend
                      ? "purple.400"
                      : "gray.600"
                  }
                  position="relative"
                  zIndex={1}
                  lineHeight="1"
                >
                  {day}
                </Text>

                {/* Event dots */}
                {hasEvents && (
                  <HStack gap="2px" position="relative" zIndex={1}>
                    {Array.from({ length: Math.min(eventCount, 3) }).map((_, i) => (
                      <Box
                        key={i}
                        w="4px"
                        h="4px"
                        borderRadius="full"
                        bg={isToday ? "white" : ["pink.400", "purple.400", "orange.300"][i]}
                      />
                    ))}
                  </HStack>
                )}
              </Box>
            );
          })}
        </SimpleGrid>
      </Box>

      <Dialog.Root
        open={isDialogOpen}
        onOpenChange={(e) => setIsDialogOpen(e.open)}
      >
        <Portal>
          <Dialog.Backdrop
            bg="rgba(139, 92, 246, 0.12)"
            backdropFilter="blur(10px)"
          />
          <Dialog.Positioner>
            <Dialog.Content
              bg="white"
              borderRadius="3xl"
              boxShadow="0 24px 64px rgba(192,132,252,0.22)"
              maxW="420px"
              w="92%"
              border="1.5px solid"
              borderColor="purple.100"
              overflow="hidden"
              p={0}
            >
              {/* ── Gradient header ── */}
              <Box
                bg="linear-gradient(135deg, #f9a8d4 0%, #c084fc 100%)"
                px={6}
                pt={5}
                pb={5}
                position="relative"
                overflow="hidden"
              >
                {/* decorative blobs */}
                <Box position="absolute" top="-16px" right="-16px"
                  w="80px" h="80px" borderRadius="full" bg="whiteAlpha.100" />
                <Box position="absolute" bottom="-24px" left="40px"
                  w="60px" h="60px" borderRadius="full" bg="whiteAlpha.100" />

                <HStack gap={3} position="relative">
                  <Center
                    w="44px" h="44px" borderRadius="xl"
                    bg="whiteAlpha.200" border="1px solid"
                    borderColor="whiteAlpha.300" flexShrink={0}
                  >
                    <Image
                      src="/icons/Calendar.png"
                      alt="Calendar"
                      boxSize="26px"
                      objectFit="contain"
                    />
                  </Center>
                  <VStack align="start" gap={0}>
                    <Text fontSize="lg" fontWeight="900" color="white" lineHeight="1">
                      {selectedDate
                        ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" })
                        : ""}
                    </Text>
                    <Text fontSize="sm" color="whiteAlpha.800" fontWeight="bold">
                      {selectedDate
                        ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                            month: "long", day: "numeric", year: "numeric",
                          })
                        : ""}
                    </Text>
                  </VStack>
                </HStack>
              </Box>

              <Dialog.Body px={5} pt={5} pb={2}>
                {/* ── Existing events ── */}
                {selectedDate && events[selectedDate]?.length > 0 ? (
                  <VStack align="stretch" gap={2} mb={5} maxH="180px" overflowY="auto">
                    <Text fontSize="10px" fontWeight="800" color="purple.300"
                      textTransform="uppercase" letterSpacing="wider" mb={1}>
                      Planned for this day
                    </Text>
                    {events[selectedDate].map((evt, idx) => (
                      <Box
                        key={idx}
                        p={3}
                        borderRadius="2xl"
                        bg="linear-gradient(135deg, #fdf4ff, #fce7f3)"
                        border="1px solid"
                        borderColor="purple.100"
                        position="relative"
                        overflow="hidden"
                      >
                        <Box
                          position="absolute" left={0} top={0} bottom={0} w="4px"
                          bg="linear-gradient(to bottom, #c084fc, #f472b6)"
                        />
                        <Text fontWeight="800" fontSize="sm" color="purple.700" pl={3}>
                          {evt.title}
                        </Text>
                        <HStack fontSize="xs" color="pink.400" mt={1} gap={3} pl={3}>
                          {evt.time && (
                            <HStack gap={1}>
                              <Clock size={11} />
                              <Text fontWeight="bold">{evt.time}</Text>
                            </HStack>
                          )}
                          {evt.location && (
                            <HStack gap={1}>
                              <MapPin size={11} />
                              <Text fontWeight="bold">{evt.location}</Text>
                            </HStack>
                          )}
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                ) : (
                  <Center
                    flexDirection="column" gap={1} py={5} mb={4}
                    bg="purple.50" borderRadius="2xl"
                    border="1.5px dashed" borderColor="purple.100"
                  >
                    <Text fontSize="2xl">🌸</Text>
                    <Text fontSize="sm" color="purple.300" fontWeight="bold">
                      Nothing planned yet
                    </Text>
                    <Text fontSize="xs" color="gray.400">Add something below!</Text>
                  </Center>
                )}

                {/* ── Add new event form ── */}
                <Box
                  bg="linear-gradient(135deg, #faf5ff, #fff0f9)"
                  p={4} borderRadius="2xl"
                  border="1px solid" borderColor="purple.100"
                >
                  <HStack mb={3} gap={2}>
                    <Box w="3px" h="14px" borderRadius="full"
                      bg="linear-gradient(to bottom, #c084fc, #f472b6)" />
                    <Text fontSize="xs" fontWeight="800" color="purple.500"
                      textTransform="uppercase" letterSpacing="wider">
                      Add a new moment
                    </Text>
                  </HStack>

                  <VStack gap={3}>
                    <Box w="full" position="relative">
                      <Text position="absolute" left={3} top="50%"
                        style={{ transform: "translateY(-50%)" }}
                        fontSize="md" zIndex={1} pointerEvents="none">✏️</Text>
                      <Input
                        placeholder="What's the plan?"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        variant="outline"
                        bg="white" borderRadius="xl"
                        border="1.5px solid" borderColor="purple.100" pl={9}
                        _focus={{ borderColor: "purple.300", boxShadow: "0 0 0 3px rgba(192,132,252,0.15)" }}
                        _placeholder={{ color: "gray.300" }}
                      />
                    </Box>

                    <HStack w="full" gap={2}>
                      <Box flex={1} position="relative">
                        <Text position="absolute" left={3} top="50%"
                          style={{ transform: "translateY(-50%)" }}
                          fontSize="md" zIndex={1} pointerEvents="none">🕐</Text>
                        <Input
                          type="time"
                          value={newEvent.time}
                          onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                          variant="outline"
                          bg="white" borderRadius="xl"
                          border="1.5px solid" borderColor="purple.100" pl={9}
                          _focus={{ borderColor: "purple.300", boxShadow: "0 0 0 3px rgba(192,132,252,0.15)" }}
                        />
                      </Box>
                      <Box flex={1} position="relative">
                        <Text position="absolute" left={3} top="50%"
                          style={{ transform: "translateY(-50%)" }}
                          fontSize="md" zIndex={1} pointerEvents="none">📍</Text>
                        <Input
                          placeholder="Where?"
                          value={newEvent.location}
                          onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                          variant="outline"
                          bg="white" borderRadius="xl"
                          border="1.5px solid" borderColor="purple.100" pl={9}
                          _focus={{ borderColor: "purple.300", boxShadow: "0 0 0 3px rgba(192,132,252,0.15)" }}
                          _placeholder={{ color: "gray.300" }}
                        />
                      </Box>
                    </HStack>
                  </VStack>
                </Box>
              </Dialog.Body>

              <Dialog.Footer px={5} pt={3} pb={5} gap={2}>
                <Button
                  variant="ghost" rounded="full"
                  onClick={() => setIsDialogOpen(false)}
                  color="gray.400" flex={1}
                  _hover={{ bg: "gray.50", color: "gray.600" }}
                >
                  Cancel
                </Button>
                <Button
                  rounded="full" onClick={saveEvent} flex={2}
                  style={{
                    background: "linear-gradient(135deg, #c084fc, #f472b6)",
                    boxShadow: "0 4px 16px rgba(192,132,252,0.4)",
                  }}
                  color="white" fontWeight="800"
                  _hover={{ opacity: 0.9, transform: "translateY(-1px)" }}
                  transition="all 0.2s"
                >
                  Save moment ✨
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
};

export default CalendarWidget;
