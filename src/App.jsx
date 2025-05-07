import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    fetchMessages();
    const subscription = supabase
      .channel("messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        fetchMessages();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  async function fetchMessages() {
    const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: true });
    setMessages(data || []);
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;
    await supabase.from("messages").insert({ content: newMessage });
    setNewMessage("");
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>📨 Messaging App</h1>
      <div style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "20px" }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
            {msg.content}
          </div>
        ))}
      </div>
      <input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type a message..."
        style={{ padding: "10px", width: "300px" }}
      />
      <button onClick={sendMessage} style={{ marginLeft: "10px", padding: "10px" }}>
        Send
      </button>
    </div>
  );
}
