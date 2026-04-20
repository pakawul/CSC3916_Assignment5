import React, { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:8080";

export default function App() {
  const [mode, setMode] = useState("signin");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [signupForm, setSignupForm] = useState({ name: "", username: "", password: "" });
  const [signinForm, setSigninForm] = useState({ username: "", password: "" });
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [reviewForm, setReviewForm] = useState({ rating: 5, review: "" });

  const authHeaders = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: token,
  }), [token]);

  async function fetchMovies() {
    if (!token) return;
    setMoviesLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/movies`, { method: "GET", headers: { Authorization: token } });
      const data = await res.json();
      if (!res.ok) { setMessage(data.message || data.msg || "Could not load movies."); setMovies([]); }
      else setMovies(data);
    } catch (err) { setMessage(err.message); setMovies([]); }
    finally { setMoviesLoading(false); }
  }

  async function fetchMovieDetails(movieId) {
    setDetailLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/movies/${movieId}?reviews=true`, { method: "GET", headers: { Authorization: token } });
      const data = await res.json();
      if (!res.ok) { setMessage(data.message || data.msg || "Could not load movie details."); setSelectedMovie(null); }
      else setSelectedMovie(data);
    } catch (err) { setMessage(err.message); setSelectedMovie(null); }
    finally { setDetailLoading(false); }
  }

  useEffect(() => { if (token) fetchMovies(); }, [token]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(signupForm) });
      const data = await res.json();
      setMessage(data.msg || data.message || "Signup complete.");
      if (res.ok && data.success) setMode("signin");
    } catch (err) { setMessage(err.message); }
  };

  const handleSignin = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/signin`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(signinForm) });
      const data = await res.json();
      if (!res.ok || !data.token) { setMessage(data.msg || data.message || "Signin failed."); return; }
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setMessage("Signed in successfully.");
    } catch (err) { setMessage(err.message); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setMovies([]);
    setSelectedMovie(null);
    setMessage("Logged out.");
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMovie) return;
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ title: selectedMovie.title, rating: Number(reviewForm.rating), review: reviewForm.review }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage(data.message || data.msg || "Could not add review."); return; }
      setMessage("Review added.");
      setReviewForm({ rating: 5, review: "" });
      await fetchMovies();
      await fetchMovieDetails(selectedMovie._id);
    } catch (err) { setMessage(err.message); }
  };

  const StarRating = ({ value, max = 5, size = 14 }) => (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ color: i < Math.round(value) ? "#e8a020" : "#ddd", fontSize: size }}>★</span>
      ))}
    </span>
  );

  const StarPicker = ({ value, onChange }) => (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 22, color: n <= value ? "#e8a020" : "#ddd",
            padding: 0, lineHeight: 1, transition: "color 0.1s",
          }}
        >★</button>
      ))}
    </div>
  );

  /* ── AUTH SCREEN ── */
  if (!token) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--color-background-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "var(--font-sans)" }}>
        <div style={{ width: "100%", maxWidth: 380 }}>

          {/* Logo + headline */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <svg viewBox="0 0 24 24" style={{ width: 26, height: 26, fill: "#fff" }}>
                <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4h-4z"/>
              </svg>
            </div>
            <div style={{ fontSize: 22, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 6 }}>Movie Reviews</div>
            <div style={{ fontSize: 14, color: "var(--color-text-tertiary)" }}>A movie review journal</div>
          </div>

          {/* Card */}
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: 20 }}>

            {/* Tabs */}
            <div style={{ display: "flex", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: 3, marginBottom: 20 }}>
              {["signin", "signup"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => { setMode(tab); setMessage(""); }}
                  style={{
                    flex: 1, padding: "8px", textAlign: "center", fontSize: 13, fontWeight: 500,
                    cursor: "pointer", borderRadius: 6,
                    color: mode === tab ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                    background: mode === tab ? "var(--color-background-primary)" : "none",
                    border: mode === tab ? "0.5px solid var(--color-border-tertiary)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {tab === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            {message && (
              <div style={{ padding: "10px 14px", borderRadius: "var(--border-radius-md)", fontSize: 13, marginBottom: 14, background: "#EEEDFE", color: "#534AB7" }}>
                {message}
              </div>
            )}

            {mode === "signup" ? (
              <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[["Full name", "text", "Jane Doe", "name"], ["Username", "text", "janedoe", "username"], ["Password", "password", "••••••••", "password"]].map(([label, type, placeholder, key]) => (
                  <div key={key}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 5 }}>{label}</label>
                    <input
                      type={type} placeholder={placeholder} value={signupForm[key]}
                      onChange={(e) => setSignupForm({ ...signupForm, [key]: e.target.value })}
                      style={{ width: "100%", padding: "9px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", fontSize: 14, fontFamily: "var(--font-sans)", color: "var(--color-text-primary)", background: "var(--color-background-primary)", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                ))}
                <button type="submit" style={{ width: "100%", padding: 10, background: "#1a1a2e", color: "#fff", border: "none", borderRadius: "var(--border-radius-md)", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                  Create account
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[["Username", "text", "your username", "username"], ["Password", "password", "••••••••", "password"]].map(([label, type, placeholder, key]) => (
                  <div key={key}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 5 }}>{label}</label>
                    <input
                      type={type} placeholder={placeholder} value={signinForm[key]}
                      onChange={(e) => setSigninForm({ ...signinForm, [key]: e.target.value })}
                      style={{ width: "100%", padding: "9px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", fontSize: 14, fontFamily: "var(--font-sans)", color: "var(--color-text-primary)", background: "var(--color-background-primary)", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                ))}
                <button type="submit" style={{ width: "100%", padding: 10, background: "#1a1a2e", color: "#fff", border: "none", borderRadius: "var(--border-radius-md)", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                  Sign in
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── MAIN APP ── */
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-tertiary)", fontFamily: "var(--font-sans)" }}>

      {/* Nav */}
      <div style={{ background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "var(--border-radius-md)", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "#fff" }}>
              <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4h-4z"/>
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)" }}>Movie Reviews</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[["Refresh", fetchMovies], ["Sign out", handleLogout]].map(([label, fn]) => (
            <button key={label} onClick={fn} style={{ padding: "5px 12px", fontSize: 13, fontWeight: 500, cursor: "pointer", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", color: "var(--color-text-primary)" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div style={{ margin: "16px 24px 0", padding: "10px 14px", borderRadius: "var(--border-radius-md)", fontSize: 13, background: "#EEEDFE", color: "#534AB7" }}>
          {message}
        </div>
      )}

      {/* Body */}
      <div style={{ padding: 24, display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, maxWidth: 1000, margin: "0 auto" }}>

        {/* Movie list */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px 12px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
            <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-tertiary)", marginBottom: 4 }}>Top rated</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>Movies</div>
          </div>
          <div style={{ overflowY: "auto", maxHeight: 620 }}>
            {moviesLoading ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 13 }}>Loading movies…</div>
            ) : movies.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 13 }}>No movies found.</div>
            ) : (
              movies.slice(0, 10).map((movie, i) => (
                <div
                  key={movie._id}
                  onClick={() => fetchMovieDetails(movie._id)}
                  style={{
                    padding: "14px 20px", borderBottom: "0.5px solid var(--color-border-tertiary)",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
                    background: selectedMovie?._id === movie._id ? "#f0f0ff" : "transparent",
                    borderLeft: selectedMovie?._id === movie._id ? "2px solid #534AB7" : "2px solid transparent",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-tertiary)", minWidth: 18 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{movie.title}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>{movie.genre} · {movie.releaseDate}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <span style={{ color: "#e8a020", fontSize: 12 }}>★</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)" }}>{Number(movie.averageRating || 0).toFixed(1)}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{movie.reviewCount || 0} reviews</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", overflow: "hidden" }}>
          {!selectedMovie ? (
            <div style={{ padding: 80, textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 13 }}>
              {detailLoading ? "Loading details…" : "Select a movie to see details and reviews."}
            </div>
          ) : (
            <>
              {/* Hero */}
              <div style={{ position: "relative", height: 200, background: "#0a0a1a", overflow: "hidden" }}>
                <img src={selectedMovie.imageUrl} alt={selectedMovie.title} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, background: "linear-gradient(to top, rgba(10,10,26,0.95) 0%, transparent 100%)" }}>
                  <div style={{ fontSize: 22, fontWeight: 500, color: "#fff", marginBottom: 4 }}>{selectedMovie.title}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{selectedMovie.genre} · {selectedMovie.releaseDate}</div>
                </div>
              </div>

              <div style={{ padding: 20 }}>
                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
                  {[
                    ["Rating", <>{Number(selectedMovie.averageRating || 0).toFixed(1)}<StarRating value={selectedMovie.averageRating} size={12} /></>],
                    ["Reviews", selectedMovie.reviewCount || (selectedMovie.reviews || []).length || 0],
                    ["Genre", selectedMovie.genre],
                  ].map(([label, value]) => (
                    <div key={label} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: 12 }}>
                      <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: label === "Genre" ? 13 : 20, fontWeight: 500, color: "var(--color-text-primary)", marginTop: label === "Genre" ? 4 : 0 }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Cast */}
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Cast</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                  {(selectedMovie.actors || []).map((actor) => (
                    <span key={actor} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 100, background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", color: "var(--color-text-secondary)" }}>
                      {actor}
                    </span>
                  ))}
                </div>

                {/* Review form */}
                <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", padding: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Write a review</div>
                  <form onSubmit={handleReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 12, color: "var(--color-text-secondary)", minWidth: 40 }}>Rating</span>
                      <StarPicker value={reviewForm.rating} onChange={(v) => setReviewForm({ ...reviewForm, rating: v })} />
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Share your thoughts on this film…"
                      value={reviewForm.review}
                      onChange={(e) => setReviewForm({ ...reviewForm, review: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", fontSize: 13, fontFamily: "var(--font-sans)", color: "var(--color-text-primary)", background: "var(--color-background-primary)", resize: "none", outline: "none", boxSizing: "border-box" }}
                    />
                    <button type="submit" style={{ width: "100%", padding: 10, background: "#1a1a2e", color: "#fff", border: "none", borderRadius: "var(--border-radius-md)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                      Post review
                    </button>
                  </form>
                </div>

                {/* Reviews list */}
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Reviews</div>
                {!selectedMovie.reviews || selectedMovie.reviews.length === 0 ? (
                  <div style={{ padding: "20px 0", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 13 }}>No reviews yet — be the first!</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {selectedMovie.reviews.map((review) => (
                      <div key={review._id} style={{ padding: "12px 14px", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#EEEDFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, color: "#534AB7" }}>
                              {review.username.slice(0, 2).toUpperCase()}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{review.username}</span>
                          </div>
                          <StarRating value={review.rating} size={13} />
                        </div>
                        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{review.review}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
