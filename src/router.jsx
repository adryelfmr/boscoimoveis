import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from './Layout';
import { ProtectedRoute } from './Components/ProtectedRoute';
import Home from './Pages/Home';
import Catalogo from './Pages/Catalogo';
import Promocoes from './Pages/Promocoes';
import Contato from './Pages/Contato';
import Favoritos from './Pages/Favoritos';
import Comparar from './Pages/Comparar';
import Detalhes from './Pages/Detalhes';
import GerenciadorImoveis from './Pages/GerenciadorImoveis';
import GerenciarAdmins from './Pages/GerenciarAdmins';
import GerenciarContatos from './Pages/GerenciarContatos';
import Login from './Pages/Login';
import Registro from './Pages/Registro';
import Perfil from './Pages/Perfil';
import RedefinirSenha from './Pages/RedefinirSenha'; // ✅ NOVO
import NovaSenha from './Pages/NovaSenha'; // ✅ NOVO

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout currentPageName="Home"><Home /></Layout>,
  },
  {
    path: '/home',
    element: <Layout currentPageName="Home"><Home /></Layout>,
  },
  {
    path: '/catalogo',
    element: <Layout currentPageName="Catalogo"><Catalogo /></Layout>,
  },
  {
    path: '/promocoes',
    element: <Layout currentPageName="Promocoes"><Promocoes /></Layout>,
  },
  {
    path: '/contato',
    element: <Layout currentPageName="Contato"><Contato /></Layout>,
  },
  {
    path: '/favoritos',
    element: (
      <Layout currentPageName="Favoritos">
        <ProtectedRoute>
          <Favoritos />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/comparar',
    element: <Layout currentPageName="Comparar"><Comparar /></Layout>,
  },
  {
    path: '/detalhes',
    element: <Layout currentPageName="Detalhes"><Detalhes /></Layout>,
  },
  {
    path: '/gerenciador',
    element: (
      <Layout currentPageName="Gerenciador">
        <ProtectedRoute requireAdmin={true}>
          <GerenciadorImoveis /> 
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/gerenciar-admins',
    element: (
      <Layout currentPageName="GerenciarAdmins">
        <ProtectedRoute requireAdmin={true}>
          <GerenciarAdmins />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/gerenciar-contatos',
    element: (
      <Layout currentPageName="GerenciarContatos">
        <ProtectedRoute requireAdmin={true}>
          <GerenciarContatos />
        </ProtectedRoute>
      </Layout>
    ),
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/registro',
    element: <Registro />,
  },
  // ✅ NOVAS ROTAS
  {
    path: '/redefinir-senha',
    element: <RedefinirSenha />,
  },
  {
    path: '/nova-senha',
    element: <NovaSenha />,
  },
  {
    path: '/perfil',
    element: (
      <Layout currentPageName="Perfil">
        <ProtectedRoute>
          <Perfil />
        </ProtectedRoute>
      </Layout>
    ),
  },
]);