import { useEffect, useState } from 'react';
import type { BlinkUser } from '@blinkdotnew/sdk';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Search, Calendar, Clock, BookOpen, Trash2, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { db } from '@/firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';

interface PatientData {
  id?: string;
  userId: string;
  userEmail: string; // Agregado: para identificar por email
  anonymousId: string;
  consultationDate: string;
  consultationTime: string;
  reason: string;
  diagnosis: string;
  treatment: string;
  observations: string;
  durationMinutes: number;
  lessonsLearned: string;
  category: string;
  followUpDate: string;
  createdAt?: any;
}

interface PatientsProps {
  user: BlinkUser;
}

export function Patients({ user }: PatientsProps) {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientData | null>(null);

  const initialFormData: Omit<PatientData, 'id' | 'userId' | 'userEmail' | 'createdAt'> = {
    anonymousId: '',
    consultationDate: new Date().toISOString().split('T')[0],
    consultationTime: new Date().toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    }),
    reason: '',
    diagnosis: '',
    treatment: '',
    observations: '',
    durationMinutes: 20,
    lessonsLearned: '',
    category: 'General',
    followUpDate: '',
  };

  const [formData, setFormData] = useState<Omit<PatientData, 'id' | 'userId' | 'userEmail' | 'createdAt'>>(initialFormData);

  // Cargar pacientes - VERSIÓN SIMPLE SIN onSnapshot
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const userEmail = user.email || user.id; // Usar email como identificador
      console.log('Cargando pacientes para:', userEmail);
      
      const q = query(
        collection(db, 'patients'),
        where('userEmail', '==', userEmail)
      );
      
      const querySnapshot = await getDocs(q);
      
      const patientsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as PatientData[];
      
      // Ordenar manualmente por fecha (más reciente primero)
      patientsList.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA;
      });
      
      console.log('Pacientes cargados:', patientsList.length);
      setPatients(patientsList);
      
    } catch (error: any) {
      console.error('Error al cargar pacientes:', error);
      toast.error('Error al cargar pacientes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.anonymousId.trim()) {
      toast.error('El ID Anónimo es obligatorio');
      return;
    }
    
    if (!formData.reason.trim()) {
      toast.error('El motivo de consulta es obligatorio');
      return;
    }

    setIsSaving(true);
    
    try {
      const userEmail = user.email || user.id;
      const dataToSave = {
        userId: user.id,
        userEmail: userEmail, // Guardar el email también
        anonymousId: formData.anonymousId.trim(),
        consultationDate: formData.consultationDate,
        consultationTime: formData.consultationTime,
        reason: formData.reason.trim(),
        diagnosis: formData.diagnosis.trim(),
        treatment: formData.treatment.trim(),
        observations: formData.observations.trim(),
        durationMinutes: Number(formData.durationMinutes) || 20,
        lessonsLearned: formData.lessonsLearned.trim(),
        category: formData.category,
        followUpDate: formData.followUpDate || '',
        createdAt: serverTimestamp(),
      };

      console.log('Guardando paciente:', dataToSave);

      if (editingPatient && editingPatient.id) {
        // Actualizar
        await updateDoc(doc(db, 'patients', editingPatient.id), dataToSave);
        toast.success('✅ Paciente actualizado correctamente');
      } else {
        // Crear
        await addDoc(collection(db, 'patients'), dataToSave);
        toast.success('✅ Paciente registrado correctamente');
      }
      
      // Recargar lista
      await fetchPatients();
      
      // Cerrar diálogo
      setIsDialogOpen(false);
      setEditingPatient(null);
      setFormData(initialFormData);
      
    } catch (error: any) {
      console.error('Error completo:', error);
      
      if (error.code === 'permission-denied') {
        toast.error('❌ Permisos denegados. Verifica las reglas de Firestore');
      } else {
        toast.error('❌ Error al guardar: ' + (error.message || 'Error desconocido'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (patient: PatientData) => {
    setEditingPatient(patient);
    setFormData({
      anonymousId: patient.anonymousId,
      consultationDate: patient.consultationDate,
      consultationTime: patient.consultationTime,
      reason: patient.reason,
      diagnosis: patient.diagnosis,
      treatment: patient.treatment,
      observations: patient.observations,
      durationMinutes: patient.durationMinutes,
      lessonsLearned: patient.lessonsLearned,
      category: patient.category,
      followUpDate: patient.followUpDate,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (patientId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'patients', patientId));
      toast.success('✅ Registro eliminado correctamente');
      await fetchPatients(); // Recargar lista
    } catch (error: any) {
      console.error('Error al eliminar:', error);
      toast.error('❌ Error al eliminar el registro');
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingPatient(null);
      setFormData(initialFormData);
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
          <h1 className="text-3xl font-bold text-foreground font-serif">
            Registro de Pacientes
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tus consultas de forma organizada y confidencial.
          </p>
        </div>
       
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="rounded-full px-6 shadow-lg hover:scale-105 transition-transform">
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Registro
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif">
                {editingPatient ? 'Editar Registro de Paciente' : 'Nuevo Registro de Paciente'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    ID (DNI)*
                  </label>
                  <Input 
                    required 
                    placeholder="ID o nro. de DNI" 
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
                    <option>Obstétrico/Ginecológico</option>
                    <option>Salud mental</option>
                    <option>Geriatrico</option>
                    <option>Oncológico</option>
                    <option>Infectólogico/Transmisible</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Fecha de Consulta
                  </label>
                  <Input 
                    type="date" 
                    value={formData.consultationDate}
                    onChange={e => setFormData({...formData, consultationDate: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Hora de Consulta
                  </label>
                  <Input 
                    type="time" 
                    value={formData.consultationTime}
                    onChange={e => setFormData({...formData, consultationTime: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Duración (minutos)</label>
                  <Input 
                    type="number" 
                    min="1"
                    value={formData.durationMinutes}
                    onChange={e => setFormData({...formData, durationMinutes: Number(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha de Seguimiento</label>
                  <Input 
                    type="date" 
                    value={formData.followUpDate}
                    onChange={e => setFormData({...formData, followUpDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Motivo de Consulta *</label>
                <Textarea 
                  required
                  placeholder="Describe brevemente el motivo de la consulta..."
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Diagnóstico</label>
                <Textarea 
                  placeholder="Diagnóstico o impresión clínica..."
                  value={formData.diagnosis}
                  onChange={e => setFormData({...formData, diagnosis: e.target.value})}
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tratamiento</label>
                <Textarea 
                  placeholder="Tratamiento indicado..."
                  value={formData.treatment}
                  onChange={e => setFormData({...formData, treatment: e.target.value})}
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Seguimiento</label>
                <Textarea 
                  placeholder="Se recomienda anotar la fecha de cada consulta futura..."
                  value={formData.observations}
                  onChange={e => setFormData({...formData, observations: e.target.value})}
                  className="min-h-[60px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Lecciones Aprendidas
                </label>
                <Textarea 
                  placeholder="Reflexiones o aprendizajes del caso..."
                  value={formData.lessonsLearned}
                  onChange={e => setFormData({...formData, lessonsLearned: e.target.value})}
                  className="min-h-[60px]"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full py-6 text-lg font-bold"
                disabled={isSaving}
              >
                {isSaving ? 'Guardando...' : (editingPatient ? 'Actualizar Registro' : 'Guardar Registro')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <Card className="border-none shadow-elegant overflow-hidden">
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <CardTitle className="text-xl font-serif">
              Historial de Consultas ({patients.length} pacientes)
            </CardTitle>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar paciente..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando pacientes...
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No se encontraron resultados' : 'No hay registros aún. Agrega tu primer paciente.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Diagnóstico</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map(patient => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                      {patient.anonymousId}
                    </TableCell>
                    <TableCell>{patient.consultationDate}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{patient.category}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {patient.reason}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {patient.diagnosis || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(patient)}
                          className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="Editar paciente"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => patient.id && handleDelete(patient.id)}
                          className="hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Eliminar paciente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
