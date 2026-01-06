import { useEffect, useState } from 'react';
import { blink } from '../lib/blink';
import type { BlinkUser } from '@blinkdotnew/sdk';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Search, Filter, Calendar, Clock, BookOpen, Stethoscope } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PatientsProps {
  user: BlinkUser;
}

export function Patients({ user }: PatientsProps) {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
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

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const data = await blink.db.patients.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      });
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newPatient = await blink.db.patients.create({
        ...formData,
        userId: user.id,
      });
      setPatients([newPatient, ...patients]);
      setIsDialogOpen(false);
      setFormData({
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
      toast.success('Paciente registrado correctamente');
    } catch (error) {
      console.error('Error creating patient:', error);
      toast.error('Error al registrar paciente');
    }
  };

  const filteredPatients = patients.filter(p => 
    p.anonymousId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">ID Anónimo (Código)</label>
                  <Input 
                    required 
                    placeholder="Ej: PAC-001" 
                    value={formData.anonymousId}
                    onChange={e => setFormData({...formData, anonymousId: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoría</label>
                  <select 
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option>General</option>
                    <option>Pediátrico</option>
                    <option>Crónico</option>
                    <option>Emergencia</option>
                    <option>Cirugía</option>
                    <option>Seguimiento</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Fecha
                  </label>
                  <Input 
                    type="date" 
                    required 
                    value={formData.consultationDate}
                    onChange={e => setFormData({...formData, consultationDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Hora
                  </label>
                  <Input 
                    type="time" 
                    required 
                    value={formData.consultationTime}
                    onChange={e => setFormData({...formData, consultationTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Motivo de Consulta</label>
                <Input 
                  required 
                  placeholder="Ej: Dolor abdominal persistente" 
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Diagnóstico</label>
                  <Textarea 
                    placeholder="Diagnóstico preliminar o final..." 
                    value={formData.diagnosis}
                    onChange={e => setFormData({...formData, diagnosis: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tratamiento</label>
                  <Textarea 
                    placeholder="Medicamentos, dosis, recomendaciones..." 
                    value={formData.treatment}
                    onChange={e => setFormData({...formData, treatment: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Lecciones Aprendidas / Notas
                </label>
                <Textarea 
                  placeholder="¿Qué aprendiste de este caso? Desafíos enfrentados..." 
                  value={formData.lessonsLearned}
                  onChange={e => setFormData({...formData, lessonsLearned: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duración (minutos)</label>
                  <Input 
                    type="number" 
                    value={formData.durationMinutes}
                    onChange={e => setFormData({...formData, durationMinutes: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Próximo Seguimiento (Opcional)
                  </label>
                  <Input 
                    type="date" 
                    value={formData.followUpDate}
                    onChange={e => setFormData({...formData, followUpDate: e.target.value})}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full py-6 text-lg font-bold">Guardar Registro</Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <Card className="border-none shadow-elegant overflow-hidden">
        <CardHeader className="bg-muted/30 pb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <CardTitle className="text-xl font-serif">Historial de Consultas</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar paciente..." 
                  className="pl-10 w-full md:w-64 bg-background border-none shadow-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Filter className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="w-32">Fecha</TableHead>
                  <TableHead className="w-32">ID Anónimo</TableHead>
                  <TableHead className="w-48">Motivo</TableHead>
                  <TableHead className="w-48">Diagnóstico</TableHead>
                  <TableHead className="w-32">Categoría</TableHead>
                  <TableHead className="w-24 text-right">Duración</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">Cargando registros...</TableCell>
                  </TableRow>
                ) : filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">No se encontraron registros.</TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((patient) => (
                    <TableRow key={patient.id} className="hover:bg-muted/50 cursor-pointer transition-colors group">
                      <TableCell className="font-medium">
                        {new Date(patient.consultationDate).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>
                        <code className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">{patient.anonymousId}</code>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{patient.reason}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground italic">{patient.diagnosis || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-sidebar-accent text-sidebar-accent-foreground border-none">
                          {patient.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{patient.durationMinutes}m</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
