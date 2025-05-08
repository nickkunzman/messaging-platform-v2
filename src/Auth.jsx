import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import App from "./App";

export default function AuthWrapper() {
  const [session, setSession] = useState(undefined);
  const [authorized, setAuthorized] = useState(null);
  const [studentRecords, setStudentRecords] = useState([]);

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
      let userEmail = null;

      if (session?.user) {
        userEmail = session.user.email;
      } else {
        const { data: userData, error } = await supabase.auth.getUser();
        if (error) {
          console.error("❌ Fallback getUser() failed:", error);
          setAuthorized(false);
          return;
        }
        userEmail = userData?.user?.email;
      }

      console.log("🔍 Using email:", userEmail);

      if (!userEmail) {
        setAuthorized(false);
        return;
      }

      const { data, error } = await supabase
        .from("authorized_users")
        .select("*")
        .eq("email", userEmail);

      console.log("Returned from Supabase:", data);

      if (error) {
        console.error("❌ Supabase query error:", error);
      }

      if (data && data.length > 0) {
        setAuthorized(true);
        setStudentRecords(data);
      } else {
        setAuthorized(false);
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
    setStudentRecords([]);
  };

  if (session === undefined) {
    return <p style={{ padding: 40 }}>🔄 Loading session...</p>;
  }

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
