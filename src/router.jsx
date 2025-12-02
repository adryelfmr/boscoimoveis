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
import Sobre from './Pages/Sobre';
import AnunciarImovel from './Pages/AnunciarImovel';
import MeusAnuncios from './Pages/MeusAnuncios';
import { trackPageView } from './utils/analytics';
import AceitarConvite from '@/Pages/AceitarConvite';

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
      <ProtectedRoute>
        <PageWrapper Component={Favoritos} pageName="Favoritos" />
      </ProtectedRoute>
    ),
  },
  {
    path: '/detalhes',
    element: <PageWrapper Component={Detalhes} pageName="Detalhes" />,
  },
  {
    path: '/sobre',
    element: <PageWrapper Component={Sobre} pageName="Sobre" />,
  },
  // ✅ ADICIONAR estas rotas:
  {
    path: '/anunciar',
    element: (
      <ProtectedRoute>
        <PageWrapper Component={AnunciarImovel} pageName="Anunciar" />
      </ProtectedRoute>
    ),
  },
  {
    path: '/meus-anuncios',
    element: (
      <ProtectedRoute>
        <PageWrapper Component={MeusAnuncios} pageName="MeusAnuncios" />
      </ProtectedRoute>
    ),
  },
  {
    path: '/gerenciador',
    element: (
      <ProtectedRoute>
        <PageWrapper Component={GerenciadorImoveis} pageName="Gerenciador" />
      </ProtectedRoute>
    ),
  },
  {
    path: '/gerenciar-admins',
    element: (
      <ProtectedRoute>
        <PageWrapper Component={GerenciarAdmins} pageName="GerenciarAdmins" />
      </ProtectedRoute>
    ),
  },
  {
    path: '/gerenciar-contatos',
    element: (
      <ProtectedRoute>
        <PageWrapper Component={GerenciarContatos} pageName="GerenciarContatos" />
      </ProtectedRoute>
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
    path: '/perfil',
    element: (
      <ProtectedRoute>
        <PageWrapper Component={Perfil} pageName="Perfil" />
      </ProtectedRoute>
    ),
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
    path: '/aceitar-convite',
    element: <AceitarConvite />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);