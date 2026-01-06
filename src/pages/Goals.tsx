import { useEffect, useState } from 'react';
import { blink } from '../lib/blink';
import type { BlinkUser } from '@blinkdotnew/sdk';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Plus, Target, CheckCircle2, Circle, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

interface GoalsProps {
  user: BlinkUser;
}

export function Goals({ user }: GoalsProps) {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState('');
  const [targetDate, setTargetDate] = useState('');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const data = await blink.db.professionalGoals.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      });
      setGoals(data);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Error al cargar metas');
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    try {
      const goal = await blink.db.professionalGoals.create({
        goal: newGoal,
        targetDate,
        status: 'pending',
        userId: user.id,
      });
      setGoals([goal, ...goals]);
      setNewGoal('');
      setTargetDate('');
      toast.success('Meta añadida');
    } catch (error) {
      console.error('Error adding goal:', error);
      toast.error('Error al añadir meta');
    }
  };

  const toggleGoal = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    try {
      await blink.db.professionalGoals.update(id, { status: newStatus });
      setGoals(goals.map(g => g.id === id ? { ...g, status: newStatus } : g));
      if (newStatus === 'completed') toast.success('¡Meta cumplida!');
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Error al actualizar meta');
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await blink.db.professionalGoals.delete(id);
      setGoals(goals.filter(g => g.id !== id));
      toast.success('Meta eliminada');
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Error al eliminar meta');
    }
  };

  const pendingGoals = goals.filter(g => g.status === 'pending');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold text-foreground font-serif">Metas Profesionales</h1>
        <p className="text-muted-foreground mt-2">Traza tu camino hacia la excelencia médica.</p>
      </header>

      <Card className="border-none shadow-elegant bg-primary/5">
        <CardContent className="p-6">
          <form onSubmit={addGoal} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input 
                placeholder="Nueva meta profesional (ej: Certificación en...)" 
                className="bg-background border-none shadow-sm h-12"
                value={newGoal}
                onChange={e => setNewGoal(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Input 
                type="date" 
                className="bg-background border-none shadow-sm h-12"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
              />
            </div>
            <Button type="submit" className="h-12 px-8 rounded-xl shadow-lg hover:scale-105 transition-transform">
              <Plus className="w-5 h-5 mr-2" />
              Añadir
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Circle className="w-4 h-4 text-orange-500" /> Pendientes ({pendingGoals.length})
          </h3>
          <div className="grid gap-4">
            {pendingGoals.length === 0 && !loading && (
              <p className="text-muted-foreground italic text-center py-8">No tienes metas pendientes. ¡Añade una!</p>
            )}
            {pendingGoals.map((goal) => (
              <Card key={goal.id} className="border-none shadow-sm hover:shadow-md transition-all group">
                <CardContent className="p-4 flex items-center gap-4">
                  <button onClick={() => toggleGoal(goal.id, goal.status)} className="text-muted-foreground hover:text-primary transition-colors">
                    <Circle className="w-6 h-6" />
                  </button>
                  <div className="flex-1">
                    <p className="font-medium text-lg">{goal.goal}</p>
                    {goal.targetDate && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>Para el {new Date(goal.targetDate).toLocaleDateString('es-ES')}</span>
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                    onClick={() => deleteGoal(goal.id)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {completedGoals.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500" /> Completadas ({completedGoals.length})
            </h3>
            <div className="grid gap-4 opacity-70">
              {completedGoals.map((goal) => (
                <Card key={goal.id} className="border-none shadow-sm bg-muted/30 group">
                  <CardContent className="p-4 flex items-center gap-4">
                    <button onClick={() => toggleGoal(goal.id, goal.status)} className="text-teal-500 transition-colors">
                      <CheckCircle2 className="w-6 h-6" />
                    </button>
                    <div className="flex-1">
                      <p className="font-medium text-lg line-through text-muted-foreground">{goal.goal}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>

      {loading && <p className="text-center text-muted-foreground italic">Cargando metas...</p>}
    </div>
  );
}
