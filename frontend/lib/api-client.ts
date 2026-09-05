import axios from "axios";

import { setupInterceptors } from "./api-interceptors";

const apiClient = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

setupInterceptors(apiClient);

export default apiClient;