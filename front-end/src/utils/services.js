import axiosClient from "../api/axios.js";

export const services = {
  auth: {
    login: async (payload) => {
      const { data } = await axiosClient.post("/auth/login", payload);
      return data;
    },
    register: async (payload) => {
      const { data } = await axiosClient.post("/auth/register", { ...payload, role: "CANDIDAT" });
      return data;
    },
  },

  admin: {
    getOverview: async () => {
      const { data } = await axiosClient.get("/admin/stats/overview");
      return data;
    },
    getFilieresStats: async () => {
      const { data } = await axiosClient.get("/admin/stats/filieres");
      return data;
    },
    getUsers: async (params = {}) => {
      const { data } = await axiosClient.get("/admin/users", { params });
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
    runAiScoring: async () => {
      const { data } = await axiosClient.post("/admin/ai/score");
      return data;
    },
    computeFinalScores: async () => {
      const { data } = await axiosClient.post("/admin/final-scores/compute");
      return data;
    },
    getFinalScores: async () => {
      const { data } = await axiosClient.get("/admin/final-scores");
      return data;
    },
    getFormule: async () => {
      const { data } = await axiosClient.get("/admin/formule");
      return data;
    },
    updateFormule: async (payload) => {
      const { data } = await axiosClient.put("/admin/formule", payload);
      return data;
    },
  },

  candidate: {
    apply: async (payload) => {
      const { data } = await axiosClient.post("/candidate/apply", payload);
      return data;
    },
    eligiblePrograms: async () => {
      const { data } = await axiosClient.get("/candidate/eligible-programs");
      return data;
    },
    selectFiliere: async (filiere_id) => {
      const { data } = await axiosClient.post("/candidate/select-filiere", { filiere_id });
      return data;
    },
    uploadDocs: async (formData) => {
      const { data } = await axiosClient.post("/candidate/upload-docs", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    result: async () => {
      const { data } = await axiosClient.get("/candidate/result");
      return data;
    },
    getProfile: async () => {
      const { data } = await axiosClient.get("/candidate/profile");
      return data;
    },
  },

  evaluateur: {
    getCandidates: async (params = {}) => {
      const { data } = await axiosClient.get("/evaluateur/candidates", { params });
      return data;
    },
    getCandidate: async (id) => {
      const { data } = await axiosClient.get(`/evaluateur/candidates/${id}`);
      return data;
    },
    submitNote: async (payload) => {
      const { data } = await axiosClient.post("/evaluateur/notes", payload);
      return data;
    },
    updateNote: async (candidatId, payload) => {
      const { data } = await axiosClient.put(`/evaluateur/notes/${candidatId}`, payload);
      return data;
    },
  },
};

