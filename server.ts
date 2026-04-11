import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import cookieParser from "cookie-parser";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

// Spotify Config
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.APP_URL ? `${process.env.APP_URL}/auth/spotify/callback` : 'http://localhost:3000/auth/spotify/callback';

console.log("Spotify Config Status:", {
  hasClientId: !!SPOTIFY_CLIENT_ID,
  hasClientSecret: !!SPOTIFY_CLIENT_SECRET,
  redirectUri: REDIRECT_URI
});

// Spotify Auth URL
app.get("/api/auth/spotify/url", (req, res) => {
  if (!SPOTIFY_CLIENT_ID) {
    return res.status(500).json({ error: "Spotify Client ID not configured" });
  }
  const scope = "user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing";
  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${SPOTIFY_CLIENT_ID}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.json({ url: authUrl });
});

// Spotify Callback
app.get("/auth/spotify/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("No code provided");
  }

  try {
    const response = await axios.post("https://accounts.spotify.com/api/token", 
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code as string,
        redirect_uri: REDIRECT_URI,
        client_id: SPOTIFY_CLIENT_ID!,
        client_secret: SPOTIFY_CLIENT_SECRET!,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    // Store tokens in cookies (SameSite=None, Secure=true for iframe)
    res.cookie("spotify_access_token", access_token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: "none", 
      maxAge: expires_in * 1000 
    });
    res.cookie("spotify_refresh_token", refresh_token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: "none", 
      maxAge: 30 * 24 * 60 * 60 * 1000 
    });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'SPOTIFY_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Spotify connected successfully. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("Spotify token exchange error:", error.response?.data || error.message);
    res.status(500).send("Failed to connect to Spotify");
  }
});

// Spotify API Proxy
const refreshSpotifyToken = async (refreshToken: string) => {
  try {
    const response = await axios.post("https://accounts.spotify.com/api/token", 
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: SPOTIFY_CLIENT_ID!,
        client_secret: SPOTIFY_CLIENT_SECRET!,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Spotify token refresh error");
    return null;
  }
};

app.get("/api/spotify/me", async (req, res) => {
  let token = req.cookies.spotify_access_token;
  const refreshToken = req.cookies.spotify_refresh_token;

  if (!token && refreshToken) {
    const refreshed = await refreshSpotifyToken(refreshToken);
    if (refreshed) {
      token = refreshed.access_token;
      res.cookie("spotify_access_token", token, { 
        httpOnly: true, secure: true, sameSite: "none", 
        maxAge: refreshed.expires_in * 1000 
      });
    }
  }

  if (!token) return res.status(401).json({ error: "Not connected to Spotify" });

  try {
    const response = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    res.json(response.data);
  } catch (error: any) {
    if (error.response?.status === 401 && refreshToken) {
      // Try refresh once more if 401 from Spotify
      const refreshed = await refreshSpotifyToken(refreshToken);
      if (refreshed) {
        const newToken = refreshed.access_token;
        res.cookie("spotify_access_token", newToken, { 
          httpOnly: true, secure: true, sameSite: "none", 
          maxAge: refreshed.expires_in * 1000 
        });
        const retryRes = await axios.get("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${newToken}` }
        });
        return res.json(retryRes.data);
      }
    }
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Spotify API error" });
  }
});

app.get("/api/spotify/player", async (req, res) => {
  let token = req.cookies.spotify_access_token;
  const refreshToken = req.cookies.spotify_refresh_token;

  if (!token && refreshToken) {
    const refreshed = await refreshSpotifyToken(refreshToken);
    if (refreshed) {
      token = refreshed.access_token;
      res.cookie("spotify_access_token", token, { 
        httpOnly: true, secure: true, sameSite: "none", 
        maxAge: refreshed.expires_in * 1000 
      });
    }
  }

  if (!token) return res.status(401).json({ error: "Not connected to Spotify" });

  try {
    const response = await axios.get("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${token}` }
    });
    res.json(response.data || { is_playing: false });
  } catch (error: any) {
    if (error.response?.status === 401 && refreshToken) {
      const refreshed = await refreshSpotifyToken(refreshToken);
      if (refreshed) {
        const newToken = refreshed.access_token;
        res.cookie("spotify_access_token", newToken, { 
          httpOnly: true, secure: true, sameSite: "none", 
          maxAge: refreshed.expires_in * 1000 
        });
        const retryRes = await axios.get("https://api.spotify.com/v1/me/player/currently-playing", {
          headers: { Authorization: `Bearer ${newToken}` }
        });
        return res.json(retryRes.data || { is_playing: false });
      }
    }
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Spotify API error" });
  }
});

// Playback Controls
const spotifyAction = async (req: any, res: any, method: 'post' | 'put', endpoint: string) => {
  let token = req.cookies.spotify_access_token;
  const refreshToken = req.cookies.spotify_refresh_token;

  if (!token && refreshToken) {
    const refreshed = await refreshSpotifyToken(refreshToken);
    if (refreshed) {
      token = refreshed.access_token;
      res.cookie("spotify_access_token", token, { 
        httpOnly: true, secure: true, sameSite: "none", 
        maxAge: refreshed.expires_in * 1000 
      });
    }
  }

  if (!token) return res.status(401).json({ error: "Not connected to Spotify" });

  try {
    await axios({
      method,
      url: `https://api.spotify.com/v1/me/player/${endpoint}`,
      headers: { Authorization: `Bearer ${token}` }
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Spotify API error" });
  }
};

app.put("/api/spotify/play", (req, res) => spotifyAction(req, res, 'put', 'play'));
app.put("/api/spotify/pause", (req, res) => spotifyAction(req, res, 'put', 'pause'));
app.post("/api/spotify/next", (req, res) => spotifyAction(req, res, 'post', 'next'));
app.post("/api/spotify/previous", (req, res) => spotifyAction(req, res, 'post', 'previous'));

app.post("/api/spotify/logout", (req, res) => {
  res.clearCookie("spotify_access_token");
  res.clearCookie("spotify_refresh_token");
  res.json({ success: true });
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
