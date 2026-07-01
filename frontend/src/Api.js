import { API_URL } from "./Constants";

export const fetchComToken = async (endpoint, method = "GET", body = null) => {
  const sessionData = localStorage.getItem("juventudetech_session");
  const session = sessionData ? JSON.parse(sessionData) : null;
  const token = session?.userData?.token;

  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_URL}${endpoint}`, config);
    if (res.status === 401) {
      localStorage.removeItem("juventudetech_session");
      window.location.reload();
      return res;
    }
    return res;
  } catch (error) {
    console.error("Erro na requisição:", error);
    throw error;
  }
};
