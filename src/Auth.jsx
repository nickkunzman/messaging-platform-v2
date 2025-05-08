import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import App from "./App";

export default function AuthWrapper() {
  const [session, setSession] = useState(null);
  const [authorized, setAuthorized] = useState(null);
  const [studentRecords, setStudentRecords] = useState([]);
  const [authMode, setAuthMode] = useState("login");
  const [errorMsg, setErrorMsg] = useState("");

  // Session listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener?.unsubscribe();
    };
  }, []);

  // Authorization check
  useEffect(() => {
    const checkAuthorization = async () => {
      if (!session) return;

      const userEmail = session?.user?.email;

      const { data, error } = await supabase
        .from("authorized_users")
        .select("*")
        .eq("email", userEmail);

      if (error || !data || data.length === 0) {
        setAuthorized(false);
        return;
      }

      setAuthorized(true);
      setStudentRecords(data);
    };

    checkAuthorization();
  }, [session]);

  // Handle auth form submission
  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    try {
      if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAuthorized(null);
    setStudentRecords([]);
    setErrorMsg("");
    setAuthMode("login");
  };

  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h2>{authMode === "login" ? "Log In" : "Sign Up"}</h2>
        <form onSubmit={handleAuth} style={{ marginBottom: 20 }}>
          <input type="email" name="email" placeholder="Email" required style={{ display: "block", margin: "10px 0" }} />
          <input type="password" name="password" placeholder="Password" required style={{ display: "block", margin: "10px 0" }} />
          <button type="submit">{authMode === "login" ? "Log In" : "Sign Up"}</button>
        </form>
        {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
        <p style={{ marginTop: 10 }}>
          {authMode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setErrorMsg(""); }}>
            {authMode === "login" ? "Sign Up" : "Log In"}
          </button>
        </p>
      </div>
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
      <button onClick={handleLogout} style={{ float: "right" }}>Logout</button>
      <h2>Welcome!</h2>
      <p>Your students:</p>
      <ul>
        {studentRecords.map((record, index) => (
          <li key={index}>
            {record.student_name} – Grade {record.grade}
            {record.teacher ? ` – ${record.teacher}` : ""}
          </li>
        ))}
      </ul>
      <hr style={{ margin: "20px 0" }} />
      <App />
    </div>
  );
}
