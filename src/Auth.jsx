import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import App from "./App";

export default function AuthWrapper() {
  const [session, setSession] = useState(null);
  const [authorized, setAuthorized] = useState(null);
  const [studentRecords, setStudentRecords] = useState([]);

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

  useEffect(() => {
    const checkAuthorization = async () => {
      if (!session?.user?.email) return;
      const userEmail = session.user.email;
      console.log("🔍 Checking access for:", userEmail);

      const { data, error } = await supabase
        .from("authorized_users")
        .select("*")
        .eq("email", userEmail);

      if (error) {
        console.error("❌ Supabase query error:", error);
        setAuthorized(false);
        return;
      }

      if (data?.length > 0) {
        setAuthorized(true);
        setStudentRecords(data);
      } else {
        setAuthorized(false);
      }
    };

    checkAuthorization();
  }, [session]);

  const handleSignup = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert("Sign-up error: " + error.message);
    else alert("✅ Check your email to confirm your account, then log in.");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Login error: " + error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAuthorized(null);
    setStudentRecords([]);
  };

  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Parent Login</h2>
        <form onSubmit={handleLogin}>
          <input type="email" name="email" placeholder="Email" required />
          <br />
          <input type="password" name="password" placeholder="Password" required />
          <br />
          <button type="submit">Log In</button>
        </form>
        <hr />
        <h3>New? Sign Up:</h3>
        <form onSubmit={handleSignup}>
          <input type="email" name="email" placeholder="Email" required />
          <br />
          <input type="password" name="password" placeholder="Password" required />
          <br />
          <button type="submit">Sign Up</button>
        </form>
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
      <button onClick={handleLogout} style={{ float: "right" }}>
        Logout
      </button>
      <h2>Welcome, {studentRecords[0]?.parent_name}</h2>
      <p>Students:</p>
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
