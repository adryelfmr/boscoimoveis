import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { useAuth } from './contexts/AuthContext';
import { Button } from '@/components/ui/button';
import InstallPWA from '@/components/InstallPWA';
import { 
  Building2, 
  Heart, 
  User, 
  Menu, 
  X, 
  Home,
  LogOut,
  Settings,
  Shield,
  Mail,
  MessageCircle,
  Phone,
  Tag,
  MapPin,
  Scale,  // ✅ ADICIONAR ESTA LINHA
  Users,  // ✅ ADICIONAR ESTA LINHA
  PlusCircle // ✅ ADICIONAR ESTA LINHA (para "Anunciar Grátis")
} from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest('.user-menu')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  // ✅ REMOVER "Comparar" da navegação
  const navigation = [
    { name: 'Início', to: 'Home', icon: Home, path: 'Home' },
    { name: 'Catálogo', to: 'Catalogo', icon: Building2, path: 'Catalogo' },
    { name: 'Promoções', to: 'Promocoes', icon: Tag, path: 'Promocoes' },
    { name: 'Anunciar Grátis', to: '/anunciar', icon: PlusCircle, path: '/anunciar' },
    { name: 'Favoritos', to: 'Favoritos', icon: Heart, path: 'Favoritos' },
    // ❌ REMOVIDO: { name: 'Comparar', to: 'Comparar', icon: Scale, path: 'Comparar' },
    { name: 'Sobre', to: 'Sobre', icon: Users, path: 'Sobre' },
    { name: 'Contato', to: 'Contato', icon: Phone, path: 'Contato' },
  ];

  const whatsappNumber = '5562994045111';
  
  const getWhatsappMessage = () => {
    const userName = user?.name ? ` Meu nome é ${user.name}.` : '';
    
    switch(currentPageName) {
      case 'Catalogo':
        return encodeURIComponent(
          `🏡 *Olá! Vim do catálogo de imóveis.*${userName}\n\n` +
          `Gostaria de mais informações sobre os imóveis disponíveis.\n\n` +
          `📱 Estou navegando em: ${window.location.href}`
        );
      
      case 'Favoritos':
        return encodeURIComponent(
          `❤️ *Olá! Tenho interesse nos imóveis favoritos.*${userName}\n\n` +
          `Gostaria de agendar visitas ou receber mais informações.\n\n` +
          `📱 Estou navegando em: ${window.location.href}`
        );
      
      case 'Promocoes':
        return encodeURIComponent(
          `🎉 *Olá! Vi os imóveis em promoção.*${userName}\n\n` +
          `Gostaria de saber mais sobre as ofertas disponíveis.\n\n` +
          `📱 Estou navegando em: ${window.location.href}`
        );
      
      case 'Contato':
        return encodeURIComponent(
          `📞 *Olá! Estou na página de contato.*${userName}\n\n` +
          `Gostaria de falar com um consultor sobre imóveis.\n\n` +
          `📱 Estou navegando em: ${window.location.href}`
        );
      
      case 'Detalhes':
        return encodeURIComponent(
          `🏠 *Olá! Estou vendo um imóvel específico.*${userName}\n\n` +
          `Gostaria de mais informações sobre este imóvel.\n\n` +
          `📱 Link do imóvel: ${window.location.href}`
        );
      
      default:
        return encodeURIComponent(
          `🏡 *Olá! Vim do site Bosco Imóveis.*${userName}\n\n` +
          `Gostaria de mais informações sobre os imóveis disponíveis.\n\n` +
          `📍 Tenho interesse em imóveis em Goiânia e região.\n\n` +
          `📱 Site: ${window.location.origin}`
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/50 shadow-sm">
        <nav className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-3 group flex-shrink-0">
              <img 
                src="/boscoimoveis.svg" 
                alt="Bosco Imóveis" 
                className="h-10 w-auto group-hover:scale-105 transition-transform duration-200"
              />
              <div className="hidden xl:block">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">
                  Bosco Imóveis
                </span>
                <p className="text-xs text-slate-500">Realizando sonhos</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2 flex-1 justify-center px-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path.startsWith('/') ? item.path : createPageUrl(item.path)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-blue-900 transition-all duration-200 whitespace-nowrap text-sm font-medium"
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Menu / Login Button */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              {isAuthenticated ? (
                <div className="relative user-menu">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all duration-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center text-white font-semibold">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-900 line-clamp-1">{user?.name || 'Usuário'}</p>
                      {isAdmin && (
                        <span className="text-xs text-blue-900 font-semibold">Admin</span>
                      )}
                    </div>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                        <p className="text-xs text-slate-500">{user?.email}</p>
                      </div>
                      
                      <Link
                        to="/perfil"
                        className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Meu Perfil
                      </Link>

                      <Link
                        to="/meus-anuncios"
                        className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Home className="w-4 h-4" />
                        Meus Anúncios
                      </Link>
                      
                      {isAdmin && (
                        <>
                          <div className="px-4 py-2 border-t border-slate-100">
                            <p className="text-xs text-slate-500 font-semibold">ADMINISTRAÇÃO</p>
                          </div>
                          <Link
                            to="/gerenciador"
                            className="flex items-center gap-2 px-4 py-2 text-blue-900 hover:bg-blue-50"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Settings className="w-4 h-4" />
                            Gerenciar Imóveis
                          </Link>
                          <Link
                            to="/gerenciar-admins"
                            className="flex items-center gap-2 px-4 py-2 text-blue-900 hover:bg-blue-50"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Shield className="w-4 h-4" />
                            Gerenciar Admins
                          </Link>
                          <Link
                            to="/gerenciar-contatos"
                            className="flex items-center gap-2 px-4 py-2 text-blue-900 hover:bg-blue-50"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Mail className="w-4 h-4" />
                            Gerenciar Contatos
                          </Link>
                        </>
                      )}
                      <hr className="my-2" />
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login">
                  <Button className="ml-2 bg-blue-900 hover:bg-blue-800">
                    <User className="w-4 h-4 mr-2" />
                    Entrar
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-700" />
              ) : (
                <Menu className="w-6 h-6 text-slate-700" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-slate-200">
              <div className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.path.startsWith('/') ? item.path : createPageUrl(item.path)}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all duration-200"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}

                <div className="border-t border-slate-200 my-2 pt-2">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2 border-b border-slate-100 mb-2">
                        <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                        <p className="text-xs text-slate-500">{user?.email}</p>
                        {isAdmin && (
                          <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-900 px-2 py-1 rounded-full font-semibold">
                            Administrador
                          </span>
                        )}
                      </div>
                      
                      <Link
                        to="/perfil"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all duration-200"
                      >
                        <User className="w-5 h-5" />
                        <span className="font-medium">Meu Perfil</span>
                      </Link>

                      <Link
                        to="/meus-anuncios"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all duration-200"
                      >
                        <Home className="w-5 h-5" />
                        <span className="font-medium">Meus Anúncios</span>
                      </Link>

                      {isAdmin && (
                        <>
                          <div className="px-4 py-2">
                            <p className="text-xs text-slate-500 font-semibold">ADMINISTRAÇÃO</p>
                          </div>
                          <Link
                            to="/gerenciador"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-3 rounded-lg text-blue-900 bg-blue-50 transition-all duration-200"
                          >
                            <Settings className="w-5 h-5" />
                            <span className="font-medium">Gerenciar Imóveis</span>
                          </Link>
                          <Link
                            to="/gerenciar-admins"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-3 rounded-lg text-blue-900 bg-blue-50 transition-all duration-200"
                          >
                            <Shield className="w-5 h-5" />
                            <span className="font-medium">Gerenciar Admins</span>
                          </Link>
                          <Link
                            to="/gerenciar-contatos"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-3 rounded-lg text-blue-900 bg-blue-50 transition-all duration-200"
                          >
                            <Mail className="w-5 h-5" />
                            <span className="font-medium">Gerenciar Contatos</span>
                          </Link>
                        </>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 text-left w-full"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sair</span>
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg bg-blue-900 text-white hover:bg-blue-800 transition-all duration-200"
                    >
                      <User className="w-5 h-5" />
                      <span className="font-medium">Entrar</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      <main>{children}</main>

      <InstallPWA />

      {/* WhatsApp Button */}
      <a
        href={`https://wa.me/${whatsappNumber}?text=${getWhatsappMessage()}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 group"
        aria-label="Falar no WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Fale conosco no WhatsApp
        </span>
      </a>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-900 to-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src="/boscoimoveis.svg" 
                  alt="Bosco Imóveis" 
                  className="h-12 w-auto"
                />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-amber-400">Bosco Imóveis</h3>
              <p className="text-slate-300 mb-4">
                Há mais de 10 anos realizando o sonho da casa própria.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-amber-400">Links Rápidos</h4>
              <ul className="space-y-2">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.path.startsWith('/') ? item.path : createPageUrl(item.path)}
                      className="text-slate-300 hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-amber-400">Contato</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>📧 contato@boscoimoveis.com.br</li>
                <li>📱 (62) 99404-5111</li>
                <li>📍 Goiás, GO</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm text-slate-400">
            <p>&copy; {new Date().getFullYear()} Bosco Imóveis. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
