import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from './Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import Home from './Pages/Home';
import Catalogo from './Pages/Catalogo';
import Promocoes from './Pages/Promocoes';
import Contato from './Pages/Contato';
import Favoritos from './Pages/Favoritos';
import Detalhes from './Pages/Detalhes';
import GerenciadorImoveis from './Pages/GerenciadorImoveis';
import GerenciarAdmins from './Pages/GerenciarAdmins';
import GerenciarContatos from './Pages/GerenciarContatos';
import Login from './Pages/Login';
import Registro from './Pages/Registro';
import Perfil from './Pages/Perfil';
import RedefinirSenha from './Pages/RedefinirSenha';
import NovaSenha from './Pages/NovaSenha';
import NotFound from './Pages/NotFound';
import { trackPageView } from './utils/analytics'; // ✅ NOVO IMPORT
import Sobre from './Pages/Sobre';

// ✅ NOVO: Wrapper para rastrear navegação
const PageWrapper = ({ Component, pageName }) => {
  React.useEffect(() => {
    trackPageView(window.location.pathname);
  }, []);

  return (
    <Layout currentPageName={pageName}>
      <Component />
    </Layout>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PageWrapper Component={Home} pageName="Home" />,
  },
  {
    path: '/home',
    element: <PageWrapper Component={Home} pageName="Home" />,
  },
  {
    path: '/catalogo',
    element: <PageWrapper Component={Catalogo} pageName="Catalogo" />,
  },
  {
    path: '/promocoes',
    element: <PageWrapper Component={Promocoes} pageName="Promocoes" />,
  },
  {
    path: '/contato',
    element: <PageWrapper Component={Contato} pageName="Contato" />,
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
    path: '/detalhes',
    element: <PageWrapper Component={Detalhes} pageName="Detalhes" />,
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
  {
    path: '/sobre',
    element: <Sobre />,
  },
  // ✅ ROTA 404 (DEVE SER A ÚLTIMA)
  {
    path: '*',
    element: <NotFound />,
  },
]);