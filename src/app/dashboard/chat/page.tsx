"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot } from "firebase/firestore";

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    const q = query(collection(db, "chats"), orderBy("timestamp"));
    const unsub = onSnapshot(q, (snapshot) =>
      setMessages(snapshot.docs.map((doc) => doc.data()))
    );
    return () => unsub();
  }, []);

  const sendMessage = async () => {
    if (text.trim()) {
      await addDoc(collection(db, "chats"), {
        text,
        timestamp: new Date(),
      });
      setText("");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Chat</h2>
      <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-white">
        {messages.map((msg, i) => (
          <div key={i} className="p-2 border-b">
            {msg.text}
          </div>
        ))}
      </div>
      <div className="mt-4 flex">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type message..."
          className="flex-1 border p-2 rounded-l"
        />
        <button onClick={sendMessage} className="bg-blue-500 text-white px-4 rounded-r">
          Send
        </button>
      </div>
    </div>
  );
}
