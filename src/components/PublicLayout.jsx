import React from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const publicNavLinks = [
  { name: "Mural", href: "/page/mural" },
  { name: "Comercial", href: "/page/comercial" },
  { name: "Comunicação", href: "/page/comunicacao" },
  { name: "Equipe", href: "/page/equipe" },
  { name: "Empresa", href: "/page/empresa" },
  { name: "Políticas", href: "/page/politicas" },
  { name: "RH", href: "/page/rh" },
  { name: "Ferramentas", href: "/page/ferramentas" },
  { name: "Educacional", href: "/page/educacional" },
  { name: "FAQ", href: "/page/faq" },
];

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card/80 backdrop-blur-lg border-b border-border sticky top-0 z-30">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <img src="https://horizons-cdn.hostinger.com/d3ba95b5-e5fd-4cdf-8fb4-fbdb2a8481f8/86f01f983c82d635638fb5b02792fb9b.png" alt="A2F Logo" className="h-8" />
            </Link>
            <div className="hidden md:flex md:space-x-4">
              {publicNavLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.href}
                  className={({ isActive }) =>
                    cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/20 text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;