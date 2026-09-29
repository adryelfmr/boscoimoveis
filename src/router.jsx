import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Loader2 } from 'lucide-react';
import { trackPageView } from './utils/analytics';

const Home = React.lazy(() => import('./Pages/Home'));
const Catalogo = React.lazy(() => import('./Pages/Catalogo'));
const Promocoes = React.lazy(() => import('./Pages/Promocoes'));
const Contato = React.lazy(() => import('./Pages/Contato'));
const Favoritos = React.lazy(() => import('./Pages/Favoritos'));
const Detalhes = React.lazy(() => import('./Pages/Detalhes'));
const GerenciadorImoveis = React.lazy(() => import('./Pages/GerenciadorImoveis'));
const GerenciarAdmins = React.lazy(() => import('./Pages/GerenciarAdmins'));
const GerenciarContatos = React.lazy(() => import('./Pages/GerenciarContatos'));
const Login = React.lazy(() => import('./Pages/Login'));
const Registro = React.lazy(() => import('./Pages/Registro'));
const Perfil = React.lazy(() => import('./Pages/Perfil'));
const RedefinirSenha = React.lazy(() => import('./Pages/RedefinirSenha'));
const NovaSenha = React.lazy(() => import('./Pages/NovaSenha'));
const NotFound = React.lazy(() => import('./Pages/NotFound'));
const Sobre = React.lazy(() => import('./Pages/Sobre'));
const AnunciarImovel = React.lazy(() => import('./Pages/AnunciarImovel'));
const AceitarConvite = React.lazy(() => import('./Pages/AceitarConvite'));

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="w-10 h-10 text-blue-900 animate-spin" />
  </div>
);

const PageWrapper = ({ Component, pageName }) => {
  React.useEffect(() => {
    trackPageView(window.location.pathname);
  }, []);

  return (
    <Layout currentPageName={pageName}>
      <Suspense fallback={<PageFallback />}>
        <Component />
      </Suspense>
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
  {
    path: '/anunciar',
    element: (
      <ProtectedRoute requireAdmin>
        <PageWrapper Component={AnunciarImovel} pageName="Anunciar" />
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
    element: (
      <Suspense fallback={<PageFallback />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/registro',
    element: (
      <Suspense fallback={<PageFallback />}>
        <Registro />
      </Suspense>
    ),
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
    element: (
      <Suspense fallback={<PageFallback />}>
        <RedefinirSenha />
      </Suspense>
    ),
  },
  {
    path: '/nova-senha',
    element: (
      <Suspense fallback={<PageFallback />}>
        <NovaSenha />
      </Suspense>
    ),
  },
  {
    path: '/aceitar-convite',
    element: (
      <Suspense fallback={<PageFallback />}>
        <AceitarConvite />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<PageFallback />}>
        <NotFound />
      </Suspense>
    ),
  },
]);