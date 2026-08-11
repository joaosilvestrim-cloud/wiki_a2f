import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Users } from 'lucide-react';

const TeamViewer = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        console.error("Error fetching team members:", error);
      } else {
        setMembers(data);
      }
      setLoading(false);
    };
    fetchMembers();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-foreground mb-2 text-center">Conheça a Nossa Equipe</h1>
      <p className="text-muted-foreground text-center mb-12">As pessoas que fazem a A2F acontecer.</p>
      {members.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {members.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="card text-center p-6 transform hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="relative inline-block">
                <img 
                  src={member.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} 
                  alt={member.name} 
                  className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-primary/50" 
                />
              </div>
              <h2 className="text-xl font-bold text-foreground">{member.name}</h2>
              <p className="text-primary font-semibold mb-2">{member.role}</p>
              <p className="text-sm text-muted-foreground">{member.bio}</p>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 card">
          <Users className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground">Nossa equipe está se formando.</h2>
          <p className="text-muted-foreground mt-2">Os perfis dos membros da equipe ainda não foram adicionados. Volte em breve!</p>
        </div>
      )}
    </div>
  );
};

export default TeamViewer;