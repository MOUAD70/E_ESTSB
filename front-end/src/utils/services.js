import axiosClient from "../api/axios.js";

export const services = {
  auth: {
    login: async (loginInfo) => {
      const { data } = await axiosClient.post("/auth/login", loginInfo);
      return data;
    },

    register: async (registerInfo) => {
      const { data } = await axiosClient.post("/auth/register", {
        ...registerInfo,
        role: "CANDIDAT",
      });
      return data;
    },
  },
  admin: {
    // DASHBOARD DATA
    getOverview: async () => {
      const { data } = await axiosClient.get("/admin/stats/overview");
      return data;
    },
    getFilieresStats: async () => {
      const { data } = await axiosClient.get("/admin/stats/filieres");
      return data;
    },

    // USERS CRUD OPERATIONS
    getUsers: async () => {
      const { data } = await axiosClient.get("/admin/users");
      return data;
    },
    getUser: async (id) => {
      const { data } = await axiosClient.get(`/admin/users/${id}`);
      return data;
    },
    createUser: async (payload) => {
      const { data } = await axiosClient.post("/admin/users", payload);
      return data;
    },
    updateUser: async (id, payload) => {
      const { data } = await axiosClient.put(`/admin/users/${id}`, payload);
      return data;
    },
    deleteUser: async (id) => {
      const { data } = await axiosClient.delete(`/admin/users/${id}`);
      return data;
    },

    // SCORING ACTIONS
    runAiScoring: async () => {
      const { data } = await axiosClient.post("/admin/ai/score");
      return data;
    },
    computeFinalScores: async () => {
      const { data } = await axiosClient.post("/admin/final-scores/compute");
      return data;
    },

    // GET FINAL SCORE
    getFinalScores: async () => {
      const { data } = await axiosClient.get("/admin/final-scores");
      return data;
    },
  },
};
