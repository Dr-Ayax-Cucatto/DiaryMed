import { useEffect, useState } from 'react';
import { blink } from '../lib/blink';
import type { BlinkUser } from '@blinkdotnew/sdk';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, BookOpen, Brain, ShieldAlert, Award, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ReflectionsProps {
  user: BlinkUser;
}

export function Reflections({ user }: ReflectionsProps) {
  const [reflections, setReflections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    learning: '',
    challenges: '',
    achievements: '',
  });

  useEffect(() => {
    fetchReflections();
  }, []);

  const fetchReflections = async () => {
    try {
      const data = await blink.db.reflections.list({
        where: { userId: user.id },
        orderBy: { date: 'desc' }
      });
      setReflections(data);
    } catch (error) {
      console.error('Error fetching reflections:', error);
      toast.error('Error al cargar reflexiones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newReflection = await blink.db.reflections.create({
        ...formData,
        userId: user.id,
      });
      setReflections([newReflection, ...reflections]);
      setIsAdding(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        learning: '',
        challenges: '',
        achievements: '',
      });
      toast.success('Reflexión guardada correctamente');
    } catch (error) {
      console.error('Error creating reflection:', error);
      toast.error('Error al guardar reflexión');
    }
  };

  const deleteReflection = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta reflexión?')) return;
    try {
      await blink.db.reflections.delete(id);
      setReflections(reflections.filter(r => r.id !== id));
      toast.success('Reflexión eliminada');
    } catch (error) {
      console.error('Error deleting reflection:', error);
      toast.error('Error al eliminar reflexión');
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-serif">Diario de Reflexiones</h1>
          <p className="text-muted-foreground mt-2">Un espacio para tu crecimiento personal y profesional.</p>
        </div>
        
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="rounded-full px-6 shadow-lg hover:scale-105 transition-transform">
            <Plus className="w-5 h-5 mr-2" />
            Nueva Reflexión
          </Button>
        )}
      </header>

      {isAdding && (
        <Card className="border-none shadow-xl bg-primary/5 animate-fade-in">
          <CardHeader>
            <CardTitle className="font-serif">¿Qué tal fue tu día hoy?</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="w-full md:w-1/3">
                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <CalendarIcon className="w-4 h-4" /> Fecha
                </label>
                <input 
                  type="date" 
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  required 
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2 text-blue-600">
                    <Brain className="w-4 h-4" /> ¿Qué aprendiste hoy?
                  </label>
                  <Textarea 
                    placeholder="Nuevas técnicas, hallazgos médicos, interacciones con pacientes..." 
                    required 
                    className="min-h-[100px]"
                    value={formData.learning}
                    onChange={e => setFormData({...formData, learning: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-orange-600">
                      <ShieldAlert className="w-4 h-4" /> Desafíos enfrentados
                    </label>
                    <Textarea 
                      placeholder="Situaciones difíciles, dudas, obstáculos..." 
                      className="min-h-[100px]"
                      value={formData.challenges}
                      onChange={e => setFormData({...formData, challenges: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-teal-600">
                      <Award className="w-4 h-4" /> Logros y satisfacciones
                    </label>
                    <Textarea 
                      placeholder="Éxitos clínicos, gratitud de pacientes, metas cumplidas..." 
                      className="min-h-[100px]"
                      value={formData.achievements}
                      onChange={e => setFormData({...formData, achievements: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1 py-6 text-lg font-bold">Guardar Reflexión</Button>
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="px-8">Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {loading ? (
          <p className="text-center text-muted-foreground italic py-12">Cargando reflexiones...</p>
        ) : reflections.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground italic">Aún no has guardado reflexiones. Comienza hoy escribiendo tus aprendizajes.</p>
          </div>
        ) : (
          reflections.map((reflection) => (
            <Card key={reflection.id} className="border-none shadow-elegant hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-2 rounded-xl text-primary font-bold">
                    {new Date(reflection.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </div>
                  <CardTitle className="font-serif text-xl">Bitácora del Día</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                  onClick={() => deleteReflection(reflection.id)}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
                    <Brain className="w-4 h-4" /> Aprendizaje
                  </h4>
                  <p className="text-foreground leading-relaxed">{reflection.learning}</p>
                </div>
                
                {(reflection.challenges || reflection.achievements) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-muted">
                    {reflection.challenges && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-orange-600 flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4" /> Desafíos
                        </h4>
                        <p className="text-muted-foreground text-sm italic">{reflection.challenges}</p>
                      </div>
                    )}
                    {reflection.achievements && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-teal-600 flex items-center gap-2">
                          <Award className="w-4 h-4" /> Logros
                        </h4>
                        <p className="text-muted-foreground text-sm italic">{reflection.achievements}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
