const API_BASE = "http://localhost:8000/api";

export async function loginUser(name, email) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to log in");
  }
  return res.json();
}

export async function loginAdmin(email, password) {
  const res = await fetch(`${API_BASE}/auth/admin-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to log in as admin");
  }
  return res.json();
}

export async function getUserProfile(userId) {
  const res = await fetch(`${API_BASE}/auth/user/${userId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch user profile");
  }
  return res.json();
}

export async function getConversations(userId) {
  const res = await fetch(`${API_BASE}/conversations?user_id=${userId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch conversations");
  }
  return res.json();
}

export async function getConversationDetails(conversationId, userId) {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}?user_id=${userId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch conversation details");
  }
  return res.json();
}

export async function createConversation(userId, title = "New Conversation") {
  const res = await fetch(`${API_BASE}/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, title }),
  });
  if (!res.ok) {
    throw new Error("Failed to create conversation");
  }
  return res.json();
}

export async function updateConversation(conversationId, title, userId) {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}?user_id=${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    throw new Error("Failed to update conversation");
  }
  return res.json();
}

export async function deleteConversation(conversationId, userId) {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}?user_id=${userId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to delete conversation");
  }
  return res.json();
}

export async function sendChatMessage(userId, conversationId, message) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      conversation_id: conversationId,
      message,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to process chat message");
  }
  return res.json();
}

export async function getDocumentsStatus() {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) {
    throw new Error("Failed to fetch documents status");
  }
  return res.json();
}

export async function triggerReindex() {
  const res = await fetch(`${API_BASE}/documents/ingest`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("Failed to trigger re-index");
  }
  return res.json();
}

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error("Health check failed");
  }
  return res.json();
}

// ============================================================================
// ADMIN API ENDPOINTS
// ============================================================================

export async function getAdminStats(adminId) {
  const res = await fetch(`${API_BASE}/admin/stats?admin_id=${adminId}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch admin stats");
  }
  return res.json();
}

export async function getAdminStudents(adminId, skip = 0, limit = 50) {
  const res = await fetch(
    `${API_BASE}/admin/students?admin_id=${adminId}&skip=${skip}&limit=${limit}`
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch students");
  }
  return res.json();
}

export async function getAdminStudentDetail(adminId, userId) {
  const res = await fetch(`${API_BASE}/admin/students/${userId}?admin_id=${adminId}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch student details");
  }
  return res.json();
}

export async function getAdminStudentConversations(adminId, userId) {
  const res = await fetch(
    `${API_BASE}/admin/students/${userId}/conversations?admin_id=${adminId}`
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch student conversations");
  }
  return res.json();
}

export async function getAdminConversationDetails(adminId, conversationId) {
  const res = await fetch(
    `${API_BASE}/admin/conversations/${conversationId}?admin_id=${adminId}`
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch conversation details");
  }
  return res.json();
}

export async function getAdminActivity(adminId, limit = 20) {
  const res = await fetch(`${API_BASE}/admin/activity?admin_id=${adminId}&limit=${limit}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch recent activity");
  }
  return res.json();
}

export async function getAdminDocuments(adminId) {
  const res = await fetch(`${API_BASE}/admin/documents?admin_id=${adminId}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch documents");
  }
  return res.json();
}
