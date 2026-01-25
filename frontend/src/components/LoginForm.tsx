import { useState } from "react";
import axiosClient from "../api/axiosClient";
import { jwtDecode } from "jwt-decode";

interface Props {
  onLogin: () => void;
}

export default function LoginForm({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axiosClient.post("/auth/login", { email, password });
      const token = res.data.access_token;
      localStorage.setItem("token", token);

      const decoded: any = jwtDecode(token);
      localStorage.setItem("role", decoded.role);

      onLogin();
    } catch (err) {
      console.error(err);
      setError("Invalid credentials used");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-blue-400"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
