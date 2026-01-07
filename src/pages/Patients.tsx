import { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Search, Calendar, Clock, BookOpen, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { db } from '@/firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc,
} from 'firebase/firestore';

interface PatientData {
  id?: string;
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

export function Patients() {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const initialFormData: PatientData = {
    anonymousId: '',
    consultationDate: new Date().toISOString().split('T')[0],
    consultationTime: new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
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

  const [formData, setFormData] = useState<PatientData>(initialFormData);

  // Cargar pacientes en tiempo real
  useEffect(() => {
    const q = query(collection(db, 'patients'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const patientsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PatientData[];

        setPatients(patientsList);
        setLoading(false);
      },
      (error) => {
        console.error('Error al cargar pacientes:', error);
        toast.error('Error al cargar pacientes: ' + error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Función para eliminar paciente
  const handleDelete = async (patientId: string, anonymousId: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el paciente ${anonymousId}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'patients', patientId));
      toast.success('✅ Paciente eliminado correctamente');
      // La lista se actualiza automáticamente gracias a onSnapshot
    } catch (error: any) {
      console.error('Error al eliminar paciente:', error);
      toast.error('❌ Error al eliminar: ' + error.message);
    }
  };

  // Guardar nuevo paciente
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
      const dataToSave = {
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

      await addDoc(collection(db, 'patients'), dataToSave);

      toast.success('✅ Paciente registrado correctamente');
      setIsDialogOpen(false);
      setFormData(initialFormData);
    } catch (error: any) {
      console.error('Error al guardar paciente:', error);

      if (error.code === 'permission-denied') {
        toast.error('❌ Permisos denegados. Verificá las reglas de Firestore');
      } else {
        toast.error('❌ Error al guardar: ' + (error.message || 'Error desconocido'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Filtrar pacientes por búsqueda
  const filteredPatients = patients.filter(
    (p) =>
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full px-6 shadow-lg hover:scale-105 transition-transform">
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Registro
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif">
                Nuevo Registro de Paciente
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">ID Anónimo (Código) *</label>
                  <Input
                    required
                    placeholder="Ej: PAC-001"
                    value={formData.anonymousId}
                    onChange={(e) => setFormData({ ...formData, anonymousId: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoría</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option>General</option>
                    <option>Pediátrico</option>
                    <option>Crónico</option>
                    <option>Emergencia</option>
                    <option>Cirugía</option>
                    <option>Seguimiento</option>
                  </select>
