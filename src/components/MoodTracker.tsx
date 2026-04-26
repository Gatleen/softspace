import { useState } from "react";

interface Mood {
  id: number;
  name: string;
  color: string;
  image: string;
  desc: string;
  advice: string;
}

const MoodTracker = () => {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [note, setNote] = useState("");
  const [history, setHistory] = useState<
    { mood: Mood; note: string; fullTime: string }[]
  >([]);

  const moods: Mood[] = [
    {
      id: 1,
      name: "Adored",
      color: "#FFC8DD",
      image: "/moods/Adored.png",
      desc: "Feeling loved and cherished!",
      advice: "Share that love! Send a sweet text to someone you care about.",
    },
    {
      id: 2,
      name: "Angry",
      color: "#FF006E",
      image: "/moods/Angry.png",
      desc: "Keep calm and slay on.",
      advice:
        "Write it all down on paper, then rip it up! It's very therapeutic.",
    },
    {
      id: 3,
      name: "Chill",
      color: "#BDE0FE",
      image: "/moods/Chill.png",
      desc: "Just vibing in the soft zone.",
      advice: "Perfect time for a face mask or a cozy book.",
    },
    {
      id: 4,
      name: "Crying",
      color: "#A2D2FF",
      image: "/moods/Crying.png",
      desc: "It's okay to let it out, bestie.",
      advice: "Hydrate! Crying takes energy. Drink some cool water and rest.",
    },
    {
      id: 5,
      name: "Disappointed",
      color: "#FFAFCC",
      image: "/moods/Disappointed.png",
      desc: "Tomorrow is a fresh start.",
      advice:
        "List 3 tiny things that went right today, even if it's just a good snack.",
    },
    {
      id: 6,
      name: "Disgusted",
      color: "#FB5607",
      image: "/moods/Disgusted.png",
      desc: "That's a major ick.",
      advice: "Change your scenery. A quick walk can help reset your senses.",
    },
    {
      id: 7,
      name: "Embarrassed",
      color: "#CDB4DB",
      image: "/moods/Embarrassed.png",
      desc: "Blushing a little too hard!",
      advice:
        "In 5 years, this will be a funny story. Laugh at it now if you can!",
    },
    {
      id: 8,
      name: "Furious",
      color: "#FFBE0B",
      image: "/moods/Furious.png",
      desc: "Channel that fire into power.",
      advice: "Do 20 jumping jacks or a quick dance to shake the energy out.",
    },
    {
      id: 9,
      name: "Happy",
      color: "#CCD5AE",
      image: "/moods/Happy.png",
      desc: "Radiating pure sunshine vibes.",
      advice: "Take a 'mental snapshot' of this feeling to remember later!",
    },
    {
      id: 10,
      name: "Humorous",
      color: "#E9C46A",
      image: "/moods/Humorous.png",
      desc: "Everything is funny today!",
      advice: "Share a meme! Spread the giggles to the group chat.",
    },
    {
      id: 11,
      name: "Hungry",
      color: "#FF0054",
      image: "/moods/Hungry.png",
      desc: "Time for a sweet treat?",
      advice: "Nourish yourself with something colorful and delicious.",
    },
    {
      id: 12,
      name: "Kissy",
      color: "#8338EC",
      image: "/moods/Kissy.png",
      desc: "Sending love your way!",
      advice: "Go give a pet or a loved one a big hug.",
    },
    {
      id: 13,
      name: "Love",
      color: "#FFD60A",
      image: "/moods/Love.png",
      desc: "Heart is full of sparkles.",
      advice: "Journal about what you love most right now.",
    },
    {
      id: 14,
      name: "Melting",
      color: "#C9184A",
      image: "/moods/Melting.png",
      desc: "Too cute to function.",
      advice: "Look at more cute animal videos. Lean into the cuteness!",
    },
    {
      id: 15,
      name: "Nervous",
      color: "#CAF0F8",
      image: "/moods/Nervous.png",
      desc: "Take a deep breath.",
      advice: "Try the 4-7-8 breathing technique. You've got this!",
    },
    {
      id: 16,
      name: "Neutral",
      color: "#FFB5A7",
      image: "/moods/Neutral.png",
      desc: "Balanced and steady.",
      advice: "A great time for some light cleaning or organizing.",
    },
    {
      id: 17,
      name: "Rage",
      color: "#3C096C",
      image: "/moods/Rage.png",
      desc: "Releasing the inner storm.",
      advice: "Scream into a pillow! It sounds silly, but it works.",
    },
    {
      id: 18,
      name: "Sad",
      color: "#2D6A4F",
      image: "/moods/Sad.png",
      desc: "A soft day for quiet thoughts.",
      advice: "Put on your favorite comfort movie and get under a blanket.",
    },
    {
      id: 19,
      name: "Shocked",
      color: "#90E0EF",
      image: "/moods/Shocked.png",
      desc: "Wait, what just happened?!",
      advice: "Take a minute to process before reacting. Stay grounded.",
    },
    {
      id: 20,
      name: "Smiley",
      color: "#540B0E",
      image: "/moods/Smiley.png",
      desc: "Grinning from ear to ear.",
      advice: "Your smile is contagious! Keep shining.",
    },
    {
      id: 21,
      name: "Sobbing",
      color: "#FF70A6",
      image: "/moods/Sobbing.png",
      desc: "Deep feels emotional hour.",
      advice:
        "Wash your face with cool water. It helps reset your nervous system.",
    },
    {
      id: 22,
      name: "Suspicious",
      color: "#7400B8",
      image: "/moods/Suspicious.png",
      desc: "Something's not adding up...",
      advice: "Trust your gut, but look for facts before deciding.",
    },
    {
      id: 23,
      name: "Scared",
      color: "#E2E8F0",
      image: "/moods/Scared.png",
      desc: "Holding on tight!",
      advice: "Turn on some lights and play upbeat music to shift the vibe.",
    },
    {
      id: 24,
      name: "Teary",
      color: "#D00000",
      image: "/moods/Teary.png",
      desc: "Happy tears or sad ones?",
      advice: "Let them flow. Tears are just the heart's way of speaking.",
    },
    {
      id: 25,
      name: "Very Shocked",
      color: "#FF99C8",
      image: "/moods/VeryShocked.png",
      desc: "Mind = Blown. ✨",
      advice:
        "Deep breaths. Take a moment to sit down and let the news settle.",
    },
  ];

  const logMood = () => {
    if (!selectedMood) return;
    const now = new Date();
    const entry = {
      mood: selectedMood,
      note: note || "No thoughts logged.",
      fullTime: `${now.toLocaleDateString()} @ ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    };
    setHistory([entry, ...history].slice(0, 10));
    setNote("");
    setSelectedMood(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom right, var(--chakra-colors-pink-50), var(--chakra-colors-purple-50))",
        padding: "40px",
        fontFamily: "inherit",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ color: "#FB7185", fontSize: "32px", fontWeight: "900" }}>
          How are you, bestie? ✨
        </h1>
        <p style={{ color: "#FDA4AF", fontWeight: "600" }}>
          Select a vibe to check in
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 400px",
          gap: "40px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* 🧩 Interactive Mood Picker Grid */}
        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "24px",
            border: "4px solid #FFE4E6",
            height: "fit-content",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "15px",
            }}
          >
            {moods.map((mood) => (
              <div
                key={mood.id}
                onClick={() => setSelectedMood(mood)}
                className="mood-cell"
                style={{
                  aspectRatio: "1/1",
                  background:
                    selectedMood?.id === mood.id ? mood.color : "#F8FAFC",
                  borderRadius: "15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  border:
                    selectedMood?.id === mood.id
                      ? "4px solid #334155"
                      : "2px solid #E2E8F0",
                  transition: "all 0.2s",
                  position: "relative",
                }}
              >
                <img
                  src={mood.image}
                  alt={mood.name}
                  style={{
                    maxWidth: "70%",
                    maxHeight: "70%",
                    objectFit: "contain",
                    imageRendering: "pixelated",
                  }}
                />

                {/* 🏷️ Pink Hover Label */}
                <span className="mood-hover-label">{mood.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 💌 Logging & Advice Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "24px",
              border: "4px solid #FFE4E6",
              minHeight: "450px",
            }}
          >
            {selectedMood ? (
              <div style={{ animation: "pop 0.3s ease-out" }}>
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <img
                    src={selectedMood.image}
                    style={{ width: "80px", imageRendering: "pixelated" }}
                  />
                  <h2
                    style={{
                      color: selectedMood.color,
                      fontSize: "24px",
                      fontWeight: "900",
                      margin: "10px 0",
                    }}
                  >
                    {selectedMood.name}
                  </h2>
                </div>

                <div
                  style={{
                    background: "#F8FAFC",
                    padding: "15px",
                    borderRadius: "15px",
                    marginBottom: "20px",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "12px",
                      color: "#64748B",
                      marginBottom: "5px",
                    }}
                  >
                    BESTIE ADVICE:
                  </h4>
                  <p
                    style={{
                      color: "#334155",
                      fontWeight: "600",
                      fontSize: "14px",
                    }}
                  >
                    {selectedMood.advice}
                  </p>
                </div>

                <textarea
                  placeholder="Why are we feeling this way? (Optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{
                    width: "100%",
                    height: "100px",
                    borderRadius: "12px",
                    border: "2px solid #E2E8F0",
                    padding: "12px",
                    fontFamily: "inherit",
                    resize: "none",
                    marginBottom: "15px",
                    boxSizing: "border-box",
                  }}
                />

                <button
                  onClick={logMood}
                  style={{
                    width: "100%",
                    padding: "15px",
                    background: "#FB7185",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: "800",
                    cursor: "pointer",
                    boxShadow: "0 4px 0 #BE123C",
                  }}
                >
                  LOG VIBE ✨
                </button>
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  color: "#FDA4AF",
                  marginTop: "100px",
                }}
              >
                <p style={{ fontSize: "18px", fontWeight: "700" }}>
                  Pick a mood to start
                  <br />
                  reflecting!
                </p>
              </div>
            )}
          </div>

          {/* 🕰 Recent Vibes History (Fixed Squish + Date/Time) */}
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "24px",
              border: "2px solid #FFE4E6",
              maxHeight: "300px",
              overflowY: "auto",
            }}
            className="custom-scrollbar"
          >
            <h3
              style={{
                fontSize: "12px",
                fontWeight: "800",
                color: "#FB7185",
                marginBottom: "15px",
              }}
            >
              RECENT LOGS
            </h3>
            {history.length > 0 ? (
              history.map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginBottom: "12px",
                    padding: "12px",
                    borderRadius: "12px",
                    background: "#FFF9FA",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={h.mood.image}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                        imageRendering: "pixelated",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "700",
                          color: "#475569",
                        }}
                      >
                        {h.mood.name}
                      </span>
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: "800",
                          color: "#94A3B8",
                        }}
                      >
                        {h.fullTime}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#64748B",
                        margin: "4px 0 0",
                        wordBreak: "break-word",
                      }}
                    >
                      {h.note}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p
                style={{
                  textAlign: "center",
                  fontSize: "12px",
                  color: "#94A3B8",
                }}
              >
                No entries today ✨
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pop {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .mood-cell:hover {
          transform: translateY(-5px);
        }

        .mood-hover-label {
          position: absolute;
          bottom: -10px;
          background: #FB7185; /* Pink Background */
          color: white; /* White Text */
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 800;
          opacity: 0;
          pointer-events: none;
          transition: 0.2s;
          z-index: 10;
          white-space: nowrap;
          box-shadow: 0 4px 10px rgba(251, 113, 133, 0.3);
        }

        .mood-cell:hover .mood-hover-label {
          opacity: 1;
          bottom: -5px;
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #FFF1F2; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #FDA4AF; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default MoodTracker;
