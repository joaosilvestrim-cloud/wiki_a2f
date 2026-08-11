import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUp, ArrowDown, ChevronsRight } from 'lucide-react';

const priorityIcons = {
  'High': <ArrowUp className="h-4 w-4 text-red-500" />,
  'Medium': <ChevronsRight className="h-4 w-4 text-yellow-500" />,
  'Low': <ArrowDown className="h-4 w-4 text-green-500" />,
};

const TaskCard = ({ task }) => {
  return (
    <Card className="bg-card hover:bg-accent transition-colors">
      <CardContent className="p-3">
        <p className="font-semibold text-sm mb-2">{task.title}</p>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {priorityIcons[task.priority]}
            <span className="text-xs font-mono text-muted-foreground">{task.task_key}</span>
            {task.story_points && <span className="text-xs bg-primary/20 text-primary font-bold rounded-full px-2 py-0.5">{task.story_points}</span>}
          </div>
          {task.assignee ? (
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.assignee.avatar_url} alt={task.assignee.name} />
              <AvatarFallback>{task.assignee.name?.[0]}</AvatarFallback>
            </Avatar>
          ) : (
             <div className="h-6 w-6 rounded-full bg-secondary border flex items-center justify-center text-xs text-muted-foreground">?</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;