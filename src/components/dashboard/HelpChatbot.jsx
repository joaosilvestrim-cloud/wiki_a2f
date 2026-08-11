import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { HelpCircle, X, Bot, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const knowledgeBase = {
  'Início': "A tela 'Início' é seu painel principal. Aqui você vê um resumo de tudo: próximos eventos, atividades recentes e atalhos para as áreas mais importantes.",
  'Meus Documentos': "Em 'Meus Documentos', você pode fazer upload, gerenciar e acessar seus arquivos pessoais e profissionais de forma segura. É o seu portal de documentos, ideal para enviar arquivos como holerites, atestados médicos, certificados de cursos, contratos e comprovantes de férias.",
  'Funcionários': "A página 'Funcionários' é o diretório da empresa. Encontre informações de contato, cargo e departamento de todos os seus colegas.",
  'Projetos': "Aqui você pode visualizar e acompanhar o andamento de todos os projetos da empresa, vendo status, progresso e responsáveis.",
  'Documentos': "Esta é a biblioteca central de documentos da empresa. Acesse manuais, relatórios, políticas e outros arquivos compartilhados com todos.",
  'Navegação': "A seção 'Navegação' contém links diretos para páginas de conteúdo importantes, como o 'Mural de Notícias' e a página 'Conheça a Equipe'.",
  'Configurações': "Em 'Configurações', você pode personalizar seu perfil, alterar sua senha, ajustar as preferências de notificação e o tema da plataforma.",
  'Sair': "Use esta opção para encerrar sua sessão e sair da intranet com segurança.",
};

const initialQuestions = [
  "O que faz o menu 'Início'?",
  "Para que serve 'Meus Documentos'?",
  "O que encontro em 'Funcionários'?",
  "Como vejo o Mural de Notícias?",
];

const HelpChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          sender: 'bot',
          text: `Olá, ${user?.name}! Sou seu assistente virtual. Como posso ajudar?`,
          options: initialQuestions,
        },
      ]);
    }
  }, [isOpen, user]);

  const handleQuestionClick = (question) => {
    const userMessage = { sender: 'user', text: question };
    
    let keyword;
    if (question.toLowerCase().includes('mural')) {
      keyword = 'Navegação';
    } else {
      keyword = Object.keys(knowledgeBase).find(key => question.toLowerCase().includes(key.toLowerCase()));
    }

    const answer = keyword ? knowledgeBase[keyword] : "Desculpe, não entendi a pergunta. Tente uma das opções.";

    const botMessage = { sender: 'bot', text: answer, options: initialQuestions };

    setMessages(prev => [...prev.filter(m => m.sender !== 'user'), userMessage, botMessage]);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Button
            onClick={() => setIsOpen(!isOpen)}
            size="icon"
            className="rounded-full w-16 h-16 bg-gradient-to-r from-primary to-accent shadow-lg"
          >
            {isOpen ? <X className="w-8 h-8" /> : <HelpCircle className="w-8 h-8" />}
          </Button>
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-24 right-6 z-50 w-[350px] h-[500px] bg-card shadow-2xl rounded-2xl border border-border flex flex-col overflow-hidden"
          >
            <header className="p-4 bg-secondary/50 border-b border-border flex items-center space-x-3">
              <div className="p-2 bg-primary/20 rounded-full">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Central de Ajuda</h3>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </header>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && <Bot className="w-6 h-6 text-primary flex-shrink-0" />}
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-secondary text-secondary-foreground rounded-bl-none'
                    }`}
                  >
                    <p>{msg.text}</p>
                    {msg.sender === 'bot' && msg.options && (
                      <div className="mt-3 space-y-2">
                        {msg.options.map((option, i) => (
                          <button
                            key={i}
                            onClick={() => handleQuestionClick(option)}
                            className="w-full text-left text-primary text-xs font-semibold p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                   {msg.sender === 'user' && <User className="w-6 h-6 text-muted-foreground flex-shrink-0" />}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HelpChatbot;