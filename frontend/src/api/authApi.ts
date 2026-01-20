import axiosClient from "./axiosClient";

export async function login(email: string, password: string) {
  const res = await axiosClient.post("/auth/login", { email, password });
  return res.data as { access_token: string; token_type: string };
}
