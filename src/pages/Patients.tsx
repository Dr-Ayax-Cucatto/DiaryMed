import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Search, Filter, Calendar, Clock, BookOpen } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { db } from '@/firebase'; // ← Esta es la conexión a tu Firebase
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

export function Patients() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    anonymousId: '',
    consultationDate: new Date().toISOString().split('T')[0],
    consultationTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }),
    reason: '',
    diagnosis: '',
    treatment: '',
    observations: '',
    durationMinutes: 20,
    lessonsLearned: '',
    category: 'General',
    followUpDate: '',
  });

  // Cargar pacientes en tiempo real desde Firebase
  useEffect(() => {
    const q = query(collection(db, 'patients'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const patientsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPatients(patientsList);
      setLoading(false);
    }, (error) => {
      console.error(error);
      toast.error('Error al cargar pacientes');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'patients'), {
        ...formData,
        createdAt: serverTimestamp(),
      });

      toast.success('Paciente registrado correctamente');
      setIsDialogOpen(false);
      setFormData({
        ...formData,
        anonymousId: '',
        reason: '',
        diagnosis: '',
        treatment: '',
        observations: '',
        lessonsLearned: '',
        followUpDate: '',
      });
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar el paciente');
    }
  };

  const filteredPatients = patients.filter(p =>
    p.anonymousId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    // ... exactamente el mismo JSX que tenías antes (el formulario y la tabla)
    // Solo copio la parte visual para no hacer el mensaje eterno, pero queda IGUAL
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Todo el header, diálogo y tabla que ya tenías... */}
      {/* Te lo dejo intacto, solo cambia la lógica de arriba */}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-serif">Registro de Pacientes</h1>
          <p className="text-muted-foreground mt-2">Gestiona tus consultas de forma organizada y confidencial.</p>
        </div>
       
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full px-6 shadow-lg hover:scale-105 transition-transform">
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif">Nuevo Registro de Paciente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              {/* Todo el formulario exactamente igual que tenías */}
              {/* Solo copio una parte para que veas que no cambia nada visual */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">ID Anónimo (Código)</label>
                  <Input required placeholder="Ej: PAC-001" value={formData.anonymousId}
                    onChange={e => setFormData({...formData, anonymousId: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoría</label>
                  <select className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option>General</option>
                    <option>Pediátrico</option>
                    <option>Crónico</option>
                    <option>Emergencia</option>
                    <option>Cirugía</option>
                    <option>Seguimiento</option>
                  </select>
                </div>
                {/* ... el resto del formulario igual que antes ... */}
              </div>
              {/* Todos los campos siguen iguales */}
              <Button type="submit" className="w-full py-6 text-lg font-bold">Guardar Registro</Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {/* La tabla también queda exactamente igual */}
      <Card className="border-none shadow-elegant overflow-hidden">
        {/* ... todo el Card con búsqueda y tabla igual ... */}
      </Card>
    </div>
  );
}
