import { supabase } from "./supabase";

export interface Playlist {
  id: string;
  name: string;
  embedUrl: string;
  image: string;
  color: string;
}

interface PlaylistRow {
  id: string;
  name: string;
  embed_url: string;
  image: string;
  color: string;
}

const toPlaylist = (row: PlaylistRow): Playlist => ({
  id: row.id,
  name: row.name,
  embedUrl: row.embed_url,
  image: row.image,
  color: row.color,
});

/** Pulls the playlist ID out of a normal Spotify share link, e.g. https://open.spotify.com/playlist/{id}?si=... */
export const parseSpotifyPlaylistId = (url: string): string | null => {
  const match = url.match(/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
};

const ADD_COLORS = ["#B2E2F2", "#FFD1DC", "#FFF4BD", "#CDB4F6", "#C8E6C9", "#FFCCBC"];

/** Fails soft to [] — an unreachable/empty table shouldn't break the player. */
export const fetchCustomPlaylists = async (): Promise<Playlist[]> => {
  try {
    const { data, error } = await supabase
      .from("playlists")
      .select("*")
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return (data as PlaylistRow[]).map(toPlaylist);
  } catch {
    return [];
  }
};

export const addPlaylist = async (
  { name, spotifyUrl, imageDataUrl }: { name: string; spotifyUrl: string; imageDataUrl: string },
  existingCount: number
): Promise<Playlist> => {
  const id = parseSpotifyPlaylistId(spotifyUrl);
  if (!id) throw new Error("That doesn't look like a Spotify playlist link.");

  const row = {
    name,
    embed_url: `https://open.spotify.com/embed/playlist/${id}`,
    image: imageDataUrl,
    color: ADD_COLORS[existingCount % ADD_COLORS.length],
  };

  const { data, error } = await supabase.from("playlists").insert(row).select().single();
  if (error || !data) throw new Error(error?.message || "Couldn't save that playlist.");
  return toPlaylist(data as PlaylistRow);
};
