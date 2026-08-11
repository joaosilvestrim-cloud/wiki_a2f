import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { WifiOff, Database, Wifi } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const ConnectionStatus = () => {
  const { connectionStatus } = useAuth();

  // If fully connected, we can hide it or show a subtle success state in debug
  if (connectionStatus.online && connectionStatus.supabaseConnected) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-center p-2 rounded-full text-green-500/50 hover:bg-secondary transition-colors cursor-help">
              <Wifi className="w-4 h-4" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sistema online e conectado ao banco</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center p-2 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors cursor-help animate-pulse">
            {!connectionStatus.online ? <WifiOff className="w-4 h-4" /> : <Database className="w-4 h-4" />}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {!connectionStatus.online 
              ? "Aviso: Sem conexão com a Internet" 
              : "Aviso: Não foi possível conectar ao banco de dados"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};