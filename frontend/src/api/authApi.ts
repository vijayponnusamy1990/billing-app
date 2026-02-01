import axiosClient from "./axiosClient";

export async function login(email: string, password: string, ownerId: number) {
  const res = await axiosClient.post("/auth/login", { email, password, owner_id: ownerId });
  return res.data as { access_token: string; token_type: string };
}
