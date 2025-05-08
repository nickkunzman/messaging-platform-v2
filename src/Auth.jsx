import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import App from "./App";

export default function AuthWrapper() {
  const [session, setSession] = useState(null);
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const checkAuthorization = async () => {
      if (session) {
        const userEmail = session.user.email;
        console.log("🔍 Logged-in email:", userEmail); // ✅ Debug: shows the session email

        const { data, error } = await supabase
          .from("authorized_users")
          .select("*")
          .eq("email", userEmail)

        if (error) {
          console.error("❌ Supabase query error:", error);
        }

        setAuthorized(!!data);
      }
    };

    checkAuthorization();
  }, [session]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert("Error sending login link: " + error.message);
    else alert("✅ Check your email for the login link!");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAuthorized(null);
  };

  if (!session) {
    return (
      <form onSubmit={handleLogin} style={{ padding: 40 }}>
        <h2>Parent Login</h2>
        <input type="email" name="email" placeholder="Enter your email" required />
        <button type="submit">Send Magic Link</button>
      </form>
    );
  }

  if (authorized === false) {
    return (
      <div style={{ padding: 40 }}>
        <p>🚫 Access denied. Your email is not on the authorized list.</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  if (authorized === null) {
    return <p style={{ padding: 40 }}>🔄 Verifying access...</p>;
  }

  return (
    <div style={{ padding: 40 }}>
      <button onClick={handleLogout} style={{ float: "right" }}>
        Logout
      </button>
      <App />
    </div>
  );
}
