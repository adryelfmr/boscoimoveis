import { Client, Account, Databases, Storage, Query, ID, Teams } from 'appwrite';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const teams = new Teams(client); // ADICIONE ESTA LINHA

export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const ADMIN_TEAM_ID = import.meta.env.VITE_APPWRITE_ADMIN_TEAM_ID; // ADICIONE ESTA LINHA

export const COLLECTIONS = {
  IMOVEIS: import.meta.env.VITE_APPWRITE_COLLECTION_IMOVEIS,
  FAVORITOS: import.meta.env.VITE_APPWRITE_COLLECTION_FAVORITOS,
  VISUALIZACOES: import.meta.env.VITE_APPWRITE_COLLECTION_VISUALIZACOES,
  COMPARACOES: import.meta.env.VITE_APPWRITE_COLLECTION_COMPARACOES,
  ALERTAS: import.meta.env.VITE_APPWRITE_COLLECTION_ALERTAS,
};

export const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID;

export { Query, ID, client };