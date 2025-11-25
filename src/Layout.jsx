import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Menu, 
  X, 
  Home, 
  Building2, 
  Tag, 
  Phone, 
  Heart, 
  Scale, 
  User, 
  LogOut,
  Settings,
  Shield,
  Mail, 
  MessageCircle,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [comparandoCount, setComparandoCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    const updateComparandoCount = () => {
      const saved = localStorage.getItem('comparacao');
      setComparandoCount(saved ? JSON.parse(saved).length : 0);
    };
    
    updateComparandoCount();
    window.addEventListener('storage', updateComparandoCount);
    const interval = setInterval(updateComparandoCount, 1000);
    
    return () => {
      window.removeEventListener('storage', updateComparandoCount);
      clearInterval(interval);
    };
  }, []);

  const navigation = [
    { name: 'Início', path: 'Home', icon: Home },
    { name: 'Imóveis', path: 'Catalogo', icon: Building2 },
    { name: 'Promoções', path: 'Promocoes', icon: Tag },
    { name: 'Contato', path: 'Contato', icon: Phone },
  ];

  const whatsappNumber = '5562994045111';
  const whatsappMessage = encodeURIComponent('Olá! Gostaria de mais informações sobre os imóveis.');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/50 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-3 group">
              <div className="bg-gradient-to-br from-blue-900 to-blue-700 p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">
                  Bosco Imóveis
                </span>
                <p className="text-xs text-slate-500 hidden sm:block">Realizando sonhos</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.path)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-all duration-200"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
              
              <Link
                to={createPageUrl('Favoritos')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-all duration-200"
              >
                <Heart className="w-4 h-4" />
                <span className="font-medium">Favoritos</span>
              </Link>
              
              <Link
                to={createPageUrl('Comparar')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-all duration-200 relative"
              >
                <Scale className="w-4 h-4" />
                <span className="font-medium">Comparar</span>
                {comparandoCount > 0 && (
                  <Badge className="bg-blue-900 text-white h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {comparandoCount}
                  </Badge>
                )}
              </Link>

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative ml-2">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-all duration-200"
                  >
                    <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium">{user?.name?.split(' ')[0]}</span>
                    {isAdmin && (
                      <Badge className="bg-amber-400 text-blue-900 text-xs">Admin</Badge>
                    )}
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                      <Link
                        to="/perfil"
                        className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Meu Perfil
                      </Link>
                      {isAdmin && (
                        <>
                          <hr className="my-2" />
                          <div className="px-4 py-1">
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
              <div className="flex flex-col gap-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.path)}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all duration-200"
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
                <Link
                  to={createPageUrl('Favoritos')}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all duration-200"
                >
                  <Heart className="w-5 h-5" />
                  <span className="font-medium">Favoritos</span>
                </Link>
                <Link
                  to={createPageUrl('Comparar')}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all duration-200"
                >
                  <Scale className="w-5 h-5" />
                  <span className="font-medium">Comparar</span>
                  {comparandoCount > 0 && (
                    <Badge className="bg-blue-900 text-white">{comparandoCount}</Badge>
                  )}
                </Link>
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/perfil"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 transition-all duration-200"
                    >
                      <User className="w-5 h-5" />
                      <span className="font-medium">Meu Perfil</span>
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
                        {/* ✅ NOVO LINK NO MOBILE */}
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
                      className="flex items-center gap-2 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 text-left"
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
          )}
        </nav>
      </header>

      <main>{children}</main>

      {/* WhatsApp Floating Button */}
      <a
        href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 z-50 group"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Fale conosco no WhatsApp
        </span>
      </a>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-900 to-blue-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
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
                      to={createPageUrl(item.path)}
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